// src/app/api/consult/save/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseConfig";
import {
  addDoc,
  collection,
  Timestamp,
} from "firebase/firestore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/consult/save
// Body: { patientId: string, data: any }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const patientId = body?.patientId as string | undefined;
    const data = body?.data;

    if (!patientId) {
      return NextResponse.json(
        { success: false, error: "Missing patientId" },
        { status: 400 }
      );
    }

    if (!data || typeof data !== "object") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid structured data" },
        { status: 400 }
      );
    }

    const docRef = await addDoc(collection(db, "consultations"), {
      patientId,
      structured: data,
      createdAt: Timestamp.now(),
    });

    return NextResponse.json({
      success: true,
      id: docRef.id,
    });
  } catch (err: any) {
    console.error("CONSULT SAVE ERROR:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to save consultation" },
      { status: 500 }
    );
  }
}
