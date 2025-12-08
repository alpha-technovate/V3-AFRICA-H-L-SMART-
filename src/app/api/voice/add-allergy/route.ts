// src/app/api/voice/add-allergy/route.ts

import { NextResponse } from "next/server";
import { db, Timestamp } from "@/lib/firebase/admin"; // Using Firebase Admin SDK
// NOTE: Assuming Timestamp is exported from "@/lib/firebase/admin" alongside db

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COLLECTION_NAME = "allergies";

/**
 * POST handler: Receives structured Allergy data from the AI parser (via SmartBridgeAssistant)
 * and writes the new record to the top-level 'allergies' collection.
 * * Expected Body (Payload from SmartBridgeAssistant):
 * {
 * patientId: string,
 * payload: { 
 * allergen: string, // The substance (was 'substance' in your original payload)
 * severity?: 'Mild' | 'Moderate' | 'Severe' | 'Life-Threatening',
 * reaction?: string
 * }
 * }
 */
export async function POST(req: Request) {
  try {
    const { patientId, payload } = await req.json();

    if (!patientId || !payload || !payload.allergen) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields (patientId or allergen) in payload.",
      }, { status: 400 });
    }

    // --- Data Synchronization and Mapping ---
    // Ensure the data aligns with the Allergy type defined in src/lib/types.ts
    const now = Timestamp.now();
    
    const allergyData = {
      patientId: patientId,
      allergen: payload.allergen,
      reaction: payload.reaction || "Unspecified reaction (Voice Input)",
      severity: payload.severity || "Moderate", // Default if AI didn't extract it
      type: payload.type || "Other",          // Default type
      status: "Active",                        // Default status
      notes: payload.notes || "Added via voice command.",
      
      createdAt: now,
      updatedAt: now,
    };

    // --- Write to Top-Level Collection: 'allergies' ---
    const ref = await db
      .collection(COLLECTION_NAME)
      .add(allergyData);

    return NextResponse.json({
      success: true,
      data: { id: ref.id },
      error: null,
    }, { status: 201 });
    
  } catch (err: any) {
    console.error("VOICE ADD ALLERGY ERROR:", err);
    return NextResponse.json({
      success: false,
      data: null,
      error: err.message,
    }, { status: 500 });
  }
}