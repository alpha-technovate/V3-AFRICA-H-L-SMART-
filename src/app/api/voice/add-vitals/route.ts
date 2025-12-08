// ------------------------------------------------------------
// SMARTBRIDGE — Add Medication (Voice Command)
// Full prescribing engine with structured fields
// ------------------------------------------------------------

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface MedicationPayload {
  drug?: string;
  dose?: string;
  route?: string;
  frequency?: string;
  duration?: string;
  repeats?: number;
  indication?: string;
  prn?: boolean;
  rawText?: string; // original voice phrase
}

interface RequestBody {
  patientId?: string;
  payload?: MedicationPayload;
}

// Small helpers
const cleanString = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestBody;

    const patientId = body?.patientId;
    const payload = body?.payload;

    if (!patientId) {
      return NextResponse.json(
        { success: false, error: "Missing patientId" },
        { status: 400 }
      );
    }

    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Missing medication payload" },
        { status: 400 }
      );
    }

    // --------------------------------------------
    // CLEAN + NORMALIZE FIELDS
    // --------------------------------------------
    const med = {
      drug: cleanString(payload.drug),
      dose: cleanString(payload.dose),
      route: cleanString(payload.route),
      frequency: cleanString(payload.frequency),
      duration: cleanString(payload.duration),
      repeats:
        typeof payload.repeats === "number" && !isNaN(payload.repeats)
          ? payload.repeats
          : 0,
      indication: cleanString(payload.indication),
      prn: Boolean(payload.prn),
      rawText: cleanString(payload.rawText),
      createdAt: Date.now(),
      createdBy: "voice-assistant",
    };

    if (!med.drug) {
      return NextResponse.json(
        {
          success: false,
          error: "Medication must include at least a drug name.",
        },
        { status: 400 }
      );
    }

    // Remove undefined / empty fields before saving
    Object.keys(med).forEach((k) => {
      const val = (med as any)[k];
      if (val === undefined || val === null || val === "") {
        delete (med as any)[k];
      }
    });

    // --------------------------------------------
    // SAVE TO FIRESTORE
    // --------------------------------------------
    const ref = await db
      .collection("patients")
      .doc(patientId)
      .collection("medications")
      .add(med);

    return NextResponse.json(
      {
        success: true,
        id: ref.id,
        medication: med,
        message: `Medication "${med.drug}" added successfully.`,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("ADD MEDICATION ERROR:", err);

    return NextResponse.json(
      {
        success: false,
        error:
          err?.message ||
          "Unknown error while adding medication via voice command.",
      },
      { status: 500 }
    );
  }
}
