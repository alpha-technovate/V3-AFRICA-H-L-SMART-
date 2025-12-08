export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    const prompt = `
Extract specialist type from doctor request:
"${query}"

Return ONLY:
{
 "specialist": ""
}
`;

    const ai = await model.generateContent(prompt);
    let raw = ai.response.text().replace(/```json|```/g, "").trim();

    const parsed = JSON.parse(raw);

    return NextResponse.json({
      success: true,
      specialistName: parsed.specialist,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
