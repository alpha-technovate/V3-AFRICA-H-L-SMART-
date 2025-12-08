// src/app/api/treatment-notes/route.ts

import { NextResponse, NextRequest } from "next/server";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Define the required fields for the database
interface TreatmentNote {
  patientId: string;
  title: string;
  note: string;
  doctorId: string; 
  doctorName: string; 
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// NOTE: The corrected collection name is 'treatmentNotes'
const COLLECTION_NAME = "treatmentNotes";

// ======================================================
// POST — ADD NEW TREATMENT NOTE
// ======================================================
export async function POST(req: NextRequest) {
  try {
    const body: Partial<TreatmentNote> = await req.json();

    const { patientId, title, note, doctorId, doctorName } = body;

    // --- Strict Validation ---
    if (!patientId || !note) {
      return NextResponse.json(
        { success: false, data: null, error: "patientId and note content are required" },
        { status: 400 }
      );
    }

    const newNote: Omit<TreatmentNote, 'createdAt' | 'updatedAt'> = {
      patientId,
      title: title || "",
      note: note,
      doctorId: doctorId || "DOC_UNSPECIFIED", // Use a default ID if none provided
      doctorName: doctorName || "Unspecified Doctor",
    };
    
    const now = Timestamp.now();

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...newNote,
        createdAt: now, // Standardized timestamp
        updatedAt: now, // Standardized timestamp
    });

    // --- Unified JSON Response Schema ---
    return NextResponse.json({ 
        success: true, 
        data: { message: "Treatment Note created successfully.", id: docRef.id },
        error: null,
    });
  } catch (err: any) {
    console.error("TREATMENT POST ERROR:", err);
    return NextResponse.json(
      { success: false, data: null, error: `Server Error: ${err?.message || "Failed to create treatment note"}` },
      { status: 500 }
    );
  }
}

// ======================================================
// GET — FETCH ALL TREATMENT NOTES FOR A PATIENT
// GET /api/treatment-notes?patientId=XYZ
// ======================================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const patientId = searchParams.get("patientId");

    // --- Strict Validation ---
    if (!patientId) {
      return NextResponse.json(
        { success: false, data: null, error: "Missing required query parameter: patientId" },
        { status: 400 }
      );
    }

    const q = query(
      collection(db, COLLECTION_NAME),
      where("patientId", "==", patientId)
      // NOTE: Consider adding orderBy('createdAt', 'desc') here
    );

    const snap = await getDocs(q);

    const notes = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    // --- Unified JSON Response Schema ---
    return NextResponse.json({ 
        success: true, 
        data: notes, 
        error: null,
    });
  } catch (err: any) {
    console.error("TREATMENT GET ERROR:", err);
    return NextResponse.json(
      { success: false, data: null, error: `Server Error: ${err?.message || "Failed to fetch treatment notes"}` },
      { status: 500 }
    );
  }
}

// ======================================================
// PATCH — UPDATE A NOTE
// Body: { id, title?, note? }
// ======================================================
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, note, ...rest } = body; // Include rest for future fields

    // --- Strict Validation ---
    if (!id) {
      return NextResponse.json(
        { success: false, data: null, error: "Missing required field: id for PATCH operation" },
        { status: 400 }
      );
    }

    const ref = doc(db, COLLECTION_NAME, id);

    const payload: any = {
      ...rest, // Include any other fields passed in the body
      updatedAt: Timestamp.now(), // Standardized timestamp
    };

    if (title !== undefined) payload.title = title;
    if (note !== undefined) payload.note = note;

    await updateDoc(ref, payload);

    // --- Unified JSON Response Schema ---
    return NextResponse.json({ 
        success: true, 
        data: { message: `Treatment Note ${id} updated.` },
        error: null,
    });
  } catch (err: any) {
    console.error("TREATMENT PATCH ERROR:", err);
    return NextResponse.json(
      { success: false, data: null, error: `Server Error: ${err?.message || "Failed to update treatment note"}` },
      { status: 500 }
    );
  }
}