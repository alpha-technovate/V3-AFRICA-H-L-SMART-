import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/admin"; // FIXED

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { patientId, payload } = await req.json();

    if (!patientId) {
      return NextResponse.json({
        success: false,
        error: "Missing patientId.",
      });
    }

    if (!payload || !payload.name) {
      return NextResponse.json({
        success: false,
        error: "Medication payload missing required fields.",
      });
    }

    const medication = {
      name: payload.name,
      dose: payload.dose || null,
      route: payload.route || null,
      frequency: payload.frequency || null,
      duration: payload.duration || null,
      notes: payload.notes || null,
      createdAt: Date.now(),
    };

    const ref = await db
      .collection("patients")
      .doc(patientId)
      .collection("medications")
      .add(medication);

    return NextResponse.json({
      success: true,
      id: ref.id,
      medication,
    });

  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message,
    });
  }
}
