// src/app/api/chronic/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COLLECTION_NAME = "chronic";

// -------------------- GET /api/chronic?patientId=... --------------------
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

    const ref = collection(db, COLLECTION_NAME);
    const q = query(ref, where("patientId", "==", patientId));
    const snap = await getDocs(q);

    const chronic = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    return NextResponse.json({
      success: true,
      data: chronic,
      error: null,
    });
  } catch (err: any) {
    console.error("CHRONIC GET ERROR:", err);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: err?.message || "Failed to fetch chronic records",
      },
      { status: 500 }
    );
  }
}

// -------------------- POST /api/chronic  (create + update) --------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      patientId,
      conditionName,
      diagnosisDate,
      status,
      notes,
      icd10Code, // 👈 NEW
    } = body as {
      id?: string;
      patientId?: string;
      conditionName?: string;
      diagnosisDate?: string;
      status?: string;
      notes?: string;
      icd10Code?: string;
    };

    if (!patientId || !conditionName?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing patientId or conditionName",
        },
        { status: 400 }
      );
    }

    const baseData: any = {
      patientId,
      conditionName: conditionName.trim(),
      diagnosisDate:
        diagnosisDate || new Date().toISOString().split("T")[0],
      status: status || "Active",
      notes: notes ?? null,
      icd10Code: icd10Code ?? null, // 👈 store it
    };

    // Clean empties
    Object.keys(baseData).forEach((k) => {
      if (
        baseData[k] === undefined ||
        baseData[k] === null ||
        baseData[k] === ""
      ) {
        delete baseData[k];
      }
    });

    const colRef = collection(db, COLLECTION_NAME);

    if (id) {
      // UPDATE existing
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...baseData,
        updatedAt: Date.now(),
      });

      return NextResponse.json({
        success: true,
        mode: "updated",
        id,
      });
    } else {
      // CREATE new
      const docToCreate = {
        ...baseData,
        createdAt: Date.now(),
      };
      const docRef = await addDoc(colRef, docToCreate);

      return NextResponse.json({
        success: true,
        mode: "created",
        id: docRef.id,
        data: docToCreate,
      });
    }
  } catch (err: any) {
    console.error("CHRONIC POST ERROR:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Failed to save chronic record",
      },
      { status: 500 }
    );
  }
}

// -------------------- DELETE /api/chronic --------------------
export async function DELETE(req: NextRequest) {
  try {
    const { id } = (await req.json()) as { id?: string };

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing id" },
        { status: 400 }
      );
    }

    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("CHRONIC DELETE ERROR:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Failed to delete chronic record",
      },
      { status: 500 }
    );
  }
}
