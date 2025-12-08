// src/app/api/patients/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  orderBy,
} from "firebase/firestore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ======================================
// Patient DB Schema
// ======================================
interface Patient {
  id?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  idNumber: string;
  contactNumber: string;
  address: string;
  medicalAid: string;
  notes: string;

  // AI-added fields from voice consult
  chronicConditions?: any[];
  allergies?: any[];

  isArchived: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ======================================
// Incoming Payload (Flexible)
// ======================================
interface PatientInputPayload
  extends Partial<
    Omit<Patient, "firstName" | "lastName" | "dateOfBirth" | "contactNumber">
  > {
  name?: string; // "John Smith"
  firstName?: string;
  lastName?: string;

  dob?: string; // OCR legacy
  dateOfBirth?: string;

  phone?: string; // app legacy
  contactNumber?: string;

  consultNotes?: string;
  chronicConditions?: any[];
  allergies?: any[];
}

// ======================================================
// GET — /api/patients
// ======================================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("id");

    // --- Fetch a single patient ---
    if (patientId) {
      const ref = doc(db, "patients", patientId);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            error: `Patient with ID ${patientId} not found.`,
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: { id: snap.id, ...snap.data() },
        error: null,
      });
    }

    // --- List all ---
    const q = query(collection(db, "patients"), orderBy("lastName", "asc"));
    const items = await getDocs(q);

    const patients = items.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      data: patients,
      error: null,
    });
  } catch (err: any) {
    console.error("GET PATIENTS ERROR:", err);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: `Server Error: ${err?.message || "Failed to load patients"}`,
      },
      { status: 500 }
    );
  }
}

// ======================================================
// POST — /api/patients
// Creates a new patient after ID scan + consult
// ======================================================
export async function POST(req: NextRequest) {
  try {
    const body: PatientInputPayload = await req.json();

    const {
      name,
      firstName,
      lastName,
      idNumber,
      dob,
      dateOfBirth,
      gender,
      phone,
      contactNumber,
      address,
      medicalAid,
      notes,
      chronicConditions,
      allergies,
    } = body;

    // --- Mandatory fields (OCR flow guaranteed) ---
    if (!(name || (firstName && lastName)) || !idNumber || !(dob || dateOfBirth)) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error:
            "Missing required fields: name, ID number, and date of birth are mandatory.",
        },
        { status: 400 }
      );
    }

    // Name logic
    let finalFirst = firstName;
    let finalLast = lastName;

    if (name) {
      const parts = name.trim().split(/\s+/);
      finalFirst = parts[0] || "";
      finalLast = parts.slice(1).join(" ") || "";
    }

    const now = Timestamp.now();

    const newPatient: Omit<Patient, "id"> = {
      firstName: finalFirst!,
      lastName: finalLast!,
      idNumber: idNumber!,
      dateOfBirth: dateOfBirth || dob!,
      gender: gender || "Unknown",
      contactNumber: contactNumber || phone || "",
      address: address || "",
      medicalAid: medicalAid || "",
      notes: notes || "",

      chronicConditions: chronicConditions || [],
      allergies: allergies || [],

      isArchived: false,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, "patients"), newPatient);

    return NextResponse.json({
      success: true,
      data: { message: "Patient created.", id: docRef.id },
      error: null,
    });
  } catch (err: any) {
    console.error("CREATE PATIENT ERROR:", err);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: `Server Error: ${err?.message || "Failed to create patient"}`,
      },
      { status: 500 }
    );
  }
}

// ======================================================
// PATCH — /api/patients
// ======================================================
export async function PATCH(req: NextRequest) {
  try {
    const body: PatientInputPayload & { id: string } = await req.json();

    const { id, name, dob, dateOfBirth, phone, contactNumber, ...rest } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, data: null, error: "Missing patient id." },
        { status: 400 }
      );
    }

    const docRef = doc(db, "patients", id);

    const updates: any = { ...rest };

    if (name) {
      const parts = name.trim().split(/\s+/);
      updates.firstName = parts[0] || "";
      updates.lastName = parts.slice(1).join(" ") || "";
    }

    if (dob) updates.dateOfBirth = dob;
    if (dateOfBirth) updates.dateOfBirth = dateOfBirth;
    if (phone) updates.contactNumber = phone;
    if (contactNumber) updates.contactNumber = contactNumber;

    updates.updatedAt = Timestamp.now();

    await updateDoc(docRef, updates);

    return NextResponse.json({
      success: true,
      data: { message: `Patient ${id} updated.` },
      error: null,
    });
  } catch (err: any) {
    console.error("PATIENT UPDATE ERROR:", err);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: `Server Error: ${err?.message || "Failed to update patient"}`,
      },
      { status: 500 }
    );
  }
}
