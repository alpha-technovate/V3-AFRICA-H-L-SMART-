// -------------------------------------------------------------
// /src/ai/context/getContext.ts
// FULL CONTEXT ENGINE FOR SMARTBRIDGE AI
// -------------------------------------------------------------
//
// This module gathers EVERYTHING the voice assistant needs:
// - Patient profile
// - Latest vitals
// - Latest clinical note
// - Optional: medications, allergies, conditions (expand later)
//
// All fetched from Firestore Admin SDK (db)
// -------------------------------------------------------------

import { db } from "@/lib/firebase/admin";

/** The full context structure returned to the AI engine */
export interface SmartContext {
  patientId: string | null;
  patient: any | null;
  latestVitals: any | null;
  latestNote: any | null;
}

/**
 * getSmartContext()
 * Fetches the patient context for the voice assistant.
 *
 * @param patientId string | null
 * @returns SmartContext
 */
export async function getSmartContext(
  patientId: string | null
): Promise<SmartContext> {
  console.log("🔍 Loading SmartContext for patient:", patientId);

  // -------------------------------------------------------------
  // No patient selected → Return blank context
  // -------------------------------------------------------------
  if (!patientId) {
    return {
      patientId: null,
      patient: null,
      latestVitals: null,
      latestNote: null,
    };
  }

  // Firestore refs
  const patientRef = db.collection("patients").doc(patientId);

  // -------------------------------------------------------------
  // 1️⃣ Get Patient Profile Document
  // -------------------------------------------------------------
  const patientSnap = await patientRef.get();

  const patient = patientSnap.exists ? patientSnap.data() : null;

  // -------------------------------------------------------------
  // 2️⃣ Get Latest Vitals
  // -------------------------------------------------------------
  const vitalsSnap = await patientRef
    .collection("vitals")
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

  const latestVitals = vitalsSnap.empty
    ? null
    : {
        id: vitalsSnap.docs[0].id,
        ...vitalsSnap.docs[0].data(),
      };

  // -------------------------------------------------------------
  // 3️⃣ Get Latest Note
  // -------------------------------------------------------------
  const notesSnap = await patientRef
    .collection("notes")
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

  const latestNote = notesSnap.empty
    ? null
    : {
        id: notesSnap.docs[0].id,
        ...notesSnap.docs[0].data(),
      };

  // -------------------------------------------------------------
  // 4️⃣ Assemble Context Object
  // -------------------------------------------------------------
  const context: SmartContext = {
    patientId,
    patient,
    latestVitals,
    latestNote,
  };

  console.log("✅ SmartContext Loaded:", context);

  return context;
}
