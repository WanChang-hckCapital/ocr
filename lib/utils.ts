import { type ClassValue, clsx } from "clsx";
import { v4 as uuidv4 } from "uuid";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// why??
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

export const convertExtractedInfoToEditorElements = (
  extractedInfo: any,
  originalWidth: number
): any[] => {
  console.log("Ori image Width:", originalWidth);

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

  const createTextElement = (text: string, position: any): any => {
    const scaledPosition = scalePosition(position, originalWidth);
    const { x0, x1 } = scaledPosition;
    const textAlign = calculateTextAlign(x0, x1, originalWidth);

    // sm?
    return {
      id: generateCustomID(),
      type: "text",
      text: text,
      size: "sm",
      align: textAlign,
      description: "text description",
    };
  };

  // final json format data
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

  Object.keys(extractedInfo).forEach((key) => {
    const field = extractedInfo[key];
    if (field.position) {
      console.log("Field with position:", field);
      elements.push(createBoxElement(field));
    } else {
      console.log("Field without position:", field);
    }
  });

  console.log("Elements array:", elements);

  return elements;
};

// ocr from google api
export const analyzeImage = async (
  file: File
): Promise<{
  textAnnotations: any[];
  logoAnnotations: any[];
  fullTextAnnotation: any;
}> => {
  const base64Image = await fileToBase64(file);

  const response = await fetch("/api/cloud-vision", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ image: base64Image.split(",")[1] }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to analyze image: ${errorData.message}`);
  }

  const data = await response.json();
  return {
    textAnnotations: data.fullTextAnnotation,
    logoAnnotations: data.logoAnnotations,
    fullTextAnnotation: data.fullTextAnnotation,
  };
};

// auto crop picture edge google api
export const autoCropEdgeImage = async (
  file: File
): Promise<{
  objectAnnotations: any;
}> => {
  const base64Image = await fileToBase64(file);

  const response = await fetch("/api/cloud-vision/auto-crop", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ image: base64Image.split(",")[1] }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to crop picture edge: ${errorData.message}`);
  }

  const data = await response.json();
  return {
    objectAnnotations: data.objectAnnotations,
  };
};

// gpt api
export const callChatGpt = async (image: File): Promise<any> => {
  const base64Image = await fileToBase64GPT(image);

  const response = await fetch("/api/gptapi", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ base64Image }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to call GPT API: ${errorData.message}`);
  }

  const data = await response.json();
  return data;
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const fileToBase64GPT = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(",")[1]; // Exclude metadata
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// export const fileToBase64GPT = (file: File): Promise<string> => {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     reader.onloadend = () => {
//       const base64String = (reader.result as string).split(",")[1];
//       resolve(base64String);
//     };
//     reader.onerror = reject;
//     reader.readAsDataURL(file);
//   });
// };

export function generateCustomID() {
  return uuidv4();
}
