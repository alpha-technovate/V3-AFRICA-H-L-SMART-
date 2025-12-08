// src/app/api/patient-ai-summary/route.ts

import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Helper to safely stringify for prompt
function safe(o: any) {
  try {
    return JSON.stringify(o, null, 2);
  } catch {
    return "[]";
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: "Missing required query parameter: patientId.",
        },
        { status: 400 }
      );
    }

    // -----------------------------
    // 1. Load core patient document
    // -----------------------------
    const patientRef = doc(db, "patients", patientId);
    const patientSnap = await getDoc(patientRef);

    if (!patientSnap.exists()) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: `Patient with id ${patientId} not found.`,
        },
        { status: 404 }
      );
    }

    const patient = { id: patientSnap.id, ...patientSnap.data() };

    // -----------------------------
    // 2. Load related collections
    // -----------------------------

    // Latest few vitals
    const vitalsQ = query(
      collection(db, "vitals"),
      where("patientId", "==", patientId),
      orderBy("createdAt", "desc"),
      limit(5)
    );
    const vitalsSnap = await getDocs(vitalsQ);
    const vitals = vitalsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Visits / encounters
    const visitsQ = query(
      collection(db, "visits"),
      where("patientId", "==", patientId),
      orderBy("visitDate", "desc")
    );
    const visitsSnap = await getDocs(visitsQ);
    const visits = visitsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Treatment notes
    const treatmentQ = query(
      collection(db, "treatmentNotes"),
      where("patientId", "==", patientId),
      orderBy("createdAt", "desc")
    );
    const treatmentSnap = await getDocs(treatmentQ);
    const treatmentNotes = treatmentSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    // Scans / imaging
    const scansQ = query(
      collection(db, "scans"),
      where("patientId", "==", patientId)
    );
    const scansSnap = await getDocs(scansQ);
    const scans = scansSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Referrals
    const referralsQ = query(
      collection(db, "referrals"),
      where("patientId", "==", patientId)
    );
    const referralsSnap = await getDocs(referralsQ);
    const referrals = referralsSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    // Allergies
    const allergiesQ = query(
      collection(db, "allergies"),
      where("patientId", "==", patientId)
    );
    const allergiesSnap = await getDocs(allergiesQ);
    const allergies = allergiesSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    // Chronic conditions
    const chronicQ = query(
      collection(db, "chronic"),
      where("patientId", "==", patientId)
    );
    const chronicSnap = await getDocs(chronicQ);
    const chronic = chronicSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // -----------------------------------
    // 3. Call Gemini with structured data
    // -----------------------------------
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: "GEMINI_API_KEY is not configured on the server.",
        },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // FIX: Change the model name from the failing gemini-1.5-pro to the stabilized, high-compatibility 2.5-flash
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

    const prompt = `
You are an expert clinical assistant working inside an EMR for cardiology / cardiothoracic / renal patients in South Africa.
You are assisting the treating doctor at the Africa Heart & Lung Institute / SmartBridge Care.

Use ONLY the information below. If something is missing, admit uncertainty instead of inventing.

Return a concise, clinically useful summary in clear markdown with these sections:

1. Patient Snapshot
2. Key Diagnoses / Problems
3. Recent Clinical Course (last visits + key vitals)
4. Relevant Investigations & Imaging (scans)
5. Referrals & Specialist Involvement
6. Chronic Conditions & Allergies
7. Red Flags / Risks (cardiac, renal, infection, social, follow-up)
8. Suggested Next Steps (bulleted, practical; NOT prescriptive orders)

Data (JSON):
- patient: ${safe(patient)}
- vitals: ${safe(vitals)}
- visits: ${safe(visits)}
- treatmentNotes: ${safe(treatmentNotes)}
- scans: ${safe(scans)}
- referrals: ${safe(referrals)}
- allergies: ${safe(allergies)}
- chronic: ${safe(chronic)}
`;

    const aiResult = await model.generateContent(prompt);
    const aiText = aiResult.response.text; // Fixed from .text() to .text

    return NextResponse.json({
      success: true,
      data: { summary: aiText },
      error: null,
    });
  } catch (err: any) {
    console.error("PATIENT AI SUMMARY ERROR:", err);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error:
          err?.message || "Server error while generating patient AI summary.",
      },
      { status: 500 }
    );
  }
}