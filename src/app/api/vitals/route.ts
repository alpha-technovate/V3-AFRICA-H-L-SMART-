// src/app/api/vitals/route.ts

import { NextResponse, NextRequest } from "next/server";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
  doc,
  updateDoc, // Added for PATCH
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Shape of a vitals payload
interface VitalsPayload {
    patientId: string;
    // Fields from your specific schema:
    systolic?: number;
    diastolic?: number;
    heartRate?: number;
    respiratoryRate?: number;
    temperature?: number;
    spo2?: number;
    weight?: number;
    height?: number;
    bmi?: number;
    notes?: string;
    // Required system fields:
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

const COLLECTION_NAME = "vitals";

// ======================================================
// POST — ADD NEW VITALS READING
// ======================================================
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as VitalsPayload;

    const { patientId } = body;

    // --- Strict Validation ---
    if (!patientId) {
      return NextResponse.json(
        { success: false, data: null, error: "Missing required field: patientId." },
        { status: 400 }
      );
    }

    const now = Timestamp.now();
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...body,
      createdAt: now, // Standardized timestamp
      updatedAt: now,
    });

    // --- Unified JSON Response Schema ---
    return NextResponse.json({ 
        success: true, 
        data: { message: "Vitals recorded successfully.", id: docRef.id },
        error: null,
    });
  } catch (err: any) {
    console.error("VITALS POST ERROR:", err);
    return NextResponse.json(
      { success: false, data: null, error: `Server Error: ${err?.message || "Failed to save vitals"}` },
      { status: 500 }
    );
  }
}

// ======================================================
// GET — FETCH VITALS FOR A PATIENT
// GET /api/vitals?patientId=XYZ&latest=true|false
// ======================================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const patientId = searchParams.get("patientId");
    const latest = searchParams.get("latest") === "true";

    // --- Strict Validation ---
    if (!patientId) {
      return NextResponse.json(
        { success: false, data: null, error: "Missing required query parameter: patientId." },
        { status: 400 }
      );
    }

    let q = query(
      collection(db, COLLECTION_NAME),
      where("patientId", "==", patientId),
      orderBy("createdAt", "desc")
    );

    if (latest) {
      // NOTE: Re-querying is necessary as limit() must be the last query component
      q = query(q, limit(1));
    }

    const snap = await getDocs(q);

    const vitalRecords = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    // --- Unified JSON Response Schema ---
    // If latest=true, return the single object/null under the 'data' field
    if (latest) {
      return NextResponse.json({
        success: true,
        data: vitalRecords[0] || null,
        error: null,
      });
    }

    // Return the full list under the 'data' field
    return NextResponse.json({ success: true, data: vitalRecords, error: null });
  } catch (err: any) {
    console.error("VITALS GET ERROR:", err);
    return NextResponse.json(
      { success: false, data: null, error: `Server Error: ${err?.message || "Failed to fetch vitals"}` },
      { status: 500 }
    );
  }
}

// ======================================================
// PATCH — UPDATE A VITALS RECORD
// Body: { id, systolic?, heartRate?, ... }
// ======================================================
export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, ...updates } = body;

        // --- Strict Validation ---
        if (!id) {
            return NextResponse.json(
                { success: false, data: null, error: "Missing required field: id for PATCH operation." },
                { status: 400 }
            );
        }

        const ref = doc(db, COLLECTION_NAME, id);

        const payload: any = {
            ...updates,
            updatedAt: Timestamp.now(), // Standardized timestamp
        };
        
        // Ensure creation date is not accidentally overwritten
        delete payload.createdAt; 

        await updateDoc(ref, payload);

        // --- Unified JSON Response Schema ---
        return NextResponse.json({ 
            success: true, 
            data: { message: `Vital record ${id} updated.` }, 
            error: null 
        });
    } catch (err: any) {
        console.error("VITALS PATCH ERROR:", err);
        return NextResponse.json(
            { success: false, data: null, error: `Server Error: ${err?.message || "Failed to update vital record."}` },
            { status: 500 }
        );
    }
}