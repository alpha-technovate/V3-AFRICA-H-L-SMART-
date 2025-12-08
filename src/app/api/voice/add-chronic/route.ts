// ------------------------------------------------------------
// SMARTBRIDGE — Add Chronic Condition (Voice Command)
// Accepts structured + free-form medical condition input
// Normalizes into stabilized chronic schema + ICD-10 code
// ------------------------------------------------------------

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/admin";
import { lookupICD10 } from "@/lib/icd10/lookup";



export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChronicPayload {
  condition?: string;   // "Hypertension", "Diabetes Type 2"
  stage?: string;       // "Stage 3b", "Mild", "Severe"
  severity?: string;    // "Mild", "Moderate", "Severe", etc.
  onset?: string;       // "2 years ago", "since childhood", "2020-01-01"
  notes?: string;
  rawText?: string;     // fallback entire voice phrase
}

// Small helper to derive a status from severity text
function deriveStatusFromSeverity(severity?: string): string {
  if (!severity) return "Active";

  const s = severity.toLowerCase();
  if (s.includes("remission")) return "Remission";
  if (s.includes("controlled") || s.includes("mild") || s.includes("stable")) {
    return "Controlled";
  }
  return "Active";
}

// Try to normalize onset into a date string if it looks like a real date
function deriveDiagnosisDate(onset?: string): string {
  if (!onset) {
    return new Date().toISOString().split("T")[0];
  }

  const parsed = new Date(onset);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }

  // Fallback: today
  return new Date().toISOString().split("T")[0];
}

export async function POST(req: Request) {
  try {
    const { patientId, payload } = (await req.json()) as {
      patientId?: string;
      payload?: ChronicPayload;
    };

    if (!patientId) {
      return NextResponse.json(
        { success: false, error: "Missing patientId" },
        { status: 400 }
      );
    }

    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Missing payload" },
        { status: 400 }
      );
    }

    // ------------------------------------------------
    // Normalize into stabilized chronic schema
    // ------------------------------------------------

    const conditionName =
      payload.condition?.trim() ||
      payload.rawText?.trim() ||
      "Unspecified condition";

    const diagnosisDate = deriveDiagnosisDate(payload.onset);
    const status = deriveStatusFromSeverity(payload.severity);

    // 🔍 Look up ICD-10 code from your helper
    const icd10Code = lookupICD10(conditionName) || null;

    const extraBits: string[] = [];
    if (payload.stage) extraBits.push(`Stage: ${payload.stage}`);
    if (payload.onset) extraBits.push(`Onset: ${payload.onset}`);
    if (payload.severity) extraBits.push(`Severity: ${payload.severity}`);

    const combinedMeta = extraBits.join(" | ");

    const notes =
      (payload.notes && payload.notes.trim()) ||
      (combinedMeta ? combinedMeta : undefined);

    const chronicDoc: any = {
      conditionName,
      diagnosisDate,   // yyyy-mm-dd
      status,
      icd10Code,       // ✅ stored here
      notes: notes || null,

      // Audit/metadata
      createdAt: Date.now(),
      createdBy: "voice-assistant",

      // Raw payload for debugging / traceability
      rawPayload: payload,
    };

    // Clean up null/empty fields
    Object.keys(chronicDoc).forEach((k) => {
      if (
        chronicDoc[k] === null ||
        chronicDoc[k] === "" ||
        chronicDoc[k] === undefined
      ) {
        delete chronicDoc[k];
      }
    });

    // ------------------------------------------------
    // Save to Firestore
    // ------------------------------------------------
    const ref = await db
      .collection("patients")
      .doc(patientId)
      .collection("chronicConditions")
      .add(chronicDoc);

    return NextResponse.json({
      success: true,
      id: ref.id,
      chronic: chronicDoc,
      message: "Chronic condition added successfully via voice.",
    });
  } catch (err: any) {
    console.error("ADD CHRONIC CONDITION (VOICE) ERROR:", err);

    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Unknown error while adding chronic condition.",
      },
      { status: 500 }
    );
  }
}
