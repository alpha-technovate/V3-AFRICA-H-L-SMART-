// src/app/api/notes/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseConfig";
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc,
  getDocs, 
  query, 
  where, 
  Timestamp 
} from "firebase/firestore";

// Define the core structure for a Clinical Note document
interface ClinicalNote {
  patientId: string;
  authorId: string; // Doctor or other clinician ID
  noteType: 'Progress' | 'Discharge Summary' | 'Administrative' | 'Triage' | string;
  content: string; // The free-text body of the note
  consultationId?: string; // Optional link to a specific consultation
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ======================================================
// GET — /api/notes
// Fetches list of notes by patientId or a single note by id.
// ======================================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");
    const noteId = searchParams.get("id");
    
    // --- Strict Validation ---
    if (!patientId && !noteId) {
      return NextResponse.json(
        { success: false, data: null, error: "Must provide either 'patientId' or 'id' query parameter." },
        { status: 400 }
      );
    }

    // --- Fetch Single Note by ID ---
    if (noteId) {
      const ref = doc(db, "noteshistory", noteId);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        return NextResponse.json(
          { success: false, data: null, error: `Note with ID ${noteId} not found.` },
          { status: 404 }
        );
      }

      // Format data and return
      const data = { id: snap.id, ...snap.data() };
      return NextResponse.json({ success: true, data, error: null });
    }

    // --- Fetch All Notes for a Patient ---
    if (patientId) {
      const q = query(
        collection(db, "noteshistory"),
        where("patientId", "==", patientId)
        // Order by creation time (newest first)
      );

      const querySnapshot = await getDocs(q);
      const notes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // --- Unified JSON Response Schema ---
      return NextResponse.json({ 
        success: true, 
        data: notes, 
        error: null 
      });
    }

    return NextResponse.json(
      { success: false, data: null, error: "Invalid request parameters." },
      { status: 400 }
    );

  } catch (error) {
    // --- Correct Async Error Handling ---
    console.error("NOTES GET ERROR:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to retrieve notes.";

    return NextResponse.json(
      { success: false, data: null, error: `Server Error: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// ======================================================
// POST — /api/notes
// Creates a new clinical note.
// ======================================================
export async function POST(req: NextRequest) {
  try {
    const body: Partial<ClinicalNote> = await req.json();
    const { patientId, authorId, noteType, content } = body;

    // --- Strict Validation (minimal required fields) ---
    if (!patientId || !authorId || !noteType || !content) {
      return NextResponse.json(
        { success: false, data: null, error: "Missing required fields: patientId, authorId, noteType, and content are mandatory." },
        { status: 400 }
      );
    }
    
    // Construct the new document data
    const now = Timestamp.now();
    const newNote: Omit<ClinicalNote, 'updatedAt'> & { updatedAt: Timestamp } = {
      patientId,
      authorId,
      noteType,
      content,
      consultationId: body.consultationId || undefined,
      createdAt: now, // Standardize timestamp usage
      updatedAt: now, // Initial update time is also creation time
    };
    
    // Add the document to the 'noteshistory' collection
    const docRef = await addDoc(collection(db, "noteshistory"), newNote);

    // --- Unified JSON Response Schema ---
    return NextResponse.json({
      success: true,
      data: { 
        message: "Clinical note created successfully.", 
        id: docRef.id 
      },
      error: null,
    });

  } catch (error) {
    // --- Correct Async Error Handling ---
    console.error("NOTES POST ERROR:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create clinical note.";

    return NextResponse.json(
      { success: false, data: null, error: `Server Error: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// ======================================================
// PATCH — /api/notes
// Updates an existing clinical note.
// ======================================================
export async function PATCH(req: NextRequest) {
    try {
        const body: Partial<ClinicalNote & { id: string }> = await req.json();
        const { id, ...rest } = body;

        // --- Strict Validation ---
        if (!id) {
            return NextResponse.json(
                { success: false, data: null, error: "Missing required field: id for PATCH operation." },
                { status: 400 }
            );
        }

        const docRef = doc(db, "noteshistory", id);

        // Prepare update data, ensuring updatedAt is always updated
        const updateData = {
            ...rest,
            updatedAt: Timestamp.now(), // Standardize timestamp usage
        };

        await updateDoc(docRef, updateData);

        // --- Unified JSON Response Schema ---
        return NextResponse.json({ 
            success: true, 
            data: { message: `Clinical note ${id} updated.` }, 
            error: null 
        });

    } catch (error) {
        // --- Correct Async Error Handling ---
        console.error("NOTES PATCH ERROR:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to update clinical note.";

        return NextResponse.json(
            { success: false, data: null, error: `Server Error: ${errorMessage}` },
            { status: 500 }
        );
    }
}