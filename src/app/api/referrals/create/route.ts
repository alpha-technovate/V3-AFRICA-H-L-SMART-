import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      fromDoctorId,
      fromDoctorName,
      toDoctorId,
      toDoctorName,
      toSpecialty,
      patientId,
      patientName,
      patientIdNumber,
      urgency,
      reason,
      clinicalSummary,
      investigationsSummary,
      treatmentSoFar,
    } = body;

    if (!fromDoctorId || !toDoctorId || !patientId) {
      return NextResponse.json(
        { success: false, error: "Missing core fields (doctor or patient id)" },
        { status: 400 }
      );
    }

    const referralsRef = collection(db, "referrals");

    const docRef = await addDoc(referralsRef, {
      fromDoctorId,
      fromDoctorName,
      toDoctorId,
      toDoctorName,
      toSpecialty,
      patientId,
      patientName,
      patientIdNumber,
      urgency: urgency || "routine",
      reason: reason || "",
      clinicalSummary: clinicalSummary || "",
      investigationsSummary: investigationsSummary || "",
      treatmentSoFar: treatmentSoFar || "",
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json(
      { success: true, id: docRef.id },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("CREATE REFERRAL ERROR:", error);
    return NextResponse.json(
      { success: false, error: error.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
