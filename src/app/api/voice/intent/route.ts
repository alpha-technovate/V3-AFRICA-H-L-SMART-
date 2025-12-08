// ---------------------------------------------------------------------
// /src/app/api/voice/intent/route.ts
// SMARTBRIDGE VOICE INTENT ENGINE v4
// Uses Genkit → globalVoiceAssistant() + SmartContext
// ---------------------------------------------------------------------

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { globalVoiceAssistant } from "@/ai/flows/global-voice-ai-assistant";
import { getSmartContext } from "@/ai/context/getContext";

// Final structured result returned to /api/voice/command
interface IntentResponse {
  success: boolean;
  action: string;
  payload: Record<string, any>;
  llmAction?: string;
}

export async function POST(req: Request) {
  try {
    const { transcript, patientId } = await req.json();

    if (!transcript || transcript.trim().length < 1) {
      return NextResponse.json({
        success: false,
        error: "Missing transcript.",
      });
    }

    // ---------------------------------------------------
    // 1️⃣  LOAD CONTEXT FOR GENKIT AI
    // ---------------------------------------------------
    const context = await getSmartContext(patientId || null);

    // ---------------------------------------------------
    // 2️⃣  CALL GENKIT GLOBAL ASSISTANT FLOW
    // ---------------------------------------------------
    const aiResult = await globalVoiceAssistant({
      voiceInput: transcript,
      context: JSON.stringify(context),
      patientId: patientId || undefined,
    });

    // aiResult contains:
    // {
    //   updatedFields: { ... },
    //   actionTaken: "..."
    // }

    const updated = aiResult.updatedFields || {};
    const actionTaken = aiResult.actionTaken || "unknown";

    // Prepare default return
    let action: string = "unknown";
    let payload: Record<string, any> = {};

    const lower = transcript.toLowerCase();

    // ---------------------------------------------------
    // 3️⃣  RULE-BASED TRIGGERS (override AI if necessary)
    // ---------------------------------------------------

    // FIND PATIENT ("find patient John Smith")
    const findMatch = lower.match(/find patient (.+)/);
    if (findMatch) {
      action = "find_patient";
      payload.name = findMatch[1];
    }

    // NAVIGATION
    if (lower.includes("dashboard")) action = "go_dashboard";
    if (lower.includes("summary")) action = "go_summary";
    if (lower.includes("personal")) action = "go_personal";
    if (lower.includes("clinical")) action = "go_clinical";
    if (lower.includes("history")) action = "go_history";
    if (lower.includes("investigation")) action = "go_investigations";
    if (lower.includes("treatment")) action = "go_treatment";
    if (lower.includes("scan")) action = "go_scans";
    if (lower.includes("visit")) action = "go_visits";
    if (lower.includes("referral")) action = "go_referral";

    // ---------------------------------------------------
    // 4️⃣  AI-DRIVEN FIELD DETECTION
    // ---------------------------------------------------
    // VITAL SIGNS
    if (updated["patient.bloodPressure"]) {
      action = "add_vital_signs";
      payload.bp = updated["patient.bloodPressure"];
    }

    if (updated["patient.heartRate"]) {
      action = "add_vital_signs";
      payload.hr = updated["patient.heartRate"];
    }

    if (updated["patient.temperature"]) {
      action = "add_vital_signs";
      payload.temp = updated["patient.temperature"];
    }

    // CLINICAL NOTE
    if (updated["consultation.notes"]) {
      action = "add_note";
      payload.text = updated["consultation.notes"];
    }

    // MEDICATION
    if (updated["patient.medication"]) {
      action = "add_medication";
      payload = updated["patient.medication"];
    }

    // ALLERGY
    if (updated["patient.allergy"]) {
      action = "add_allergy";
      payload = updated["patient.allergy"];
    }

    // CHRONIC CONDITION
    if (updated["patient.chronicCondition"]) {
      action = "add_chronic_condition";
      payload = updated["patient.chronicCondition"];
    }

    // REFERRAL
    if (updated["patient.referral"]) {
      action = "create_referral";
      payload = updated["patient.referral"];
    }

    // ---------------------------------------------------
    // 5️⃣  RETURN CLEAN INTENT RESULT
    // ---------------------------------------------------
    const response: IntentResponse = {
      success: true,
      action,
      payload,
      llmAction: actionTaken,
    };

    return NextResponse.json(response);

  } catch (err: any) {
    console.error("INTENT ENGINE ERROR:", err);

    return NextResponse.json({
      success: false,
      error: err.message || "Unknown error",
    });
  }
}
