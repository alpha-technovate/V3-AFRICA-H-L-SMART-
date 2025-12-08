// src/app/api/medications/search/route.ts

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Basic in-memory medication list for typeahead.
// You can extend this later or swap to a Firestore-backed list.
const MEDICATIONS = [
  "Aspirin",
  "Atorvastatin",
  "Simvastatin",
  "Metformin",
  "Glimepiride",
  "Insulin",
  "Lisinopril",
  "Enalapril",
  "Captopril",
  "Losartan",
  "Amlodipine",
  "Bisoprolol",
  "Carvedilol",
  "Furosemide",
  "Spironolactone",
  "Warfarin",
  "Rivaroxaban",
  "Apixaban",
  "Clopidogrel",
  "Omeprazole",
  "Pantoprazole",
  "Salbutamol",
  "Budesonide/Formoterol",
  "Paracetamol",
  "Ibuprofen",
  "Morphine",
  "Codeine",
  "Amoxicillin",
  "Ceftriaxone",
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").toLowerCase().trim();

    if (!q) {
      // return top few if no query
      return NextResponse.json({
        success: true,
        results: MEDICATIONS.slice(0, 10).map((name) => ({ name })),
      });
    }

    const matches = MEDICATIONS.filter((name) =>
      name.toLowerCase().includes(q)
    ).slice(0, 15);

    return NextResponse.json({
      success: true,
      results: matches.map((name) => ({ name })),
    });
  } catch (err: any) {
    console.error("MEDICATIONS SEARCH ERROR:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Search failed" },
      { status: 500 }
    );
  }
}
