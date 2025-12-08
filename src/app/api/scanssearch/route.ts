// src/app/api/scanssearch/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ========================================================
// GET — list scans for a patient (formatted for ScansSection)
// /api/scanssearch?patientId=123
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

    // Order newest first
    const q = query(
      collection(db, "scans"),
      where("patientId", "==", patientId),
      orderBy("createdAt", "desc")
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
    console.error("SCANS SEARCH ERROR:", err);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: err.message || "Failed to fetch scans",
      },
      { status: 500 }
    );
  }
}
