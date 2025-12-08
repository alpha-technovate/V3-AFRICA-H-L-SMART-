// src/app/api/referrals/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  addDoc,
  Timestamp,
  doc,
  setDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";

/**
 * GET /api/referrals?doctorId=DOC123
 * Fetch referrals for a doctor (assumes doctorId = specialistId).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId");

    if (!doctorId) {
      return NextResponse.json(
        { success: false, error: "Missing doctorId in query" },
        { status: 400 }
      );
    }

    // 🔴 IMPORTANT: No orderBy here → no composite index required
    const q = query(
      collection(db, "referrals"),
      where("specialistId", "==", doctorId)
    );

    const snapshot = await getDocs(q);

    let referrals = snapshot.docs.map((d) => {
      const data: any = d.data();
      const sentAtIso =
        data.sentAt?.toDate?.().toISOString?.() ?? null;
      const updatedAtIso =
        data.updatedAt?.toDate?.().toISOString?.() ?? null;
      const lastMessageAtIso =
        data.lastMessageAt?.toDate?.().toISOString?.() ?? null;

      return {
        id: d.id,
        ...data,
        sentAt: sentAtIso,
        updatedAt: updatedAtIso,
        lastMessageAt: lastMessageAtIso,
      };
    });

    // Sort in memory by sentAt desc (newest first)
    referrals = referrals.sort((a: any, b: any) => {
      if (!a.sentAt && !b.sentAt) return 0;
      if (!a.sentAt) return 1;
      if (!b.sentAt) return -1;
      const aTime = new Date(a.sentAt).getTime();
      const bTime = new Date(b.sentAt).getTime();
      return bTime - aTime;
    });

    return NextResponse.json({
      success: true,
      referrals,
    });
  } catch (e: any) {
    console.error("GET /api/referrals error:", e);
    return NextResponse.json(
      {
        success: false,
        error:
          e.message || "Server error while fetching referrals.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/referrals
 * (your original code, unchanged)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Core mandatory fields (must exist and not be empty/null)
    const required = [
      "patientId",
      "referringDoctorId",
      "specialistId",
      "reason",
    ];

    // 2. Clinical Summary must be present, but can be an empty string
    const requiredButCanBeEmpty = ["clinicalSummary"];

    // Check for missing core fields
    const missingCore = required.filter((f) => !body[f]);
    if (missingCore.length) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing core fields: ${missingCore.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Check if the fields that can be empty are actually present in the body
    const missingOptionalButRequired = requiredButCanBeEmpty.filter(
      (f) => !(f in body)
    );
    if (missingOptionalButRequired.length) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required field: ${missingOptionalButRequired.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const now = Timestamp.now();

    // 3. Construct the full referral document for the 'referrals' collection
    const referralData = {
      patientId: body.patientId,
      referringDoctorId: body.referringDoctorId,
      specialistId: body.specialistId,
      reason: body.reason,
      clinicalSummary: body.clinicalSummary || "", // Ensure it's a string, even if empty
      urgency: body.urgency || "routine",
      attachments: body.attachments || [],
      sentAt: now, // Renamed from createdAt for clarity
      updatedAt: now,
      status: "pending",
      isReadBySpecialist: false,
      lastMessageAt: now,
    };

    // 4. Save the main referral document
    const ref = await addDoc(collection(db, "referrals"), referralData);

    // 5. Indexing: Create a lightweight reference under the patient sub-collection
    const patientIndexData = {
      referralId: ref.id,
      specialistId: referralData.specialistId,
      reason: referralData.reason,
      status: referralData.status,
      sentAt: referralData.sentAt,
    };

    await setDoc(
      doc(db, `patients/${body.patientId}/referrals/${ref.id}`),
      patientIndexData
    );

    return NextResponse.json({
      success: true,
      data: {
        id: ref.id,
        sentAt: now.toDate().toISOString(), // Return ISO string for client use
      },
    });
  } catch (e: any) {
    console.error("Referral creation server error:", e);
    return NextResponse.json(
      {
        success: false,
        error:
          e.message ||
          "Referral creation failed due to server issue.",
      },
      { status: 500 }
    );
  }
}
