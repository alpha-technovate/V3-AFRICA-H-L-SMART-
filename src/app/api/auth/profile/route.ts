import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseConfig";
import { collection, addDoc, Timestamp, doc, setDoc } from "firebase/firestore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const required = [
      "patientId",
      "referringDoctorId",
      "specialistId",
      "reason",
      "clinicalSummary"
    ];

    const missing = required.filter((f) => !body[f]);
    if (missing.length) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing fields: ${missing.join(", ")}`
        },
        { status: 400 }
      );
    }

    const data = {
      patientId: body.patientId,
      referringDoctorId: body.referringDoctorId,
      specialistId: body.specialistId,
      reason: body.reason,
      clinicalSummary: body.clinicalSummary,
      urgency: body.urgency || "routine",
      attachments: body.attachments || [],
      createdAt: Timestamp.now(),
      status: "pending",
    };

    // main referral
    const ref = await addDoc(collection(db, "referrals"), data);

    // add reference under patient
    await setDoc(
      doc(db, `patients/${body.patientId}/referrals/${ref.id}`),
      data
    );

    return NextResponse.json({
      success: true,
      data: { id: ref.id }
    });
  } catch (e: any) {
    console.error("Referral error:", e);
    return NextResponse.json(
      { success: false, error: e.message || "Referral creation failed." },
      { status: 500 }
    );
  }
}
