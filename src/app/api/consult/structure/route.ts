import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error("❌ Missing environment variable: GEMINI_API_KEY");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChronicCondition {
  name: string;
  onsetDate?: string;
  status?: string;
}

interface Allergy {
  substance: string;
  reaction?: string;
  severity?: string;
}

interface StructuredConsult {
  chronicConditions: ChronicCondition[];
  allergies: Allergy[];
}

export async function POST(req: NextRequest) {
  try {
    const { consultNotes } = await req.json();

    if (!consultNotes || typeof consultNotes !== "string") {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: "Missing or invalid field: consultNotes",
        },
        { status: 400 }
      );
    }

    const prompt = `
You are an EMR assistant. From the consultation text below, extract:

1) chronicConditions: array of objects
   - name: string (condition name)
   - onsetDate: string (YYYY-MM-DD if known, else "")
   - status: string ("Active", "Resolved", or "")

2) allergies: array of objects
   - substance: string
   - reaction: string (e.g. "rash", "anaphylaxis", "GI upset")
   - severity: string ("Mild", "Moderate", "Severe", or "")

Return ONLY valid JSON in this exact format, no extra text:

{
  "chronicConditions": [
    { "name": "", "onsetDate": "", "status": "" }
  ],
  "allergies": [
    { "substance": "", "reaction": "", "severity": "" }
  ]
}

Consultation text:
"""${consultNotes}"""
`;

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const result = await model.generateContent([prompt]);
    const raw = result.response.text().trim();

    let parsed: StructuredConsult;

    try {
      const clean = raw.replace(/```json\s*|```/g, "").trim();
      parsed = JSON.parse(clean) as StructuredConsult;
    } catch (err) {
      console.error("Consult JSON parse error:", raw);
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: "Could not parse AI response into JSON.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        chronicConditions: parsed.chronicConditions || [],
        allergies: parsed.allergies || [],
      },
      error: null,
    });
  } catch (err: any) {
    console.error("consult-structure ERROR:", err);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error:
          err?.message ||
          "An unexpected error occurred during consult structuring.",
      },
      { status: 500 }
    );
  }
}
