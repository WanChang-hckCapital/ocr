import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { GoogleAuth } from "google-auth-library";

const serviceAccount = {
  type: process.env.SERVICE_ACCOUNT_TYPE,
  project_id: process.env.SERVICE_ACCOUNT_PROJECT_ID,
  private_key_id: process.env.SERVICE_ACCOUNT_PRIVATE_KEY_ID,
  private_key: process.env.SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  client_email: process.env.SERVICE_ACCOUNT_CLIENT_EMAIL,
  client_id: process.env.SERVICE_ACCOUNT_CLIENT_ID,
  auth_uri: process.env.SERVICE_ACCOUNT_AUTH_URI,
  token_uri: process.env.SERVICE_ACCOUNT_TOKEN_URI,
  auth_provider_x509_cert_url:
    process.env.SERVICE_ACCOUNT_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.SERVICE_ACCOUNT_CLIENT_X509_CERT_URL,
  universe_domain: process.env.SERVICE_ACCOUNT_UNIVERSE_DOMAIN,
};

async function getAccessToken() {
  const auth = new GoogleAuth({
    credentials: serviceAccount,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  return tokenResponse.token;
}

export async function POST(req: NextRequest) {
  if (req.method !== "POST") {
    return NextResponse.json(
      { message: "Method not allowed" },
      { status: 405 }
    );
  }

  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json(
        { message: "Image is required" },
        { status: 400 }
      );
    }

    const imageBuffer = Buffer.from(image, "base64");
    const base64Image = imageBuffer.toString("base64");

    // logo_detection perform better using google vision
    const requestPayload = {
      requests: [
        {
          features: [
            // {
            //   maxResults: 50,
            //   model: "builtin/latest",
            //   type: "DOCUMENT_TEXT_DETECTION",
            // },
            { maxResults: 50, type: "LOGO_DETECTION" },
          ],
          image: {
            content: base64Image,
          },
          imageContext: {
            cropHintsParams: {
              aspectRatios: [0.8, 1, 1.2],
            },
          },
        },
      ],
    };

    const token = await getAccessToken();

    const response = await axios.post(
      "https://vision.googleapis.com/v1/images:annotate",
      requestPayload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const visionResponse = response.data.responses[0];

    const result = {
      // textAnnotations: visionResponse.textAnnotations,
      logoAnnotations: visionResponse.logoAnnotations,
      // fullTextAnnotation: visionResponse.fullTextAnnotation,
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error analyzing image:", error);
    return NextResponse.json(
      {
        message: "Failed to analyze image",
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
