"use client";

import { useState } from "react";
import { addressPattern, emailPattern, jobTitlePatterns, namePatterns, phonePattern, websitePattern } from "@/lib/ocr-patterns";
import ImageCropper from "@/component/image-cropper";
import { Button } from "@/components/ui/button";

interface UploadFormProps {
    handleImageUpdate: any;
    handleExtractedInfo: (extractedInfo: any, originalImageWidth: number, uploadedImageUrl: string) => void;
}

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

    console.log("Extracted Info: ", extractedInfo);
    return extractedInfo;
};

const UploadForm: React.FC<UploadFormProps> = ({ handleImageUpdate, handleExtractedInfo }) => {
    const [imageSrc, setImageSrc] = useState<string>('');
    const [showImageCropper, setShowImageCropper] = useState(true);
    const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');

    const handleOCRText = async (ocrData: any, originalImageWidth: number) => {
        if (!ocrData || !Array.isArray(ocrData)) {
            console.error("Invalid OCR data received:", ocrData);
            return;
        }

        const extractedInfo = await extractInfo(ocrData, imageSrc);
        handleExtractedInfo(extractedInfo, originalImageWidth, uploadedImageUrl);
        setShowImageCropper(false); 
    };

    const handleImageUpload = (uploadedImageUrl: string) => {
        setUploadedImageUrl(uploadedImageUrl);
        setShowImageCropper(false); 
    };

    return (
        <div className="mt-8 w-full max-w-xl">
            <div className="bg-gray-800 text-slate-100 rounded-2xl shadow-xl p-4">
                <div style={{"justifyContent": "space-between"}} className="flex items-center mb-8">
                    <h2 className="text-xl">Upload and Crop Image</h2>
                    <div className="flex flex-col">
                        <button
                            type="button"
                            className="rounded-md p-1 text-gray-400 hover:bg-gray-700 focus:outline-none"
                            onClick={() => setImageSrc('')}
                        >
                            <span className="sr-only">Clear</span>
                        </button>
                    </div>
                </div>
                {uploadedImageUrl && (
                    <div className="mt-4">
                        <h3 className="text-lg">Uploaded Image:</h3>
                        <img src={uploadedImageUrl} alt="Uploaded" className="mt-2 max-w-full h-auto" />
                    </div>
                )}
                {showImageCropper && (
                    <ImageCropper
                        updateImage={handleImageUpdate}
                        handleOCRText={handleOCRText}
                        setImageSrc={setImageSrc}
                        onImageUpload={handleImageUpload}
                        closeModal={() => setShowImageCropper(false)}
                    />
                )}
            </div>
        </div>
    );
};

export default UploadForm;
