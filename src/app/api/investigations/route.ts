// src/app/api/investigations/route.ts

import { NextRequest, NextResponse } from "next/server";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

// Ensure Next.js configuration is set (kept from your original)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// --------------------------------------------------
// Types
// --------------------------------------------------
export interface InvestigationPayload {
  patientId: string;
  title?: string;
  type?: string; // e.g. "Bloods", "Echo", "CT", etc.
  status?: string; // e.g. "pending", "completed"
  resultText?: string;
  fileUrl?: string; // Link to file storage
  requestedBy?: string; // Doctor ID or Name
  performedAt?: string; // Date string or facility name
  notes?: string;
}

// Firestore record type (including required timestamps)
interface InvestigationRecord extends InvestigationPayload {
  id: string; // Used for response data
  createdAt: Timestamp;
  updatedAt: Timestamp | null;
}

// Helper to normalise data coming from Firestore
function mapDoc(d: any): InvestigationRecord {
  const data = d.data() || {};
  return {
    id: d.id,
    patientId: data.patientId || "",
    title: data.title || "",
    type: data.type || "",
    status: data.status || "pending",
    resultText: data.resultText || "",
    fileUrl: data.fileUrl || "",
    requestedBy: data.requestedBy || "",
    performedAt: data.performedAt || "",
    notes: data.notes || "",
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt : null, // Ensure proper Timestamp handling
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : null,
  };
}

// --------------------------------------------------
// POST – create investigation
// /api/investigations
// --------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body: InvestigationPayload = await req.json();
    
    // --- Strict Validation ---
    if (!body.patientId) {
      return NextResponse.json(
        { success: false, data: null, error: "Missing required field: patientId." },
        { status: 400 }
      );
    }

    // Construct the payload for Firestore
    const firestorePayload = {
      patientId: body.patientId,
      title: body.title ?? "Investigation",
      type: body.type ?? "",
      status: body.status ?? "pending",
      resultText: body.resultText ?? "",
      fileUrl: body.fileUrl ?? "",
      requestedBy: body.requestedBy ?? "",
      performedAt: body.performedAt ?? "",
      notes: body.notes ?? "",
      createdAt: Timestamp.now(), // Standardize timestamp usage
      updatedAt: null,
    };

    const ref = await addDoc(collection(db, "investigations"), firestorePayload);

    // --- Unified JSON Response Schema ---
    return NextResponse.json({
      success: true,
      data: {
        message: "Investigation created successfully.",
        id: ref.id,
      },
      error: null,
    });
  } catch (err: any) {
    console.error("INVESTIGATIONS POST ERROR:", err);
    return NextResponse.json(
      { success: false, data: null, error: `Server Error: ${err?.message || "Failed to create investigation"}` },
      { status: 500 }
    );
  }
}

// --------------------------------------------------
// GET – list investigations
// ?patientId=... (list) OR ?id=... (single)
// --------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const patientId = searchParams.get("patientId");

    // --- Fetch Single by ID ---
    if (id) {
      const docRef = doc(db, "investigations", id);
      const snap = await getDoc(docRef);
      
      if (!snap.exists()) {
        return NextResponse.json(
          { success: false, data: null, error: `Investigation with ID ${id} not found.` },
          { status: 404 }
        );
      }

      // --- Unified JSON Response Schema ---
      return NextResponse.json({
        success: true,
        data: mapDoc(snap), // Single item returned as 'data'
        error: null,
      });
    }

    // --- Fetch List by Patient ID ---
    if (!patientId) {
      // --- Strict Validation ---
      return NextResponse.json(
        { success: false, data: null, error: "Must provide either 'id' or 'patientId' query parameter." },
        { status: 400 }
      );
    }

    const q = query(
      collection(db, "investigations"),
      where("patientId", "==", patientId)
    );

    const snap = await getDocs(q);
    const investigations = snap.docs.map(mapDoc);

    // --- Unified JSON Response Schema ---
    return NextResponse.json({
      success: true,
      data: investigations, // List of items returned as 'data'
      error: null,
    });

  } catch (err: any) {
    console.error("INVESTIGATIONS GET ERROR:", err);
    return NextResponse.json(
      { success: false, data: null, error: `Server Error: ${err?.message || "Failed to fetch investigations"}` },
      { status: 500 }
    );
  }
}

// --------------------------------------------------
// PATCH – update investigation
// body: { id, ...fieldsToUpdate }
// --------------------------------------------------
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body || {};

    // --- Strict Validation ---
    if (!id) {
      return NextResponse.json(
        { success: false, data: null, error: "Missing required field: id for PATCH operation." },
        { status: 400 }
      );
    }

    const docRef = doc(db, "investigations", id);

    // Prepare update data, ensuring updatedAt is always set
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now(), // Standardize timestamp usage
    };

    await updateDoc(docRef, updateData);

    // --- Unified JSON Response Schema ---
    return NextResponse.json({ 
      success: true, 
      data: { message: `Investigation ${id} updated.` },
      error: null 
    });
  } catch (err: any) {
    console.error("INVESTIGATIONS PATCH ERROR:", err);
    return NextResponse.json(
      { success: false, data: null, error: `Server Error: ${err?.message || "Failed to update investigation"}` },
      { status: 500 }
    );
  }
}

// --------------------------------------------------
// DELETE – delete investigation
// body: { id }
// --------------------------------------------------
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body || {};

    // --- Strict Validation ---
    if (!id) {
      return NextResponse.json(
        { success: false, data: null, error: "Missing required field: id for DELETE operation." },
        { status: 400 }
      );
    }

    await deleteDoc(doc(db, "investigations", id));

    // --- Unified JSON Response Schema ---
    return NextResponse.json({ 
      success: true, 
      data: { message: `Investigation ${id} deleted.` }, 
      error: null 
    });
  } catch (err: any) {
    console.error("INVESTIGATIONS DELETE ERROR:", err);
    return NextResponse.json(
      { success: false, data: null, error: `Server Error: ${err?.message || "Failed to delete investigation"}` },
      { status: 500 }
    );
  }
}