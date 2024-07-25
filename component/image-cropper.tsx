"use client";

import { useRef, useState } from "react";
import ReactCrop, {
  Crop,
  centerCrop,
  convertToPixelCrop,
  makeAspectCrop,
} from "react-image-crop";
import { ClipLoader } from "react-spinners";
import { Button } from "@/components/ui/button";
import "react-image-crop/dist/ReactCrop.css";
import { fileToBase64 } from "@/lib/utils";

const ASPECT_RATIO = 3 / 4;
const MIN_DIMENSION = 150;

interface NormalizedVertex {
  x: number;
  y: number;
}

interface BoundingPoly {
  normalizedVertices: NormalizedVertex[];
}

interface ObjectAnnotation {
  name?: string;
  score?: number;
  boundingPoly?: BoundingPoly;
}

interface CropEdgeImageResult {
  objectAnnotations?: ObjectAnnotation[];
}

const setCanvasPreview = (image: any, canvas: any, crop: any) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("No 2d context");
  }

  const pixelRatio = window.devicePixelRatio;
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
  canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = "high";
  ctx.save();

  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;

  ctx.translate(-cropX, -cropY);
  ctx.drawImage(
    image,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight
  );

  ctx.restore();
};

interface ImageCropperProps {
  updateImage: (url: string) => void;
  handleOCRText: (
    ocrData: any,
    originalWidth: number,
    uploadedImageUrl: string
  ) => void;
  setImageSrc: (src: string) => void;
  closeModal: () => void;
  onImageUpload: (uploadedImageUrl: string) => void;
  handleImageAnalyze: (
    image: File,
    originalWidth: number
  ) => Promise<{
    textAnnotations: any[];
    logoAnnotations: any[];
    fullTextAnnotation: any;
  }>;
  handleCropEdgeImg: (image: File) => Promise<CropEdgeImageResult>;
  handleChatGpt: (image: File) => Promise<any>;
}

const ImageCropper: React.FC<ImageCropperProps> = ({
  closeModal,
  updateImage,
  handleOCRText,
  setImageSrc,
  onImageUpload,
  handleImageAnalyze,
  handleCropEdgeImg,
  handleChatGpt,
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [imgSrc, setImgSrcLocal] = useState("");
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [crop, setCrop] = useState<Crop | undefined>(undefined);
  const [error, setError] = useState("");
  const [originalImageWidth, setOriginalImageWidth] = useState<number>(0);
  const [originalImageHeight, setOriginalImageHeight] = useState<number>(0);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const onSelectFile = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOriginalFile(file);
    setLoading(true);

    const reader = new FileReader();
    reader.addEventListener("load", async () => {
      const imageElement = new Image();
      const imageUrl = reader.result?.toString() || "";
      imageElement.src = imageUrl;

      imageElement.addEventListener("load", async (e) => {
        try {
          if (error) setError("");
          const { naturalWidth, naturalHeight }: any = e.currentTarget;
          if (naturalWidth < MIN_DIMENSION || naturalHeight < MIN_DIMENSION) {
            setError("Image must be at least 150 x 150 pixels.");
            setLoading(false);
            return setImgSrcLocal("");
          }
          setOriginalImageWidth(naturalWidth);
          setOriginalImageHeight(naturalHeight);

          console.log("naturalWidth" + naturalWidth);
          console.log("naturalHeight" + naturalHeight);

          // Call handleCropEdgeImg to get crop hints from Vision API
          const cropResult = await handleCropEdgeImg(file);

          let newCrop;
          if (
            cropResult.objectAnnotations &&
            cropResult.objectAnnotations.length > 0
          ) {
            const boundingPoly = cropResult.objectAnnotations[0].boundingPoly;
            if (boundingPoly) {
              const vertices = boundingPoly.normalizedVertices;
              const xMin = Math.min(...vertices.map((v) => v.x)) * naturalWidth;
              const xMax = Math.max(...vertices.map((v) => v.x)) * naturalWidth;
              const yMin =
                Math.min(...vertices.map((v) => v.y)) * naturalHeight;
              const yMax =
                Math.max(...vertices.map((v) => v.y)) * naturalHeight;

              const displayedWidth = imgRef.current?.width || naturalWidth;
              const displayedHeight = imgRef.current?.height || naturalHeight;
              const scaleX = displayedWidth / naturalWidth;
              const scaleY = displayedHeight / naturalHeight;

              let width = (xMax - xMin) * scaleX;
              let height = width / ASPECT_RATIO;

              if (height > (yMax - yMin) * scaleY) {
                height = (yMax - yMin) * scaleY;
                width = height * ASPECT_RATIO;
              }

              const centeredX =
                xMin * scaleX + ((xMax - xMin) * scaleX - width) / 2;
              const centeredY =
                yMin * scaleY + ((yMax - yMin) * scaleY - height) / 2;

              setCrop({
                unit: "px",
                x: centeredX,
                y: centeredY,
                width: (xMax - xMin) * scaleX * ASPECT_RATIO,
                height: (yMax - yMin) * scaleY * ASPECT_RATIO,
              });

              // console.log(
              //   "setCrop: " +
              //     centeredX +
              //     "!" +
              //     centeredY +
              //     "!" +
              //     (xMax - xMin) * scaleX * ASPECT_RATIO +
              //     "!" +
              //     (yMax - yMin) * scaleY * ASPECT_RATIO
              // );
            }
          } else {
            setCrop({
              unit: "px",
              x: 0,
              y: 0,
              width: naturalWidth * ASPECT_RATIO,
              height: naturalHeight * ASPECT_RATIO,
            });
          }

          setImgSrcLocal(imageUrl);
          setImageSrc(imageUrl);

          // setCrop({
          //   unit: "px",
          //   x: 0,
          //   y: 0,
          //   width: naturalWidth,
          //   height: naturalHeight,
          // });
        } catch (err) {
          console.error("Error handling image load:", err);
          setError("Failed to process image.");
        } finally {
          setLoading(false);
        }
      });
    });
    reader.readAsDataURL(file);
  };

  const onImageLoad = (e: any) => {
    const { width, height } = e.currentTarget;
    const cropWidthInPercent = (MIN_DIMENSION / width) * 100;

    // Ensure crop is defined before calling centerCrop
    if (crop) {
      // const crop = makeAspectCrop(
      //   {
      //     unit: "%",
      //     width: cropWidthInPercent,
      //   },
      //   ASPECT_RATIO,
      //   width,
      //   height
      // );
      const centeredCrop: any = centerCrop(crop, width, height);
      setCrop(centeredCrop);
    }
  };

  // const handlerChatGpt = async (croppedFile: File) => {
  //   setLoading(true);
  //   try {
  //     const chatgptApiData = await handleChatGpt(croppedFile);
  //     console.log("chatgptApiData: ", chatgptApiData);
  //   } catch (error) {
  //     console.error("Error calling GPT API: ", error);
  //     setError("Failed to call GPT API.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleCropImage = async () => {
    if (imgRef.current && previewCanvasRef.current && crop) {
      setCanvasPreview(
        imgRef.current,
        previewCanvasRef.current,
        convertToPixelCrop(crop, imgRef.current.width, imgRef.current.height)
      );
      previewCanvasRef.current.toBlob(async (blob) => {
        if (blob) {
          const croppedFile = new File([blob], "cropped_image.png", {
            type: "image/png",
          });

          const formData = new FormData();
          formData.append("file", croppedFile);

          const response = await fetch("/api/uploadImage", {
            method: "POST",
            body: formData,
          });

          const data = await response.json();

          if (response.ok) {
            const uploadedImageUrl = `/api/uploadImage/${data.fileId}`;
            const uploadImageUrlWithHttp = `${process.env.NEXT_PUBLIC_BASE_URL}${uploadedImageUrl}`;
            updateImage(uploadImageUrlWithHttp);
            onImageUpload(uploadImageUrlWithHttp);
            closeModal();
          } else {
            setError(`Upload failed: ${data.message}`);
          }
        }
      }, "image/png");
    }
  };

  const handleFullImageUpload = async () => {
    if (fileInputRef.current?.files?.[0]) {
      const file = fileInputRef.current.files[0];
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/uploadImage", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        const uploadedImageUrl = `/api/uploadImage/${data.fileId}`;
        const uploadImageUrlWithHttp = `${process.env.NEXT_PUBLIC_BASE_URL}${uploadedImageUrl}`;
        updateImage(uploadImageUrlWithHttp);
        onImageUpload(uploadImageUrlWithHttp);
        closeModal();
      } else {
        setError(`Upload failed: ${data.message}`);
      }
    }
  };
  const handleCropAndOCR = async (onImageUpload: (url: string) => void) => {
    if (loading) return;

    if (imgRef.current && previewCanvasRef.current && crop) {
      setLoading(true);
      setCanvasPreview(
        imgRef.current,
        previewCanvasRef.current,
        convertToPixelCrop(crop, imgRef.current.width, imgRef.current.height)
      );

      previewCanvasRef.current.toBlob(async (blob) => {
        if (blob) {
          const croppedFile = new File([blob], "cropped_image.png", {
            type: "image/png",
          });

          const { width, height } = await getImageDimensions(croppedFile);
          console.log(`Cropped image dimensions: ${width} x ${height}`);

          const formData = new FormData();
          formData.append("file", croppedFile);

          const uploadResponse = await fetch("/api/uploadImage", {
            method: "POST",
            body: formData,
          });

          const uploadData = await uploadResponse.json();

          if (uploadResponse.ok) {
            const uploadedImageUrl = `/api/uploadImage/${uploadData.fileId}`;
            const uploadImageUrlWithHttp = `${process.env.NEXT_PUBLIC_BASE_URL}${uploadedImageUrl}`;
            updateImage(uploadImageUrlWithHttp);
            onImageUpload(uploadImageUrlWithHttp);

            const ocrFormData = new FormData();
            ocrFormData.append("file", croppedFile); // Use the cropped file for OCR

            const ocrResponse = await fetch("/api/ocr", {
              method: "POST",
              body: ocrFormData,
            });

            const ocrData = await ocrResponse.json();

            if (ocrResponse.ok) {
              handleOCRText(
                ocrData.ocrData,
                originalImageWidth,
                uploadImageUrlWithHttp
              );
            } else {
              setError(`OCR failed: ${ocrData.message}`);
            }

            const googleApiLabels = await handleImageAnalyze(
              croppedFile,
              originalImageWidth
            );
            console.log("Google API return:", googleApiLabels);

            const chatgptRes = await handleChatGpt(croppedFile);

            //console.log("chatgptRes" + chatgptRes);

            closeModal();
          } else {
            setError(`Upload failed: ${uploadData.message}`);
          }
        }
        setLoading(false);
      }, "image/png");
    }
  };

  const getImageDimensions = (
    file: File
  ): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const image = new Image();
        image.onload = () => {
          resolve({ width: image.width, height: image.height });
        };
        image.onerror = (error) => {
          reject(error);
        };
        if (event.target && typeof event.target.result === "string") {
          image.src = event.target.result;
        } else {
          reject(new Error("Failed to read file"));
        }
      };

      reader.onerror = (error) => {
        reject(error);
      };

      reader.readAsDataURL(file);
    });
  };

  const openCamera = async () => {
    setIsCameraOpen(true);
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  };

  const closeCamera = () => {
    setIsCameraOpen(false);
    if (videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (!blob)
          return console.error("Failed to get blob from capture image");
        const captureImage = new File([blob], "captureImage.jpg", {
          type: "image/jpeg",
        });
        setOriginalFile(captureImage);
      }, "image/jpeg");

      const imageSrc = canvas.toDataURL("image/png");
      setImgSrcLocal(imageSrc);
      setImageSrc(imageSrc);
      setOriginalImageWidth(canvas.width);
      closeCamera();
    }
  };

  const onCropChange = (newCrop: Crop) => {
    setCrop(newCrop);
  };

  return (
    <>
      <div className="flex gap-4 flex-row justify-center">
        <Button
          variant="default"
          className="cursor-pointer mb-[15px] p-2"
          onClick={handleButtonClick}>
          <span className="mr-2">Choose a photo</span>
          <input
            type="file"
            accept="image/*"
            onChange={onSelectFile}
            ref={fileInputRef}
            className="hidden"
          />
        </Button>
        <Button
          variant="default"
          className="cursor-pointer mb-[15px] p-2"
          onClick={openCamera}>
          <span>Open Camera</span>
        </Button>
      </div>
      {isCameraOpen && (
        <div className="flex flex-col gap-4 items-center relative">
          <video ref={videoRef} autoPlay style={{ width: "100%" }} />
          {crop && (
            <div
              style={{
                position: "absolute",
                border: "2px dashed red",
                top: `${(crop.y / originalImageHeight) * 100}%`,
                left: `${(crop.x / originalImageWidth) * 100}%`,
                width: `${(crop.width / originalImageWidth) * 100}%`,
                height: `${(crop.height / originalImageHeight) * 100}%`,
              }}></div>
          )}
          <div className="flex gap-4 flex-row justify-center">
            <Button
              variant="default"
              className="cursor-pointer mb-[15px]"
              onClick={captureImage}>
              <span>Capture Image</span>
            </Button>
            <Button
              variant="default"
              className="cursor-pointer mb-[15px]"
              onClick={closeCamera}>
              <span>Close Camera</span>
            </Button>
          </div>
        </div>
      )}
      {error && <p className="text-red-400 text-xs">{error}</p>}
      {loading ? (
        <div className="flex flex-col items-center mt-10">
          <ClipLoader size={50} color={"#123abc"} loading={loading} />
          <p className="text-blue-400 text-xs">
            Just a moment, processing image...
          </p>
        </div>
      ) : (
        imgSrc && (
          <div className="flex flex-col items-center">
            <ReactCrop
              crop={crop}
              onChange={(newCrop) => setCrop(newCrop)}
              keepSelection
              // minWidth={MIN_DIMENSION}
            >
              <img
                ref={imgRef}
                src={imgSrc}
                alt="Upload"
                style={{ maxWidth: "100%" }}
                onLoad={onImageLoad}
              />
            </ReactCrop>
            <div className="flex flex-row gap-4">
              {/* <Button
                variant="outline"
                onClick={handleCropImage}
                className="mt-4">
                Crop Image
              </Button> */}
              {/* <Button
                variant="outline"
                onClick={handleFullImageUpload}
                className="mt-4">
                Full Image
              </Button> */}
              <Button
                variant="outline"
                onClick={() => handleCropAndOCR(onImageUpload)}
                className="mt-4">
                Crop & OCR
              </Button>
              {/* chatgpt button */}
              {/* <Button
                variant="outline"
                onClick={handlerChatGpt}
                className="mt-4">
                GPT API
              </Button> */}
            </div>
          </div>
        )
      )}
      {crop && (
        <canvas
          ref={previewCanvasRef}
          className="mt-4"
          style={{
            display: "none",
            border: "1px solid black",
            objectFit: "contain",
            width: 150,
            height: 150,
          }}
        />
      )}
    </>
  );
};

export default ImageCropper;
