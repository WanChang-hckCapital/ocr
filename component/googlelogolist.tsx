import React from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface GoogleLogoListProps {
  croppedLogos: string[];
  logoRotations: number[];
  removeLogo: (index: number) => void;
  rotateLogo: (index: number, isManual: boolean) => void;
}

const GoogleLogoList: React.FC<GoogleLogoListProps> = ({
  croppedLogos,
  logoRotations,
  removeLogo,
  rotateLogo,
}) => {
  return (
    <div>
      {croppedLogos.map((croppedImage, index) => (
        <div key={index} className="flex flex-col items-center mb-4 relative">
          <img
            src={croppedImage}
            alt={`Cropped logo ${index}`}
            className="w-auto h-auto mt-2"
            style={{
              transform: `rotate(${logoRotations[index]}deg)`,
            }}
          />
          <Button
            variant="ghost"
            onClick={() => removeLogo(index)}
            className="absolute top-0 right-0 mt-2 mr-2 text-red-500 hover:text-red-700">
            <X />
          </Button>
          <Button
            variant="default"
            onClick={() => rotateLogo(index, false)}
            className="mt-2 px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200 ease-in-out transform hover:scale-105">
            Rotate
          </Button>
        </div>
      ))}
    </div>
  );
};

export default GoogleLogoList;
