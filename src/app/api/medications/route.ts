// src/app/api/medications/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Medication } from "@/lib/types"; // Import the updated Medication type
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COLLECTION_NAME = "medications";

// Helper function to map Firestore document to Medication type for consistent output
const mapDocToMedication = (doc: QueryDocumentSnapshot<DocumentData>): Medication => {
    const data = doc.data() || {};
    return {
        id: doc.id,
        patientId: data.patientId || "",
        name: data.name || "",
        dose: data.dose || "",
        route: data.route || "",
        frequency: data.frequency || "",
        // NOTE: The Medication type uses 'startDate' and not 'endDate'
        startDate: data.startDate || "", 
        // NOTE: The Medication type uses 'class' instead of being implicitly merged
        class: data.class || 'Unspecified', 
        status: data.status || "Active",
        notes: data.notes || "",
        createdAt: data.createdAt || null,
        updatedAt: data.updatedAt || null,
    } as Medication;
};


// ✅ GET /api/medications?patientId=XYZ
// Returns all meds for a given patient
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json(
        { success: false, data: null, error: "Missing patientId" },
        { status: 400 }
      );
    }

    const q = query(
      collection(db, COLLECTION_NAME),
      where("patientId", "==", patientId),
      orderBy("createdAt", "desc")
    );

    const snap = await getDocs(q);

    const medications: Medication[] = snap.docs.map(mapDocToMedication);

    // Unified response format: { success, data, error }
    return NextResponse.json({ success: true, data: medications, error: null });
  } catch (err: any) {
    console.error("MEDICATIONS GET ERROR:", err);
    return NextResponse.json(
      { success: false, data: null, error: err?.message || "Failed to load medications" },
      { status: 500 }
    );
  }
}

// ✅ POST /api/medications
// Body: { patientId, name, dose?, route?, frequency?, startDate?, status?, notes? }
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json());
    const { 
        patientId, 
        name, 
        dose, 
        route, 
        frequency, 
        startDate, 
        status, 
        notes,
        medClass 
    } = body; // Destructuring for clarity

    if (!patientId || !name) {
      return NextResponse.json(
        { success: false, data: null, error: "patientId and name are required" },
        { status: 400 }
      );
    }

    const now = Timestamp.now();

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      patientId,
      name,
      dose: dose || "",
      route: route || "Oral",
      frequency: frequency || "Once Daily",
      startDate: startDate || now.toDate().toISOString().split('T')[0], // Default date to today's string
      // Using 'class' field as per Medication type
      class: medClass || "Unspecified", 
      status: status || "Active",
      notes: notes || "",
      createdAt: now,
      updatedAt: now,
    });

    // Unified response format: { success, data, error }
    return NextResponse.json({ success: true, data: { id: docRef.id }, error: null }, { status: 201 });
  } catch (err: any) {
    console.error("MEDICATIONS POST ERROR:", err);
    return NextResponse.json(
      { success: false, data: null, error: err?.message || "Failed to create medication" },
      { status: 500 }
    );
  }
}

// ✅ PATCH /api/medications
// Body: { id, ...fieldsToUpdate }
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, data: null, error: "Missing medication id" },
        { status: 400 }
      );
    }

    const ref = doc(db, COLLECTION_NAME, id);

    await updateDoc(ref, {
      ...updates,
      updatedAt: Timestamp.now(),
    });

    // Unified response format: { success, data, error }
    return NextResponse.json({ success: true, data: { id }, error: null });
  } catch (err: any) {
    console.error("MEDICATIONS PATCH ERROR:", err);
    return NextResponse.json(
      { success: false, data: null, error: err?.message || "Failed to update medication" },
      { status: 500 }
    );
  }
}

// ✅ DELETE /api/medications
// Body: { id }
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, data: null, error: "Missing medication id" },
        { status: 400 }
      );
    }

    await deleteDoc(doc(db, COLLECTION_NAME, id));

    // Unified response format: { success, data, error }
    return NextResponse.json({ success: true, data: { id }, error: null });
  } catch (err: any) {
    console.error("MEDICATIONS DELETE ERROR:", err);
    return NextResponse.json(
      { success: false, data: null, error: err?.message || "Failed to delete medication" },
      { status: 500 }
    );
  }
}