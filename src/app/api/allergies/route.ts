// src/app/api/allergies/route.ts

import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { Allergy } from "@/lib/types"; // Import the Allergy type

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COLLECTION_NAME = "allergies";

// Helper to map Firestore doc to the Allergy type for consistent output
const mapDocToAllergy = (doc: QueryDocumentSnapshot<DocumentData>): Allergy => {
    const data = doc.data() || {};
    return {
        id: doc.id,
        patientId: data.patientId,
        allergen: data.allergen || data.condition || "", // Use allergen primarily, fallback to condition
        reaction: data.reaction || "",
        severity: data.severity || 'Mild',
        type: data.type || 'Other',
        status: data.status || 'Active',
        onsetDate: data.onsetDate || null,
        notes: data.notes || null,
        createdAt: data.createdAt || null,
        updatedAt: data.updatedAt || null,
    } as Allergy;
};


// =====================
// GET — list allergies
// Route: GET /api/allergies?patientId={id}
// =====================
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
      where("patientId", "==", patientId)
    );

    const snap = await getDocs(q);

    const allergies: Allergy[] = snap.docs.map(mapDocToAllergy);

    // Unified response format: { success, data, error }
    return NextResponse.json({ success: true, data: allergies, error: null });
  } catch (err: any) {
    console.error("ALLERGIES GET ERROR:", err);
    return NextResponse.json(
      { success: false, data: null, error: err.message },
      { status: 500 }
    );
  }
}

// =====================
// POST — create allergy
// Route: POST /api/allergies
// =====================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Use the required fields from the Allergy type
    const { patientId, allergen, reaction, severity, type, status, onsetDate, notes } = body;

    // Validate minimal required fields
    if (!patientId || !allergen || !reaction) {
      return NextResponse.json(
        { success: false, data: null, error: "patientId, allergen, and reaction are required" },
        { status: 400 }
      );
    }

    const now = Timestamp.now();

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      patientId,
      allergen,
      reaction,
      severity: severity || 'Moderate', // Default if not provided
      type: type || 'Other',
      status: status || 'Active',
      onsetDate: onsetDate || now,
      notes: notes || null,
      createdAt: now,
      updatedAt: now,
    });

    // Unified response format: { success, data: { id }, error }
    return NextResponse.json({ success: true, data: { id: docRef.id }, error: null }, { status: 201 });
  } catch (err: any) {
    console.error("ALLERGIES POST ERROR:", err);
    return NextResponse.json(
      { success: false, data: null, error: err.message },
      { status: 500 }
    );
  }
}

// =====================
// PATCH — update allergy
// Route: PATCH /api/allergies
// =====================
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, data: null, error: "Missing allergy id for update" },
        { status: 400 }
      );
    }

    // We only allow updating the fields defined in the Allergy type
    const updatePayload: Partial<Allergy> = {
        allergen: data.allergen,
        reaction: data.reaction,
        severity: data.severity,
        type: data.type,
        status: data.status,
        onsetDate: data.onsetDate,
        notes: data.notes,
        updatedAt: Timestamp.now(),
    };

    await updateDoc(doc(db, COLLECTION_NAME, id), updatePayload);

    // Unified response format: { success, data, error }
    return NextResponse.json({ success: true, data: { id }, error: null });
  } catch (err: any) {
    console.error("ALLERGIES PATCH ERROR:", err);
    return NextResponse.json(
      { success: false, data: null, error: err.message },
      { status: 500 }
    );
  }
}

// =====================
// DELETE — remove allergy
// Route: DELETE /api/allergies
// =====================
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { success: false, data: null, error: "Missing allergy id for deletion" },
        { status: 400 }
      );
    }

    await deleteDoc(doc(db, COLLECTION_NAME, id));

    // Unified response format: { success, data, error }
    return NextResponse.json({ success: true, data: { id }, error: null });
  } catch (err: any) {
    console.error("ALLERGIES DELETE ERROR:", err);
    return NextResponse.json(
      { success: false, data: null, error: err.message },
      { status: 500 }
    );
  }
}