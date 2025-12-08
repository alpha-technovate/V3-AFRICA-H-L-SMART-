import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  Timestamp,
} from "firebase/firestore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Specialist {
  name: string;
  role: string;            // Example: "Cardiologist"
  specialty?: string;      // Alias of role for UI
  contactEmail: string;
  contactPhone: string;
  address: string;
  practiceName: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ======================================================
// GET — ALL SPECIALISTS OR ONE BY ID
// ======================================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const specialistId = searchParams.get("id");

    // ============ SINGLE SPECIALIST ==================
    if (specialistId) {
      const ref = doc(db, "specialists", specialistId);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        return NextResponse.json(
          { success: false, error: "Specialist not found", data: null },
          { status: 404 }
        );
      }

      const raw = snap.data() as any;

      return NextResponse.json({
        success: true,
        data: {
          id: snap.id,
          name: raw.name || "",
          specialty: raw.specialty || raw.role || "",
          contactEmail: raw.contactEmail || "",
          contactPhone: raw.contactPhone || "",
          address: raw.address || "",
          practiceName: raw.practiceName || "",
          isActive: raw.isActive ?? true,
          imageUrl: raw.photoUrl || raw.imageUrl || null,
          ...raw,
        },
        error: null,
      });
    }

    // ============ LIST ALL ============================
    const snap = await getDocs(collection(db, "specialists"));

    const specialists = snap.docs.map((d) => {
      const raw = d.data() as any;

      return {
        id: d.id,
        name: raw.name || "",
        specialty: raw.specialty || raw.role || "",
        contactEmail: raw.contactEmail || "",
        contactPhone: raw.contactPhone || "",
        practiceName: raw.practiceName || "",
        isActive: raw.isActive ?? true,
        imageUrl: raw.photoUrl || raw.imageUrl || null,
      };
    });

    return NextResponse.json({
      success: true,
      specialists,
      data: specialists, // backward compatibility
      error: null,
    });
  } catch (error: any) {
    console.error("SPECIALISTS GET ERROR:", error);
    return NextResponse.json(
      { success: false, data: null, error: error.message },
      { status: 500 }
    );
  }
}

// ======================================================
// POST — ADMIN CREATE SPECIALIST
// ======================================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, role, contactEmail } = body;

    if (!name || !role || !contactEmail) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: name, role, contactEmail",
          data: null,
        },
        { status: 400 }
      );
    }

    const now = Timestamp.now();
    const newDoc: Specialist = {
      name,
      role,
      specialty: body.specialty || role,
      contactEmail,
      contactPhone: body.contactPhone || "",
      address: body.address || "",
      practiceName: body.practiceName || "",
      isActive: body.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };

    const ref = await addDoc(collection(db, "specialists"), newDoc);

    return NextResponse.json({
      success: true,
      data: { id: ref.id, message: "Specialist created" },
      error: null,
    });
  } catch (error: any) {
    console.error("SPECIALISTS POST ERROR:", error);
    return NextResponse.json(
      { success: false, data: null, error: error.message },
      { status: 500 }
    );
  }
}

// ======================================================
// PATCH — ADMIN UPDATE SPECIALIST
// ======================================================
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...rest } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing specialist ID", data: null },
        { status: 400 }
      );
    }

    const ref = doc(db, "specialists", id);

    await updateDoc(ref, {
      ...rest,
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({
      success: true,
      data: { message: "Specialist updated" },
      error: null,
    });
  } catch (error: any) {
    console.error("SPECIALISTS PATCH ERROR:", error);
    return NextResponse.json(
      { success: false, data: null, error: error.message },
      { status: 500 }
    );
  }
}

// ======================================================
// DELETE — ADMIN REMOVE SPECIALIST
// ======================================================
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing specialist ID", data: null },
        { status: 400 }
      );
    }

    await deleteDoc(doc(db, "specialists", id));

    return NextResponse.json({
      success: true,
      data: { message: "Specialist deleted" },
      error: null,
    });
  } catch (error: any) {
    console.error("SPECIALISTS DELETE ERROR:", error);
    return NextResponse.json(
      { success: false, data: null, error: error.message },
      { status: 500 }
    );
  }
}
