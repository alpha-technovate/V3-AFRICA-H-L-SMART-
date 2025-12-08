// src/app/api/levelofcare/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseConfig";
import { 
  collection, 
  doc, 
  addDoc,
  updateDoc, 
  getDocs, 
  query, 
  where, 
  Timestamp 
} from "firebase/firestore";

// Define the core structure for the Level of Care document
interface LevelOfCare {
  id?: string; // Optional for POST, required for PATCH result
  patientId: string;
  doctorId: string; 
  locType: 'Acute' | 'Chronic' | 'Palliative' | 'Rehabilitation' | 'Maintenance' | string;
  locDescription: string; 
  startDate: Timestamp;
  endDate: Timestamp | null;
  isActive: boolean;
  updatedAt: Timestamp; // Standardize this timestamp
}

// ======================================================
// GET — /api/levelofcare?patientId=XYZ
// Fetches all Level of Care records for a patient.
// ======================================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");
    
    // --- Strict Validation ---
    if (!patientId) {
      return NextResponse.json(
        { success: false, data: null, error: "Missing required query parameter: patientId." },
        { status: 400 }
      );
    }

    // --- Clean Firestore Calls ---
    const q = query(
      collection(db, "levelOfCare"),
      where("patientId", "==", patientId)
      // Optional: orderBy('startDate', 'desc') to show newest first
    );

    const querySnapshot = await getDocs(q);
    const locRecords = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<LevelOfCare, 'id'> // Type assertion for clean data retrieval
    }));

    // --- Unified JSON Response Schema ---
    return NextResponse.json({ 
      success: true, 
      data: locRecords, 
      error: null 
    });

  } catch (error) {
    // --- Correct Async Error Handling ---
    console.error("LEVEL OF CARE GET ERROR:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to retrieve Level of Care records.";

    return NextResponse.json(
      { success: false, data: null, error: `Server Error: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// ======================================================
// POST — /api/levelofcare
// Creates a new Level of Care record.
// ======================================================
export async function POST(req: NextRequest) {
  try {
    const body: Partial<LevelOfCare> = await req.json();
    const { patientId, doctorId, locType, locDescription } = body;

    // --- Strict Validation (mandatory fields) ---
    if (!patientId || !doctorId || !locType || !locDescription) {
      return NextResponse.json(
        { success: false, data: null, error: "Missing mandatory fields: patientId, doctorId, locType, and locDescription are required." },
        { status: 400 }
      );
    }
    
    // Construct the new document data with standardized fields
    const newLOC: Omit<LevelOfCare, 'id' | 'updatedAt'> & { updatedAt: Timestamp } = {
      patientId,
      doctorId,
      locType,
      locDescription,
      startDate: body.startDate || Timestamp.now(), 
      endDate: body.endDate || null,
      isActive: body.isActive ?? true, 
      updatedAt: Timestamp.now(), // Standardize timestamp usage
    };
    
    // Add the document to the 'levelOfCare' collection
    const docRef = await addDoc(collection(db, "levelOfCare"), newLOC);

    // --- Unified JSON Response Schema ---
    return NextResponse.json({
      success: true,
      data: { 
        message: "Level of Care record created successfully.", 
        id: docRef.id 
      },
      error: null,
    });

  } catch (error) {
    // --- Correct Async Error Handling ---
    console.error("LEVEL OF CARE POST ERROR:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create Level of Care record.";

    return NextResponse.json(
      { success: false, data: null, error: `Server Error: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// ======================================================
// PATCH — /api/levelofcare
// Updates an existing Level of Care record.
// ======================================================
export async function PATCH(req: NextRequest) {
    try {
        const body: Partial<LevelOfCare> = await req.json();
        const { id, ...rest } = body;

        // --- Strict Validation ---
        if (!id) {
            return NextResponse.json(
                { success: false, data: null, error: "Missing required field: id for PATCH operation." },
                { status: 400 }
            );
        }

        // Prepare update data, ensuring updatedAt is always updated
        const updateData = {
            ...rest,
            updatedAt: Timestamp.now(), // Standardize timestamp usage
        };

        const docRef = doc(db, "levelOfCare", id as string);

        // Update the document
        await updateDoc(docRef, updateData);

        // --- Unified JSON Response Schema ---
        return NextResponse.json({ 
            success: true, 
            data: { message: `Level of Care record ${id} updated.` }, 
            error: null 
        });

    } catch (error) {
        // --- Correct Async Error Handling ---
        console.error("LEVEL OF CARE PATCH ERROR:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to update Level of Care record.";

        return NextResponse.json(
            { success: false, data: null, error: `Server Error: ${errorMessage}` },
            { status: 500 }
        );
    }
}