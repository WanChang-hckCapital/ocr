"use client";

import UploadForm from "@/component/upload-form";
import { Button } from "@/components/ui/button";
import { convertExtractedInfoToEditorElements } from "@/lib/utils";
import { useState } from "react";

export default function Home() {
  const [formOpen, setFormOpen] = useState(false);
  const [extractedInfo, setExtratedInfo] = useState<any>(null);

  const handleFormToggle = () => {
    setFormOpen(!formOpen);
  };

  const handleImageUpdate = (image: any) => {
    console.log("Image updated:", image);
  };

  const handleExtractedInfo = (extractInfo: any, originalWidth: number, uploadedImageUrl: string) => {

    const newElements = convertExtractedInfoToEditorElements(extractInfo, originalWidth);
    console.log("Extracted Info:", extractInfo);
    console.log("newElements:", newElements);
    setExtratedInfo(newElements);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="grid text-center w-[30%] justify-center lg:max-w-5xl lg:text-left">
        <Button
          className="mb-8"
          onClick={handleFormToggle}>
          Upload Image
        </Button>
      </div>
      {formOpen && (
        <div>
          <UploadForm
            handleImageUpdate={handleImageUpdate}
            handleExtractedInfo={handleExtractedInfo}
          />
        </div>
      )}
      {extractedInfo && (
        <div className="mt-8 w-full max-w-xl">
          <div className="bg-gray-800 text-slate-100 rounded-2xl shadow-xl p-4">
            <h2 className="text-xl">Extracted Information</h2>
            <div className="mt-4">
              <h3 className="text-lg">Extracted Info:</h3>
              <pre className="mt-2">{JSON.stringify(extractedInfo, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
