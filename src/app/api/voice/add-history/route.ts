// ------------------------------------------------------------
// SMARTBRIDGE — Add / Update History (Voice Command)
// Appends / replaces / clears structured history fields
// and keeps a single unified history doc per patient.
// ------------------------------------------------------------

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type HistoryField = "pastMedical" | "surgical" | "family" | "social" | "other";

interface HistoryPayload {
  pastMedical?: string;
  surgical?: string;
  family?: string;
  social?: string;
  other?: string;

  mode?: "append" | "replace" | "clear";
  rawText?: string;
}

// 🔎 helper: list of fields
const historyFields: HistoryField[] = [
  "pastMedical",
  "surgical",
  "family",
  "social",
  "other",
];

/**
 * TODO: replace this with a real LLM call.
 * Given a raw transcript, return structured history sections.
 */
async function classifyHistoryFromRaw(
  rawText: string
): Promise<Partial<Record<HistoryField, string>>> {
  // For now, keep old behaviour: everything goes into "other".
  // Later you can hook Genkit / OpenAI here and have it return
  // { pastMedical: "...", family: "...", social: "..." } etc.
  return {
    other: rawText,
  };
}

/**
 * POST body:
 * {
 *   "patientId": "abc123",
 *   "payload": {
 *     "social": "Smokes 5 per day, truck driver",
 *     "mode": "append"
 *   }
 * }
 */
export async function POST(req: Request) {
  try {
    const { patientId, payload } = (await req.json()) as {
      patientId?: string;
      payload?: HistoryPayload;
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

    let { mode = "append", rawText, ...fields } = payload;

    // ------------------------------------------------
    // Determine if any explicit fields were sent
    // ------------------------------------------------
    let hasAnyField = historyFields.some(
      (f) => typeof (fields as any)[f] === "string"
    );

    // If no explicit fields but we have rawText, ask AI to split it
    if (!hasAnyField && rawText) {
      const structured = await classifyHistoryFromRaw(rawText);
      fields = { ...fields, ...structured };
      hasAnyField = historyFields.some(
        (f) => typeof (fields as any)[f] === "string"
      );
    }

    if (!hasAnyField) {
      return NextResponse.json(
        {
          success: false,
          error:
            "History payload must include at least one section (pastMedical, surgical, family, social, other) or rawText.",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------
    // Load existing unified history document
    // ------------------------------------------------
    const ref = db.collection("history").doc(patientId);
    const snap = await ref.get();
    const existing = (snap.exists ? snap.data() : {}) as Partial<{
      pastMedical: string;
      surgical: string;
      family: string;
      social: string;
      other: string;
    }>;

    const updateData: any = {};

    // ------------------------------------------------
    // Apply mode (append / replace / clear) per field
    // ------------------------------------------------
    for (const field of historyFields) {
      const incoming = (fields as any)[field];

      if (incoming !== undefined) {
        if (mode === "clear") {
          updateData[field] = "";
        } else if (mode === "append") {
          const current = existing[field] || "";
          updateData[field] = current ? `${current}\n${incoming}` : incoming;
        } else {
          // "replace" (or unknown) => full overwrite
          updateData[field] = incoming;
        }
      }
    }

    // audit / metadata
    updateData.patientId = patientId;
    updateData.rawVoice = rawText || null;
    updateData.updatedAt = new Date();

    Object.keys(updateData).forEach((k) => {
      if (updateData[k] === null || updateData[k] === undefined) {
        delete updateData[k];
      }
    });

    await ref.set(updateData, { merge: true });

    return NextResponse.json({
      success: true,
      history: updateData,
      message: "History updated successfully via voice.",
    });
  } catch (err: any) {
    console.error("ADD HISTORY (VOICE) ERROR:", err);

    return NextResponse.json(
      {
        success: false,
        error:
          err?.message || "Unknown error while updating history via voice.",
      },
      { status: 500 }
    );
  }
}
