// src/app/api/visits/route.ts

import { NextResponse, NextRequest } from "next/server";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  where,
  doc,
  updateDoc,
  Timestamp,
  getDoc, // Added for single fetch
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Define the core structure for a Visit document
interface Visit {
    patientId: string;
    doctorId: string;
    visitDate: Timestamp; // Standardized to Timestamp
    visitType: string; // From 'type' in your old code
    reasonForVisit: string; // From 'reason' in your old code
    notes: string; // From 'notes' in your old code
    status: 'Scheduled' | 'Complete' | 'Cancelled' | string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

const COLLECTION_NAME = "visits";

// ======================================================
// GET — /api/visits?patientId=XYZ OR ?id=ABC
// Fetches visits by patientId or a single visit by id.
// ======================================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");
    const visitId = searchParams.get("id");

    // --- Fetch Single Visit by ID ---
    if (visitId) {
        const ref = doc(db, COLLECTION_NAME, visitId);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
            return NextResponse.json(
                { success: false, data: null, error: `Visit with ID ${visitId} not found.` },
                { status: 404 }
            );
        }
        return NextResponse.json({ success: true, data: { id: snap.id, ...snap.data() }, error: null });
    }

    // --- Strict Validation for list query ---
    if (!patientId) {
      return NextResponse.json(
        { success: false, data: null, error: "Missing required query parameter: patientId." },
        { status: 400 }
      );
    }

    // --- Corrected Top-Level Collection Query ---
    const q = query(
      collection(db, COLLECTION_NAME),
      where("patientId", "==", patientId),
      orderBy("visitDate", "desc") // Use visitDate for chronological order
    );
    
    const snap = await getDocs(q);

    const visits = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    // --- Unified JSON Response Schema ---
    return NextResponse.json({ success: true, data: visits, error: null });
  } catch (err: any) {
    console.error("VISITS GET ERROR:", err);
    return NextResponse.json(
      { success: false, data: null, error: `Server Error: ${err.message || "Failed to fetch visits."}` },
      { status: 500 }
    );
  }
}

// ======================================================
// POST — /api/visits
// Creates a new visit record.
// ======================================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { patientId, date, reason, notes, doctorId, type } = body; // Using doctorId/doctorName from other routes

    // --- Strict Validation ---
    if (!patientId || !reason) {
      return NextResponse.json(
        { success: false, data: null, error: "Missing required fields: patientId and reason are mandatory." },
        { status: 400 }
      );
    }

    const now = Timestamp.now();
    
    // Convert date string to Timestamp, defaulting to now if not provided
    const visitTimestamp = date 
        ? new Timestamp(new Date(date).getTime() / 1000, 0) 
        : now;

    const newVisit: Partial<Visit> = {
        patientId,
        reasonForVisit: reason,
        notes: notes || "",
        doctorId: doctorId || "DOC_UNSPECIFIED",
        visitType: type || "Scheduled",
        visitDate: visitTimestamp,
        status: "Scheduled",
        createdAt: now, // Standardized timestamp
        updatedAt: now, // Standardized timestamp
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), newVisit);

    // --- Unified JSON Response Schema ---
    return NextResponse.json({ 
        success: true, 
        data: { message: "Visit created successfully.", id: docRef.id },
        error: null,
    });
  } catch (err: any) {
    console.error("VISITS POST ERROR:", err);
    return NextResponse.json(
      { success: false, data: null, error: `Server Error: ${err.message || "Failed to create visit."}` },
      { status: 500 }
    );
  }
}


// ======================================================
// PATCH — /api/visits
// Updates an existing visit record.
// Body: { id, reason?, status?, ... }
// ======================================================
export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, date, ...rest } = body;

        // --- Strict Validation ---
        if (!id) {
            return NextResponse.json(
                { success: false, data: null, error: "Missing required field: id for PATCH operation." },
                { status: 400 }
            );
        }

        const ref = doc(db, COLLECTION_NAME, id);
        
        const updateData: any = {
            ...rest,
            updatedAt: Timestamp.now(), // Standardized timestamp
        };

        // If 'date' is present, convert it to a Timestamp before updating
        if (date) {
            updateData.visitDate = new Timestamp(new Date(date).getTime() / 1000, 0);
        }

        await updateDoc(ref, updateData);

        // --- Unified JSON Response Schema ---
        return NextResponse.json({ 
            success: true, 
            data: { message: `Visit ${id} updated.` }, 
            error: null 
        });
    } catch (err: any) {
        console.error("VISITS PATCH ERROR:", err);
        return NextResponse.json(
            { success: false, data: null, error: `Server Error: ${err.message || "Failed to update visit."}` },
            { status: 500 }
        );
    }
}