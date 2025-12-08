// src/app/api/scans/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  Timestamp
} from "firebase/firestore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ========================================================
// GET — list scans for a patient
// /api/scans?patientId=123
// ========================================================
export async function GET(req: Request) {
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
      collection(db, "scans"),
      where("patientId", "==", patientId)
    );

    const snap = await getDocs(q);

    const scans = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    return NextResponse.json({
      success: true,
      data: scans,
      error: null,
    });
  } catch (err: any) {
    console.error("SCANS GET ERROR:", err);
    return NextResponse.json(
      { success: false, data: null, error: err.message },
      { status: 500 }
    );
  }
}

// ========================================================
// POST — upload scan metadata
// ========================================================
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      patientId,
      scanType,
      fileBase64,
      mimeType = "image/jpeg",
      notes = "",
    } = body;

    if (!patientId || !fileBase64) {
      return NextResponse.json(
        { success: false, data: null, error: "Missing patientId or scan file" },
        { status: 400 }
      );
    }

    const docRef = await addDoc(collection(db, "scans"), {
      patientId,
      scanType: scanType || "Medical Scan",
      fileBase64,
      mimeType,
      notes,
      aiInterpretationStatus: "None",
      createdAt: Timestamp.now(),
    });

    return NextResponse.json({
      success: true,
      data: { id: docRef.id },
      error: null,
    });
  } catch (err: any) {
    console.error("SCANS POST ERROR:", err);
    return NextResponse.json(
      { success: false, data: null, error: err.message },
      { status: 500 }
    );
  }
}

// ========================================================
// DELETE — remove a scan from Firestore
// ========================================================
export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, data: null, error: "Missing scan ID" },
        { status: 400 }
      );
    }

    await deleteDoc(doc(db, "scans", id));

    return NextResponse.json({
      success: true,
      data: { message: "Scan deleted" },
      error: null,
    });
  } catch (err: any) {
    console.error("SCANS DELETE ERROR:", err);
    return NextResponse.json(
      { success: false, data: null, error: err.message },
      { status: 500 }
    );
  }
}
