import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.GPT_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { base64Image } = await req.json();

    // text extraction and text recognition
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Please retrieve all text and detect the company logo in this picture. Label the text as follows: phone number, address, email address, company name, company website, name of the person on this business card, and job title. Return the result in JSON format with the following keys: phone_number, address, email_address, company_name, company_website, name, job_title, and logo." +
                "For the company logo," +
                "return its coordinates(must be in px) in the image in the following format: {logo_detected: 'boolean', logo: {x: 'x', y: 'y', width: 'width', height: 'height'}}." +
                "If the logo is not detected, return {logo_returned: false} and do not return logo. Support all image formats. Please strictly return the data in json format.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
    });
    return NextResponse.json(response.choices[0]);
  } catch (error: unknown) {
    let errorMessage = "An unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
