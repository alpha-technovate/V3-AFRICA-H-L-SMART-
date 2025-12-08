import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// This named export fixes the 405 Method Not Allowed error
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json(
        { success: false, error: "Missing patientId" },
        { status: 400 }
      );
    }

    // Use modular v9 syntax
    const careTeamRef = collection(db, "careTeam");
    const q = query(
      careTeamRef,
      where("patientId", "==", patientId)
    );

    const snap = await getDocs(q);

    const careTeam = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    return NextResponse.json({
      success: true,
      data: careTeam,
      error: null,
    });
  } catch (err: any) {
    console.error("CARE TEAM GET ERROR:", err);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: err?.message || "Failed to fetch care team",
      },
      { status: 500 }
    );
  }
}