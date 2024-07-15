"use client"

import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { addressPattern, emailPattern, jobTitlePatterns, namePatterns, phonePattern, websitePattern } from "@/lib/ocr-patterns";
import ImageCropper from "@/component/image-cropper";

interface CropModalProps {
    updateImage: any;
    onExtractedInfo: (extractedInfo: any, originalImageWidth: number, uploadedImageUrl: string) => void;
    closeModal: () => void;
    onImageUpload: (uploadedImageUrl: string) => void;
}

// const detectLogo = async (imageSrc: string): Promise<any> => {
//     console.log("Starting logo detection...");
//     await loadOpenCV();
//     console.log("OpenCV loaded");

//     return new Promise((resolve, reject) => {
//         const image = new Image();
//         image.src = imageSrc;
//         console.log("Image source set to:", imageSrc);

//         image.onload = () => {
//             console.log("Image loaded for logo detection.");
//             const src = window.cv.imread(image);
//             const dst = new window.cv.Mat();

//             window.cv.cvtColor(src, dst, window.cv.COLOR_RGBA2GRAY, 0);
//             window.cv.threshold(dst, dst, 150, 255, window.cv.THRESH_BINARY_INV);

//             const contours = new window.cv.MatVector();
//             const hierarchy = new window.cv.Mat();
//             window.cv.findContours(dst, contours, hierarchy, window.cv.RETR_EXTERNAL, window.cv.CHAIN_APPROX_SIMPLE);

//             let logoContour = null;
//             for (let i = 0; i < contours.size(); ++i) {
//                 const contour = contours.get(i);
//                 const area = window.cv.contourArea(contour);
//                 if (area > 1000) {
//                     logoContour = contour;
//                     break;
//                 }
//             }

//             if (logoContour) {
//                 const boundingRect = window.cv.boundingRect(logoContour);
//                 console.log("Logo detected:", boundingRect);
//                 resolve({
//                     x0: boundingRect.x,
//                     y0: boundingRect.y,
//                     x1: boundingRect.x + boundingRect.width,
//                     y1: boundingRect.y + boundingRect.height
//                 });
//             } else {
//                 console.log("No logo detected.");
//                 resolve(null);
//             }

//             src.delete();
//             dst.delete();
//             contours.delete();
//             hierarchy.delete();
//         };

//         image.onerror = () => {
//             console.error("Failed to load image for logo detection.");
//             reject(new Error("Failed to load image"));
//         };
//     });
// };


const extractInfo = async (words: any, imageSrc: string) => {
    console.log("Words: ", words);

    let extractedInfo: { type: string; text: string; position: any; }[] = [];

    const lines = words.reduce((acc: any[], word: any) => {
        const lastLine = acc[acc.length - 1];
        if (lastLine && Math.abs(lastLine[0].bbox.y0 - word.bbox.y0) < 10) {
            lastLine.push(word);
        } else {
            acc.push([word]);
        }
        return acc;
    }, []);

    const concatenatedLines = lines.map((line: any[]) => {
        const text = line.map(word => word.text).join(' ');

        const bbox = line.reduce((acc, word) => {
            if (acc.x0 > word.bbox.x0) acc.x0 = word.bbox.x0;
            if (acc.y0 > word.bbox.y0) acc.y0 = word.bbox.y0;
            if (acc.x1 < word.bbox.x1) acc.x1 = word.bbox.x1;
            if (acc.y1 < word.bbox.y1) acc.y1 = word.bbox.y1;
            return acc;
        }, { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity });

        return { text, bbox };
    });

    console.log("Concatenated Lines: ", concatenatedLines);

    concatenatedLines.forEach(({ text: lineText, bbox: lineBbox }: { text: string, bbox: any }) => {
        console.log("Processing line: ", lineText);
        let match: RegExpMatchArray | null;

        if (match = lineText.match(emailPattern)) {
            console.log("Email match: ", match);
            extractedInfo.push({ type: 'email', text: match[0], position: lineBbox });
        }
        else if (match = lineText.match(phonePattern)) {
            console.log("Phone match: ", match);
            extractedInfo.push({ type: 'phone', text: match[0], position: lineBbox });
        }
        else if (jobTitlePatterns.some(pattern => (match = lineText.match(pattern)) !== null)) {
            console.log("Job Title match: ", match);
            extractedInfo.push({ type: 'jobTitle', text: match![0], position: lineBbox });
        }
        else if (match = lineText.match(addressPattern)) {
            console.log("Address match: ", match);
            extractedInfo.push({ type: 'address', text: match[0], position: lineBbox });
        }
        else if (match = lineText.match(websitePattern)) {
            console.log("Website match: ", match);
            extractedInfo.push({ type: 'website', text: match[0], position: lineBbox });
        }
        else if (namePatterns.some(pattern => (match = lineText.match(pattern)) !== null)) {
            console.log("Name match: ", match);
            extractedInfo.push({ type: 'name', text: match![0], position: lineBbox });
        }
        else {
            console.log("No match found for line: ", lineText);
        }
    });

    // logo detection
    // try {
    //     const logoPosition = await detectLogo(imageSrc);
    //     if (logoPosition) {
    //         extractedInfo.push({ type: 'logo', text: '', position: logoPosition });
    //     }
    // } catch (error) {
    //     console.error("Error detecting logo:", error);
    // }

    console.log("Extracted Info: ", extractedInfo);
    return extractedInfo;
};


const CropModal: React.FC<CropModalProps> = ({ updateImage, onExtractedInfo, closeModal }) => {
    const [imageSrc, setImageSrc] = useState<string>('');

    let uploadedImageURL: string = '';

    const handleOCRText = async (ocrData: any, originalImageWidth: number) => {
        if (!ocrData || !Array.isArray(ocrData)) {
            console.error("Invalid OCR data received:", ocrData);
            return;
        }

        const extractedInfo = await extractInfo(ocrData, imageSrc);
        onExtractedInfo(extractedInfo, originalImageWidth, uploadedImageURL);
    };

    const handleImageUpload = (uploadedImageUrl: string) => {
        return uploadedImageURL = uploadedImageUrl;
    };

    return createPortal(
        <div
            className="relative z-50 w-min-content justify-center items-center flex overflow-x-hidden overflow-y-auto outline-none focus:outline-none"
            aria-labelledby="crop-image-dialog"
            role="dialog"
            aria-modal="true"
        >
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-all backdrop-blur-sm"></div>
            <div className="fixed z-10 w-screen overflow-y-auto">
                <div className="flex min-h-full justify-center px-2 py-12 text-center ">
                    <div className="relative w-[80%] sm:w-[60%] min-h-[60vh] p-[80%] rounded-2xl bg-gray-800 text-slate-100 text-left shadow-xl transition-all h-min self-center items-center">
                        <div className="px-5 py-4 text-center">
                            <button
                                type="button"
                                className="rounded-md p-1 inline-flex items-center justify-center text-gray-400 hover:bg-gray-700 focus:outline-none absolute top-2 right-2"
                                onClick={closeModal}
                            >
                                <span className="sr-only">Close menu</span>
                                <X />
                            </button>
                            {/* <ImageCropper
                                updateImage={updateImage}
                                handleOCRText={handleOCRText}
                                setImageSrc={setImageSrc}
                                closeModal={closeModal}
                                onImageUpload={handleImageUpload}
                            /> */}
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.getElementById('modal-root')!
    );
};

export default CropModal;
