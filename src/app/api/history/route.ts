// src/app/api/history/route.ts

import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

// Use 'patientHistory' for clarity in the response structure
type PatientHistory = {
  patientId: string;
  pastMedical: string;
  surgical: string;
  family: string;
  social: string;
  other: string;
  updatedAt: Timestamp | null;
};

// Define the expected structure for the POST request payload
type HistoryPayload = {
  patientId: string;
  pastMedical?: string;
  surgical?: string;
  family?: string;
  social?: string;
  other?: string;
};

// ======================================================
// GET — /api/history?patientId=XYZ
// Fetches the structured history document for the patient.
// ======================================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");

    // --- Strict Validation ---
    if (!patientId) {
      return NextResponse.json(
        { success: false, data: null, error: "Missing required parameter: patientId." },
        { status: 400 }
      );
    }

    const ref = doc(db, "histories", patientId);
    const snap = await getDoc(ref);

    const defaultHistory: PatientHistory = {
      patientId,
      pastMedical: "",
      surgical: "",
      family: "",
      social: "",
      other: "",
      updatedAt: null,
    };

    if (!snap.exists()) {
      // Return the default template if no document is found
      return NextResponse.json({
        success: true,
        data: defaultHistory,
        error: null,
      });
    }

    // Map Firestore data to the PatientHistory structure
    const data = snap.data() || {};
    const historyData: PatientHistory = {
      ...defaultHistory, // Start with defaults
      ...(data as Partial<PatientHistory>), // Overwrite with actual data
      patientId: data.patientId || patientId, // Ensure patientId is present
    };

    // --- Unified JSON Response Schema ---
    return NextResponse.json({
      success: true,
      data: historyData,
      error: null,
    });

  } catch (error) {
    // --- Correct Async Error Handling ---
    console.error("HISTORY GET ERROR:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to load history";

    return NextResponse.json(
      { success: false, data: null, error: `Server Error: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// ======================================================
// POST — /api/history
// Upserts the structured history for a patient.
// ======================================================
export async function POST(req: NextRequest) {
  try {
    const body: HistoryPayload = await req.json();
    const { patientId, pastMedical, surgical, family, social, other } = body;

    // --- Strict Validation (patientId is mandatory) ---
    if (!patientId) {
      return NextResponse.json(
        { success: false, data: null, error: "patientId is required in the request body." },
        { status: 400 }
      );
    }

    // --- Prepare Update Data (using optional chaining for clean merge) ---
    const updateData: Partial<PatientHistory> & { updatedAt: Timestamp } = {
      updatedAt: Timestamp.now(), // Use the global standard Timestamp.now()
    };

    if (pastMedical !== undefined) updateData.pastMedical = pastMedical;
    if (surgical !== undefined) updateData.surgical = surgical;
    if (family !== undefined) updateData.family = family;
    if (social !== undefined) updateData.social = social;
    if (other !== undefined) updateData.other = other;

    // Ensure patientId is stored/updated
    updateData.patientId = patientId;

    const ref = doc(db, "histories", patientId);

    // Use setDoc with merge: true for upsert functionality
    await setDoc(ref, updateData, { merge: true });

    // --- Unified JSON Response Schema ---
    return NextResponse.json({
      success: true,
      data: { message: "Patient history saved successfully.", patientId },
      error: null,
    });

  } catch (error) {
    // --- Correct Async Error Handling ---
    console.error("HISTORY POST ERROR:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to save history";

    return NextResponse.json(
      { success: false, data: null, error: `Server Error: ${errorMessage}` },
      { status: 500 }
    );
  }
}