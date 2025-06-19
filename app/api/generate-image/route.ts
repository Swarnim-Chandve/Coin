import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Modality } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: prompt,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((part: any) => part.inlineData?.data);

    if (imagePart && imagePart.inlineData?.data) {
      return NextResponse.json({ image: imagePart.inlineData.data });
    } else {
      return NextResponse.json({ error: "No image generated" }, { status: 500 });
    }
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
} 