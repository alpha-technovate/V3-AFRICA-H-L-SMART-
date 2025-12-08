// src/app/api/investigations/interpret/route.ts

import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// --------------------------------------------------
// Types
// --------------------------------------------------
interface InterpretBody {
  patientSummary?: string;   // optional context (age, main diagnosis, etc.)
  investigationType?: string; // "Full blood count", "Troponin", "CT Chest", etc.
  rawText?: string;          // pasted report
  labValues?: Record<string, any>; // optional structured labs
}

// What we want from the model
interface InterpretationResult {
  summary: string;
  impression: string;
  redFlags: string[];
  recommendations: string[];
  urgencyLevel: "routine" | "soon" | "urgent";
}

const SYSTEM_PROMPT = `
You are an experienced clinical specialist helping interpret investigations.

You will be given:
- (Optional) Patient summary (age, history, diagnosis)
- Investigation type (e.g. "Full Blood Count", "CT Pulmonary Angiogram")
- Raw report text and/or lab values

Your job:
1. Summarise the key findings in simple, clinically clear language.
2. Give an overall impression.
3. List any RED FLAG features that require urgent attention.
4. Give practical recommendations for next steps (follow-up tests, referrals, management).
5. Rate urgency as: "routine", "soon", or "urgent".

Return ONLY valid JSON in this exact shape:

{
  "summary": "string",
  "impression": "string",
  "redFlags": ["string"],
  "recommendations": ["string"],
  "urgencyLevel": "routine" | "soon" | "urgent"
}
`.trim();

// --------------------------------------------------
// POST – interpret an investigation using Gemini
// --------------------------------------------------
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as InterpretBody;

    if (!body.rawText && !body.labValues) {
      return NextResponse.json(
        {
          success: false,
          error: "Provide rawText and/or labValues for interpretation.",
        },
        { status: 400 }
      );
    }

    const investigationType = body.investigationType || "Investigation / Report";
    const patientSummary = body.patientSummary || "No additional patient context provided.";
    const rawText = body.rawText || "";
    const labValuesBlock = body.labValues
      ? JSON.stringify(body.labValues, null, 2)
      : "No structured lab values provided.";

    const userPrompt = `
PATIENT SUMMARY:
${patientSummary}

INVESTIGATION TYPE:
${investigationType}

RAW REPORT / TEXT:
${rawText || "None provided"}

LAB VALUES (JSON):
${labValuesBlock}
`.trim();

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const result = await model.generateContent([
      { text: SYSTEM_PROMPT },
      { text: userPrompt },
    ]);

    const text = result.response.text().trim();

    let parsed: InterpretationResult;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      console.error("INVESTIGATION INTERPRET JSON PARSE ERROR:", text);
      return NextResponse.json(
        {
          success: false,
          error: "Model returned invalid JSON. Check logs for details.",
        },
        { status: 500 }
      );
    }

    // Basic validation of required keys
    if (
      typeof parsed.summary !== "string" ||
      typeof parsed.impression !== "string" ||
      !Array.isArray(parsed.redFlags) ||
      !Array.isArray(parsed.recommendations) ||
      !["routine", "soon", "urgent"].includes(parsed.urgencyLevel)
    ) {
      console.error("INVESTIGATION INTERPRET – malformed structure:", parsed);
      return NextResponse.json(
        {
          success: false,
          error: "Model JSON missing required fields or invalid types.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: parsed,
    });
  } catch (err: any) {
    console.error("INVESTIGATION INTERPRET ERROR:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to interpret investigation" },
      { status: 500 }
    );
  }
}
