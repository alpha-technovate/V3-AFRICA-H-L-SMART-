import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Smart classifier for note type
function classifyNote(text: string): string {
  const lower = text.toLowerCase();

  if (lower.includes("subjective") || lower.includes("complains")) return "subjective";
  if (lower.includes("objective") || lower.includes("exam")) return "objective";
  if (lower.includes("assessment") || lower.includes("diagnosis")) return "assessment";
  if (lower.includes("plan") || lower.includes("follow")) return "plan";

  return "general";
}

export async function POST(req: Request) {
  try {
    const { patientId, payload } = await req.json();
    const text: string = payload?.text || "";

    if (!patientId) {
      return NextResponse.json({ success: false, error: "Missing patientId" });
    }

    if (!text.trim()) {
      return NextResponse.json({ success: false, error: "Empty note text" });
    }

    const noteType = classifyNote(text);

    const data = {
      text,
      type: noteType,
      createdAt: Date.now(),
    };

    const ref = await db
      .collection("patients")
      .doc(patientId)
      .collection("notes")
      .add(data);

    return NextResponse.json({
      success: true,
      id: ref.id,
      type: noteType,
      message: "Note saved successfully",
    });

  } catch (err: any) {
    console.error("ADD-NOTE ERROR:", err);
    return NextResponse.json({ success: false, error: err.message });
  }
}
