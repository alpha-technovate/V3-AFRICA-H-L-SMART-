export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function POST(req: Request) {
  try {
    const { audioBase64 } = await req.json();

    const res = await model.generateContent(`
Transcribe this audio (base64):

"${audioBase64}"
`);

    return NextResponse.json({
      success: true,
      transcript: res.response.text().trim(),
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Transcription failed" });
  }
}
