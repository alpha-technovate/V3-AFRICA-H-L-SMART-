// src/app/api/activity/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs
} from "firebase/firestore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json({
        success: false,
        data: null,
        error: "Missing patientId"
      }, { status: 400 });
    }

    const q = query(
      collection(db, "recentActivity"),
      where("patientId", "==", patientId),
      orderBy("timestamp", "desc")
    );

    const snap = await getDocs(q);

    const activity = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    return NextResponse.json({
      success: true,
      data: activity,
      error: null
    });

  } catch (err: any) {

    console.error("ACTIVITY GET ERROR:", err);

    // SAFETY RETURN → Always return an array
    return NextResponse.json({
      success: false,
      data: [],
      error: err.message || "Failed to load activity"
    }, { status: 500 });
  }
}
