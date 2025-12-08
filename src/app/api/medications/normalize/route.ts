// src/app/api/medications/normalize/route.ts

import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawText: string = body.text || body.raw || "";

    if (!rawText.trim()) {
      return NextResponse.json(
        { success: false, error: "Missing text to normalize" },
        { status: 400 }
      );
    }

    const prompt = `
You are a clinical medication normalizer.

Input is free-text from a doctor describing a medication.
Extract and normalize the data into a single JSON object:

{
  "name": "medication name (generic if possible)",
  "dose": "e.g. 5 mg",
  "route": "e.g. oral, IV, subcutaneous, inhaled",
  "frequency": "e.g. once daily, bd, tds",
  "startDate": "",
  "endDate": "",
  "status": "active | stopped | prn | unknown",
  "notes": "any extra notes"
}

Return ONLY valid JSON, no markdown, no explanation.

Text:
${rawText}
`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent([prompt]);
    const text = result.response.text().trim();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      console.error("MEDS NORMALIZE JSON PARSE ERROR:", text);
      return NextResponse.json(
        { success: false, error: "AI returned invalid JSON" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      normalized: parsed,
    });
  } catch (err: any) {
    console.error("MEDS NORMALIZE ERROR:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Normalization failed" },
      { status: 500 }
    );
  }
}
