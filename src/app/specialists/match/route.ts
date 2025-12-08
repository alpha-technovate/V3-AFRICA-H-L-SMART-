import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 
 * TEMP: In-memory list of specialists
 * Replace with Firestore or AHLI dataset later
 */
const SPECIALISTS = [
  { id: "sp1", name: "Dr Jehron Pillay", role: "Cardiothoracic Surgeon", keywords: ["heart", "cardiac", "thoracic", "ct surgeon"] },
  { id: "sp2", name: "Dr James Chen", role: "Renal Physician", keywords: ["kidney", "renal", "nephro", "akf"] },
  { id: "sp3", name: "Dr Sanjay Maharaj", role: "General Surgeon", keywords: ["abdominal", "hernia", "surgery"] },
  { id: "sp4", name: "Dr Sarah Mkhize", role: "Endocrinologist", keywords: ["diabetes", "thyroid", "hormone", "endocrine"] },
  { id: "sp5", name: "Dr Michael Zuma", role: "Pulmonologist", keywords: ["lungs", "breathing", "asthma", "respiratory"] },
];

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({
        success: false,
        error: "Missing query",
      });
    }

    const text = query.toLowerCase();

    // Find matching specialist by keyword
    const match = SPECIALISTS.find((spec) =>
      spec.keywords.some((k) => text.includes(k))
    );

    if (!match) {
      return NextResponse.json({
        success: false,
        error: "No suitable specialist found",
      });
    }

    return NextResponse.json({
      success: true,
      specialistId: match.id,
      specialistName: match.name,
      specialistRole: match.role,
    });
  } catch (err: any) {
    console.error("SPECIALIST MATCH ERROR:", err);
    return NextResponse.json({
      success: false,
      error: err.message,
    });
  }
}
