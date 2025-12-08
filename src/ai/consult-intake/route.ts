// src/app/api/ai/consult-intake/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// -----------------------------
// GEMINI MODEL
// -----------------------------
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
});

// Helper to safely pull text out of Gemini response
function extractText(resp: any): string {
    try {
        if (!resp) return "";

        if (typeof resp.text === "function") return resp.text();
        if (typeof resp.text === "string") return resp.text();

        const text =
            resp.candidates?.[0]?.content?.parts?.[0]?.text ??
            resp.candidates?.[0]?.content?.parts?.[0]?.content ??
            "";

        return text || "";
    } catch (e) {
        console.error("CONSULT-INTAKE TEXT PARSE ERROR:", e);
        return "";
    }
}

export async function POST(req: Request) {
    try {
        const { transcript } = await req.json();

        if (!transcript || !transcript.trim()) {
            return NextResponse.json(
                {
                    success: false,
                    error: "No transcript provided.",
                },
                { status: 400 }
            );
        }

        const prompt = `
You are the SmartBridge clinical intake engine.

TASK:
Turn the following consultation transcript into clean, structured JSON that can be stored
for a new patient. Focus on cardiothoracic / internal medicine style consults in South Africa.

User transcript:
"""${transcript}"""

You MUST return ONLY valid JSON, no explanations or markdown, with this EXACT top-level shape:

{
  "problems": [ ... ],
  "chronicConditions": [ ... ],
  "medications": [ ... ],
  "allergies": [ ... ],
  "notes": {
    "soapNote": string
  }
}

Where:

- problems[]: current problems mentioned in the consult
  [
    {
      "name": string,                 // e.g. "Chest pain", "Shortness of breath"
      "status": "Active" | "Resolved" | "Monitoring",
      "onsetDate": string | null,     // best guess in ISO "YYYY-MM-DD" or null
      "notes": string | null,
      "icd10Code": string | null,     // if obvious, else null
      "icd10Description": string | null
    }
  ]

- chronicConditions[]: long-term conditions (hypertension, diabetes, CKD, etc.)
  [
    {
      "name": string,
      "severity": "Mild" | "Moderate" | "Severe",
      "notes": string | null,
      "icd10Code": string | null,
      "icd10Description": string | null,
      "status": "Active" | "Controlled" | "Remission" | "Inactive"
    }
  ]

- medications[]: active meds mentioned in the consult
  [
    {
      "name": string,                 // "Amlodipine"
      "dose": string | null,          // "5mg", "500mg bd"
      "route": string | null,         // "Oral", "IV", etc.
      "frequency": string | null,     // "once daily"
      "status": "Active" | "Stopped",
      "class": string | null,         // "ACE inhibitor", "Beta blocker" etc.
      "notes": string | null
    }
  ]

- allergies[]: drug / food / environmental allergies
  [
    {
      "allergen": string,  // "Penicillin", "Peanuts"
      "type": "Drug" | "Food" | "Environmental" | "Other",
      "severity": "Mild" | "Moderate" | "Severe" | "Life-Threatening",
      "reaction": string | null,    // "anaphylaxis", "urticaria", etc.
      "notes": string | null
    }
  ]

- notes.soapNote: a concise note for the record (you can use SOAP style).

If the transcript does not mention a category, return an empty array for that category.
Do NOT invent serious diagnoses that are not clearly implied in the text.
`;

        // 👇 FIX APPLIED HERE: Pass the full prompt containing the transcript
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        const raw = extractText(result.response).trim();

        // strip ```json fences if Gemini adds them
        const cleaned = raw
            .replace(/^```json/i, "")
            .replace(/^```/, "")
            .replace(/```$/, "")
            .trim();

        let parsed: any;
        try {
            parsed = JSON.parse(cleaned);
        } catch (e) {
            console.error("CONSULT-INTAKE JSON PARSE ERROR:", cleaned, e);
            return NextResponse.json(
                {
                    success: false,
                    error: "AI response was not valid JSON. Raw AI output required manual cleaning.",
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                problems: parsed.problems ?? [],
                chronicConditions: parsed.chronicConditions ?? [],
                medications: parsed.medications ?? [],
                allergies: parsed.allergies ?? [],
                notes: parsed.notes ?? { soapNote: "" },
            },
        });
    } catch (err: any) {
        console.error("CONSULT-INTAKE FATAL ERROR:", err);
        return NextResponse.json(
            {
                success: false,
                error: err.message || "Unexpected error in consult-intake.",
            },
            { status: 500 }
        );
    }
}