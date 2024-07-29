"use client";

import { useState, useRef } from "react";
import ReactCrop, { Crop, convertToPixelCrop } from "react-image-crop";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import UploadForm from "@/component/upload-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { analyzeImage, autoCropEdgeImage, callChatGpt } from "@/lib/utils";
import {
  convertExtractedInfoToEditorElements,
  generateCustomID,
} from "@/lib/utils";
import "react-image-crop/dist/ReactCrop.css";
// import ClipLoader from "react-spinners/ClipLoader";
import GptData from "@/component/gpt-data";
import LogoList from "@/component/googlelogolist";
import { X } from "lucide-react";

interface Vertex {
  x: number;
  y: number;
}

interface Match {
  label: string;
  value: string;
  blockType: string;
  vertices: Vertex[];
  originalText: string;
}

// crop image
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

const MIN_DIMENSION = 50;

const setCanvasPreview = (
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
  crop: Crop
) => {
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

const Home: React.FC = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [extractedInfo, setExtractedInfo] = useState<any>(null);
  const [detectedText, setDetectedText] = useState<Match[]>([]);
  const [detectedLogos, setDetectedLogos] = useState<any[]>([]);
  const [detectedFullText, setDetectedFullText] = useState<string>("");
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const [croppedLogos, setCroppedLogos] = useState<string[]>([]);
  const [logoRotations, setLogoRotations] = useState<number[]>([]);
  const [manualCroppedLogos, setManualCroppedLogos] = useState<string[]>([]);
  const [manualLogoRotations, setManualLogoRotations] = useState<number[]>([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [currentDrop, setCurrentDrop] = useState<{
    row: number;
    col: number;
    text: string;
  } | null>(null);
  const [editText, setEditText] = useState("");
  const [regexMatches, setRegexMatches] = useState<Match[]>([]);

  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dataReturned, setDataReturned] = useState(false);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();

  const [gptData, setGptData] = useState<any>(null);
  const [croppedGPTLogo, setCroppedGPTLogo] = useState<string>("");
  const [isGptDataLoading, setIsGptDataLoading] = useState(false);

  // Initialize gridItems with drop here default values
  const [gridItems, setGridItems] = useState<string[][]>(
    Array.from({ length: 3 }, () =>
      Array.from({ length: 3 }, () => "Drop here")
    )
  );

  const handleFormToggle = () => {
    setFormOpen(!formOpen);
  };

  const handleImageUpdate = (image: any) => {
    console.log("Image updated:", image);
    setUploadedImageUrl(image);
    setDataReturned(false);
  };

  const handleExtractedInfo = (
    extractInfo: any,
    originalWidth: number,
    uploadedImageUrl: string
  ) => {
    const newElements: any[] = convertExtractedInfoToEditorElements(
      extractInfo,
      originalWidth
    );
    console.log("Ori image Width:", originalWidth);

    console.log("Extracted Info:", extractInfo);
    console.log("newElements:", newElements);
    setExtractedInfo(newElements);
    setDataReturned(true);
  };

  // ocr from google api
  const handleImageAnalyze = async (
    image: File,
    originalWidth: number
  ): Promise<{
    logoAnnotations: any[];
  }> => {
    console.log("Image analyze:", image);
    try {
      setIsLoading(true);

      const result = await analyzeImage(image);
      console.log("Detected Logos:", result.logoAnnotations);
      setDetectedLogos(result.logoAnnotations || []);
      setIsLoading(false);

      // Extract logo coordinates
      if (result.logoAnnotations) {
        const logoCoords = result.logoAnnotations.map(
          (logo: any) => logo.boundingPoly.vertices
        );
        await cropLogos(image, logoCoords);
      } else {
        setCroppedLogos([]);
      }

      const matches: Match[] = [];
      // const text = result.fullTextAnnotation.text || "";

      // const textAnnotations = result.fullTextAnnotation.pages[0].blocks;

      // textAnnotations.forEach((block: any) => {
      //   const blockText = block.paragraphs
      //     .map((para: any) =>
      //       para.words
      //         .map((word: any) =>
      //           word.symbols.map((sym: any) => sym.text).join("")
      //         )
      //         .join(" ")
      //     )
      //     .join("\n");

      //   const blockType = block.blockType;
      //   const vertices = block.boundingBox.vertices;

      // const patterns = [
      //   { pattern: emailPattern, label: "Email" },
      //   { pattern: phonePattern, label: "Phone" },
      //   { pattern: addressPattern, label: "Address" },
      //   { pattern: websitePattern, label: "Website" },
      //   ...namePatterns.map((pattern) => ({ pattern, label: "Name" })),
      //   { pattern: companyPattern, label: "Company" },
      //   ...jobTitlePatterns.map((pattern) => ({
      //     pattern,
      //     label: "Job Title",
      //   })),
      // ];

      //   patterns.forEach(({ pattern, label }) => {
      //     const matchesForPattern = blockText.matchAll(pattern);
      //     for (const match of matchesForPattern) {
      //       matches.push({
      //         label,
      //         value: match[0],
      //         blockType,
      //         vertices,
      //         originalText: blockText,
      //       });
      //     }
      //   });
      // });

      console.log("matches", matches);
      setRegexMatches(matches);

      // const extractedInfo: any = {};
      // matches.forEach((match, index) => {
      //   const vertices = match.vertices.map((vertex, i) => ({
      //     [`x${i}`]: vertex.x,
      //     [`y${i}`]: vertex.y,
      //   }));

      //   extractedInfo[`field${index}`] = {
      //     text: match.value,
      //     position: vertices.reduce(
      //       (acc, vertex) => ({ ...acc, ...vertex }),
      //       {}
      //     ),
      //   };
      // });

      //handleExtractedInfo(extractedInfo, originalWidth, uploadedImageUrl);

      const calculateTextAlign = (
        x0: number,
        x1: number,
        originalWidth: number
      ) => {
        const relativeX0Position = x0 / originalWidth;
        const relativeX1Position = x1 / originalWidth;

        console.log("Relative X0 Position:", relativeX0Position);
        console.log("Relative X1 Position:", relativeX1Position);

        if (relativeX1Position > 0.7 || relativeX0Position > 0.6) {
          return "end";
        } else if (relativeX0Position > 0.33) {
          return "center";
        } else {
          return "start";
        }
      };

      const MAX_WIDTH = 384;

      const scalePosition = (position: any, originalWidth: number) => {
        const scaleRatio = MAX_WIDTH / originalWidth;
        return {
          x0: position.x0 * scaleRatio,
          y0: position.y0 * scaleRatio,
          x1: position.x1 * scaleRatio,
          y1: position.y1 * scaleRatio,
        };
      };

      const createTextElement = (text: string, position: any): any => {
        const scaledPosition = scalePosition(position, originalWidth);
        const { x0, x1 } = scaledPosition;
        const textAlign = calculateTextAlign(x0, x1, originalWidth);

        return {
          id: generateCustomID(),
          type: "text",
          text: text,
          size: "sm",
          align: textAlign,
          description: "text description",
        };
      };

      const createBoxElement = (field: any): any => {
        const { text, position } = field;

        console.log("Creating box element for:", text);
        console.log("Position:", position);

        return {
          id: generateCustomID(),
          type: "box",
          layout: "vertical",
          contents: [createTextElement(text, position)],
          position: "absolute",
          description: "box description",
        };
      };

      const elements: any[] = [];

      console.log("Extracted Info above:", extractedInfo);

      // Object.keys(extractedInfo).forEach((key) => {
      //   const field = extractedInfo[key];
      //   if (field.position) {
      //     elements.push(createBoxElement(field));
      //   } else {
      //     console.log("Field without position:", field);
      //   }
      // });

      // final json that need to be saved in the db
      // Object.keys(elements).forEach((key: any) => {
      //   console.log(
      //     key + " elements: " + JSON.stringify(elements[key], null, 2)
      //   );
      // });

      return result;
    } catch (error) {
      console.error("Error analyzing image:", error);
      setIsLoading(false); // End loading state on error
      throw error;
    }
  };

  // crop edge image
  const handleCropEdgeImg = async (
    image: File
  ): Promise<CropEdgeImageResult> => {
    try {
      const result = await autoCropEdgeImage(image);

      if (result.objectAnnotations) {
        result.objectAnnotations.forEach((annotation: ObjectAnnotation) => {
          if (
            annotation.boundingPoly &&
            annotation.boundingPoly.normalizedVertices
          ) {
            annotation.boundingPoly.normalizedVertices.forEach(
              (vertex: NormalizedVertex) => {
                console.log(`x: ${vertex.x}, y: ${vertex.y}`);
              }
            );
          }
        });
      } else {
        setCroppedLogos([]);
      }

      return result;
    } catch (error) {
      console.error("Error Crop Image Edge:", error);
      throw error;
    }
  };

  // gpt 4.0 mini
  const handleChatGpt = async (image: File): Promise<any> => {
    try {
      setIsGptDataLoading(true);

      const result = await callChatGpt(image);
      const content = result.message.content.replace(/```json|```/g, "").trim();
      const parsedContent = JSON.parse(content);
      setGptData(parsedContent);

      setIsGptDataLoading(false);
      console.log(parsedContent);

      if (parsedContent.logo && parsedContent.logo.logo_detected) {
        if (parsedContent.logo.logo) {
          const { x, y, width, height } = parsedContent.logo.logo;
          console.log(
            "Using parsedContent.logo.logo:",
            parsedContent.logo.logo
          );
          await cropLogoFromCoordinates(x, y, width, height, image);
        } else if (parsedContent.logo.coordinates) {
          const { x, y, width, height } = parsedContent.logo.coordinates;
          console.log(
            "Using parsedContent.logo.coordinates:",
            parsedContent.logo.coordinates
          );
          await cropLogoFromCoordinates(x, y, width, height, image);
        } else {
          console.log("No valid logo coordinates found in parsedContent.logo.");
        }
      } else {
        console.log("No logo detected in parsedContent.");
      }

      return parsedContent;
    } catch (error) {
      console.log("Error analyzing image:", error);
      setIsGptDataLoading(false);
      throw error;
    }
  };

  const cropLogoFromCoordinates = async (
    x: number,
    y: number,
    width: number,
    height: number,
    image: File
  ): Promise<void> => {
    console.log(x + "!" + y + "!" + width + "!" + height);
    const imageURL = URL.createObjectURL(image);
    let croppedImage = "";
    console.log("cropLogoFromCoordinates" + imageURL);
    const img = new Image();
    img.src = imageURL;

    await new Promise<void>((resolve) => {
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (context) {
          canvas.width = width;
          canvas.height = height;

          context.drawImage(img, x, y, width, height, 0, 0, width, height);
          croppedImage = canvas.toDataURL("image/png");
        }
        resolve();
      };
    });
    setCroppedGPTLogo(croppedImage);
  };

  const cropLogos = async (image: File, coordinates: any[]): Promise<void> => {
    const imageURL = URL.createObjectURL(image);
    const croppedImages: string[] = [];
    const rotations: number[] = [];

    const img = new Image();
    img.src = imageURL;

    await new Promise<void>((resolve) => {
      img.onload = () => {
        coordinates.forEach((coords) => {
          const [x0, y0] = [coords[0].x, coords[0].y];
          const [x1, y1] = [coords[2].x, coords[2].y];
          const width = x1 - x0;
          const height = y1 - y0;

          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");

          if (context) {
            canvas.width = width;
            canvas.height = height;

            context.drawImage(img, x0, y0, width, height, 0, 0, width, height);
            croppedImages.push(canvas.toDataURL("image/png"));
            rotations.push(0);
          }
        });
        resolve();
      };
    });

    setCroppedLogos(croppedImages);
    setLogoRotations(rotations);
  };

  const startCrop = () => {
    setIsCropping(true);
  };

  const finishCrop = () => {
    if (imgRef.current && cropCanvasRef.current && crop) {
      setCanvasPreview(
        imgRef.current,
        cropCanvasRef.current,
        convertToPixelCrop(crop, imgRef.current.width, imgRef.current.height)
      );
      cropCanvasRef.current.toBlob((blob) => {
        if (blob) {
          const croppedImage = URL.createObjectURL(blob);
          setManualCroppedLogos((prev) => [...prev, croppedImage]);
          setManualLogoRotations((prev) => [...prev, 0]);
        }
      }, "image/png");
      setIsCropping(false);
    }
  };

  const rotateLogo = (index: number, isManual: boolean = false) => {
    if (isManual) {
      const newRotations = [...manualLogoRotations];
      newRotations[index] = (newRotations[index] + 90) % 360;
      setManualLogoRotations(newRotations);
    } else {
      const newRotations = [...logoRotations];
      newRotations[index] = (newRotations[index] + 90) % 360;
      setLogoRotations(newRotations);
    }
  };

  const removeLogo = (index: number, isManual: boolean = false) => {
    if (isManual) {
      const newManualCroppedLogos = manualCroppedLogos.filter(
        (_, i) => i !== index
      );
      const newManualLogoRotations = manualLogoRotations.filter(
        (_, i) => i !== index
      );
      setManualCroppedLogos(newManualCroppedLogos);
      setManualLogoRotations(newManualLogoRotations);
    } else {
      const newCroppedLogos = croppedLogos.filter((_, i) => i !== index);
      const newLogoRotations = logoRotations.filter((_, i) => i !== index);
      setCroppedLogos(newCroppedLogos);
      setLogoRotations(newLogoRotations);
    }
  };

  // const handleDrop = (row: number, col: number) => (text: string) => {
  //   setCurrentDrop({ row, col, text });
  //   setEditText(text);
  //   setModalIsOpen(true);
  // };

  const closeModal = () => {
    setModalIsOpen(false);
    setCurrentDrop(null);
    setEditText("");
  };

  const confirmDrop = () => {
    if (currentDrop) {
      const { row, col } = currentDrop;
      const newGridItems = [...gridItems];
      newGridItems[row][col] = editText;
      setGridItems(newGridItems);
    }
    closeModal();
  };

  const handleSave = () => {
    setSaveModalOpen(true);
  };

  const closeSaveModal = () => {
    setSaveModalOpen(false);
  };

  const removeMatch = (index: number) => {
    const newMatches = regexMatches.filter((_, i) => i !== index);
    setRegexMatches(newMatches);
  };

  const saveData = () => {
    genJsonData();
    setSaveModalOpen(false);
  };

  // position of the picture from google api
  const genJsonData = () => {
    regexMatches.forEach((match, index) => {
      const verticesString = match.vertices
        .map((vertex) => `(${vertex.x}, ${vertex.y})`)
        .join(", ");

      console.log(
        `${match.label}: ${match.value}: ${match.blockType}: ${verticesString}`
      );
    });
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <main className="flex flex-col items-center p-24 min-h-screen">
        <div className="flex w-full justify-center mb-8">
          <Button variant="outline" onClick={handleFormToggle}>
            Upload Image
          </Button>
        </div>
        {formOpen && (
          <div className="mb-8">
            <UploadForm
              handleChatGpt={handleChatGpt}
              handleImageUpdate={handleImageUpdate}
              handleImageAnalyze={handleImageAnalyze}
              handleCropEdgeImg={handleCropEdgeImg}
              handleExtractedInfo={handleExtractedInfo}
            />
          </div>
        )}
        {dataReturned && (
          <Card className="w-full">
            <div className="flex flex-col md:flex-row w-full">
              <div className="w-full md:w-1/2 flex flex-col items-center justify-center text-slate-100 shadow-xl p-4 md:sticky md:top-0">
                <CardHeader>
                  <CardTitle>Uploaded Image :</CardTitle>
                </CardHeader>
                <CardContent>
                  <img
                    src={uploadedImageUrl}
                    alt="Uploaded"
                    className="max-w-full h-auto"
                  />
                </CardContent>
              </div>
              <div className="w-full md:w-1/2 overflow-y-auto max-h-screen scrollbar-hide">
                {(isLoading || isGptDataLoading) && (
                  <div className="flex flex-col items-center justify-center mt-8 space-y-4 min-h-[50vh]">
                    <Skeleton className="h-6 w-1/3 bg-white" />
                    <Skeleton className="h-6 w-1/2 bg-white" />
                    <Skeleton className="h-6 w-1/4 bg-white" />
                  </div>
                )}
                {!isLoading && !isGptDataLoading && (
                  <div className="text-white p-4 mt-2">
                    <CardContent>Please verify the below data.</CardContent>
                    <CardContent>
                      {croppedLogos.length > 0 && (
                        <div className="mt-2">
                          <div className="bg-white text-slate-900 p-4 rounded-2xl">
                            <CardHeader>
                              <CardTitle>Detected Logos:</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <LogoList
                                croppedLogos={croppedLogos}
                                logoRotations={logoRotations}
                                removeLogo={removeLogo}
                                rotateLogo={rotateLogo}
                              />
                            </CardContent>
                          </div>
                        </div>
                      )}
                    </CardContent>
                    <CardContent>
                      {manualCroppedLogos.length > 0 && (
                        <div className="mt-8">
                          <div className="bg-white text-slate-900 rounded-2xl shadow-xl p-4">
                            <CardHeader>
                              <CardTitle>Manually Cropped Logos:</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                              {manualCroppedLogos.map((croppedImage, index) => (
                                <div
                                  key={index}
                                  className="flex flex-col items-center mb-4 relative">
                                  <img
                                    src={croppedImage}
                                    alt={`Manually cropped logo ${index}`}
                                    className="w-auto h-auto mt-2"
                                    style={{
                                      transform: `rotate(${manualLogoRotations[index]}deg)`,
                                    }}
                                  />
                                  <Button
                                    variant="ghost"
                                    onClick={() => removeLogo(index, true)}
                                    className="absolute top-0 right-0 mt-2 mr-2 text-red-500 hover:text-red-700">
                                    {/* &times; */}
                                    <X />
                                  </Button>
                                  <CardFooter>
                                    <Button
                                      variant="default"
                                      onClick={() => rotateLogo(index, true)}
                                      className="mt-2 px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200 ease-in-out transform hover:scale-105">
                                      Rotate
                                    </Button>
                                  </CardFooter>
                                </div>
                              ))}
                            </CardContent>
                          </div>
                        </div>
                      )}
                    </CardContent>
                    <div className="p-6 pt-0">
                      <Button
                        variant="outline"
                        onClick={startCrop}
                        className="w-full">
                        Crop New Logo
                      </Button>
                    </div>
                    <CardContent>
                      {gptData && (
                        <GptData
                          gptData={gptData}
                          isGptDataLoading={isGptDataLoading}
                        />
                      )}
                    </CardContent>
                    <CardFooter>
                      <div className="mt-8 w-full flex justify-center">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={handleSave}>
                          Save
                        </Button>
                      </div>
                    </CardFooter>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}
      </main>
      {modalIsOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-1/3">
            <h2 className="text-lg font-bold text-black mb-4">
              Please verify the data below.
            </h2>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={5}
              className="w-full text-black p-2 border border-gray-300 rounded"
            />
            <div className="flex justify-end mt-4">
              <button
                onClick={closeModal}
                className="mr-4 px-4 py-2 bg-gray-500 text-white rounded">
                Cancel
              </button>
              <button
                onClick={confirmDrop}
                className="px-4 py-2 bg-gray-500 text-white rounded">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      {isCropping && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-1/2 flex flex-col items-center">
            <h2 className="text-lg font-bold text-black mb-4">
              Crop the new logo
            </h2>
            {uploadedImageUrl && (
              <ReactCrop
                crop={crop}
                onChange={(pixelCrop, percentCrop) => setCrop(percentCrop)}
                keepSelection
                minWidth={MIN_DIMENSION}>
                <img
                  ref={imgRef}
                  src={uploadedImageUrl}
                  alt="Upload"
                  style={{ maxHeight: "70vh" }}
                />
              </ReactCrop>
            )}
            <div className="flex justify-end mt-4 space-x-4">
              <button
                onClick={() => setIsCropping(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded">
                Cancel
              </button>
              <button
                onClick={finishCrop}
                className="px-4 py-2 bg-gray-500 text-white rounded">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {saveModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-1/2 max-h-full overflow-y-auto">
            <h2 className="text-lg font-bold text-black mb-4">
              Please verify the data below.
            </h2>
            {regexMatches.map((match, index) => (
              <div key={index} className="flex items-center mt-2 mb-2">
                <div className="flex-grow ml-2">
                  <label className="block text-black">
                    {match.label}:
                    <input
                      defaultValue={match.originalText}
                      readOnly
                      className="mt-1 block w-full bg-gray-200 text-black border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-opacity-50 p-2"
                    />
                  </label>
                </div>
              </div>
            ))}
            <div className="flex justify-end mt-4 space-x-4">
              <button
                onClick={saveData}
                className="px-4 py-2 bg-gray-500 text-white rounded">
                Confirm
              </button>
              <button
                onClick={closeSaveModal}
                className="px-4 py-2 bg-gray-500 text-white rounded">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <canvas ref={cropCanvasRef} style={{ display: "none" }} />
    </DndProvider>
  );
};

export default Home;
