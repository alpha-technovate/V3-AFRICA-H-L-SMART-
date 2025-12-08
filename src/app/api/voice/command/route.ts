// src/app/api/voice/command/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ------------------------------------------
// MODEL INITIALISATION (MATCHES assistant)
// ------------------------------------------
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

// ------------------------------------------
// SAFE TEXT PARSER
// ------------------------------------------
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
    console.error("TEXT PARSE ERROR:", e);
    return "";
  }
}

// ------------------------------------------
// MAIN VOICE INTENT ROUTE
// ------------------------------------------
export async function POST(req: Request) {
  try {
    const { transcript } = await req.json();

    if (!transcript || !transcript.trim()) {
      return NextResponse.json({
        success: false,
        error: "No transcript received.",
      });
    }

    // ------------------------------------------
    // LLM PROMPT FOR STRUCTURED JSON
    // ------------------------------------------
    const prompt = `
You are the SmartBridge Voice Intent Engine.
You MUST return clean JSON only (no backticks, no prose), using the specified action names.

User said: "${transcript}"

Infer ONE primary action. Choose from this list ONLY:

- find_patient

- add_vital_signs
- add_medication
- prescribe_medication
- add_allergy
- remove_allergy
- add_chronic_condition
- remove_chronic_condition
- add_note
- add_soap_note
- add_history
- update_history
- clear_history
- create_referral
- suggest_specialist

- go_dashboard
- go_summary
- go_personal
- go_clinical
- go_history
- go_investigations
- go_treatment
- go_scans
- go_visits
- go_referral

- unknown

Return JSON with:
{
  "action": "...",
  "payload": { ... }
}

-------------------------------
PAYLOAD RULES
-------------------------------

1) add_vital_signs
- Used for commands like "BP 120 over 80, heart rate 90, spo2 96%, temp 37.5".
- Payload MUST be:

{
  "systolic": number,      // required if available
  "diastolic": number,     // required if available
  "heartRate": number|null,
  "temperature": number|null,
  "spo2": number|null,
  "weight": number|null
}

Example:
User: "Blood pressure 120 over 80 and pulse 90"
Payload:
{
  "systolic": 120,
  "diastolic": 80,
  "heartRate": 90,
  "temperature": null,
  "spo2": null,
  "weight": null
}

2) find_patient
- For phrases like "open John Smith", "find patient Mary".
- Payload MUST have:
{
  "name": "exact or best-effort patient name as string"
}

3) Navigation (go_*)
- For "go to summary", "open investigations tab", "back to dashboard", etc.
- Use one of:
  - "go_dashboard"
  - "go_summary"
  - "go_personal"
  - "go_clinical"
  - "go_history"
  - "go_investigations"
  - "go_treatment"
  - "go_scans"
  - "go_visits"
  - "go_referral"
- Payload MUST be an empty object:
{
  "action": "go_summary",
  "payload": {}
}

4) add_allergy
- For commands like:
  - "Add penicillin allergy, severe anaphylaxis"
  - "Patient is allergic to peanuts, mild rash and itching"
- Payload MUST include:

{
  "allergen": string,                          // e.g. "Penicillin"
  "type": "Drug" | "Food" | "Environmental" | "Other",
  "severity": "Mild" | "Moderate" | "Severe" | "Life-Threatening",
  "reaction": string,                          // clinical reaction text
  "notes": string | null,
  "intent": "add" | "remove"                   // "add" by default unless user explicitly wants to remove
}

If the user clearly says "add" (e.g. "add penicillin allergy"), set "intent": "add".
If the user clearly says "remove this allergy", you may use "intent": "remove".

5) remove_allergy
- For commands like:
  - "Remove penicillin allergy"
  - "Delete peanut allergy"
- Use this when the MAIN intent is to remove an existing allergy.
- Payload MUST include:
{
  "allergen": string
}

6) add_chronic_condition
- For commands like:
  - "Add chronic condition type 2 diabetes, controlled"
  - "Record hypertension, active since 2018"
- Payload MUST be:

{
  "conditionName": string,                     // e.g. "Type 2 Diabetes Mellitus"
  "status": "Active" | "Controlled" | "Remission" | "Inactive",
  "diagnosisDate": string | null,              // ISO date or null if not clear
  "notes": string | null
}

7) remove_chronic_condition
- For commands like:
  - "Remove chronic condition hypertension"
- Payload MUST include:
{
  "conditionName": string
}

8) add_medication / prescribe_medication
- For commands like:
  - "Start metformin one gram twice a day"
  - "Prescribe amoxicillin 500 milligrams three times a day for 5 days"
- If the word "prescribe" is used, prefer "prescribe_medication".
- Payload SHOULD be:

{
  "name": string,      // drug name
  "dose": string,      // e.g. "500 mg"
  "route": string,     // "Oral", "IV", etc if obvious, otherwise a reasonable guess
  "frequency": string, // free-text sig e.g. "twice daily"
  "duration": string | null, // e.g. "5 days" if mentioned
  "notes": string | null
}

9) add_note / add_soap_note
- For free-form instructions like:
  - "Add a note that the patient is worried about side effects"
  - "SOAP note: subjective chest pain, objective ECG normal..."
- If the user says "SOAP note" use "add_soap_note", otherwise "add_note".
- Payload MUST include:

{
  "text": string
}

10) add_history / update_history / clear_history
- For commands like:
  - "Add to history: patient has a strong family history of heart disease"
  - "Update history: remove smoking, patient quit 5 years ago"
  - "Clear the history section"
- Use:
  - "add_history"     when appending
  - "update_history"  when modifying
  - "clear_history"   when wiping
- Payload examples:

add_history:
{
  "mode": "append",
  "text": "Strong family history of heart disease."
}

update_history:
{
  "mode": "update",
  "text": "Patient quit smoking 5 years ago."
}

clear_history:
{
  "mode": "clear"
}

11) create_referral
- For commands like:
  - "Refer this patient to neurology for recurrent seizures"
- Payload SHOULD be:

{
  "specialty": string | null,   // e.g. "Neurology"
  "reason": string | null
}

12) suggest_specialist
- For commands like:
  - "Which specialist should I refer to for uncontrolled heart failure?"
- Payload SHOULD be:

{
  "question": string
}

13) unknown
- If you cannot confidently map the instruction to any of the above, use:
{
  "action": "unknown",
  "payload": {}
}

REMINDERS:
- Return EXACTLY one top-level JSON object.
- Do NOT wrap with backticks.
- Do NOT include any explanation text.
- Keys must be in double quotes and payload must match these shapes as closely as possible.
`;

    // ------------------------------------------
    // CALL MODEL
    // ------------------------------------------
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const raw = extractText(result.response).trim();

    // ------------------------------------------
    // JSON CLEANUP
    // ------------------------------------------
    const cleaned = raw
      .replace(/^```json/, "")
      .replace(/^```/, "")
      .replace(/```$/, "")
      .trim();

    let parsed: any = {};
    try {
      parsed = JSON.parse(cleaned);
    } catch (jsonErr) {
      console.error("INTENT JSON ERROR:", cleaned, jsonErr);

      return NextResponse.json({
        success: true,
        action: "unknown",
        payload: { message: "Failed to parse command due to JSON error." },
      });
    }

    // ------------------------------------------
    // VALIDATION + RETURN
    // ------------------------------------------
    return NextResponse.json({
      success: true,
      action: parsed.action ?? "unknown",
      payload: parsed.payload ?? {},
    });
  } catch (err: any) {
    console.error("VOICE INTENT ERROR:", err);

    return NextResponse.json({
      success: false,
      error: err.message,
    });
  }
}
