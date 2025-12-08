import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/admin";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function POST(req: Request) {
  try {
    const { patientId, transcript } = await req.json();

    if (!patientId) {
      return NextResponse.json({
        success: false,
        error: "Missing patientId",
      });
    }

    if (!transcript) {
      return NextResponse.json({
        success: false,
        error: "Missing transcript",
      });
    }

    // -------------------------
    // AI — Generate SOAP format
    // -------------------------
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Convert this clinical input into a clean, accurate SOAP note format:

Clinical input: "${transcript}"

Provide output ONLY in this structure:
Subjective:
Objective:
Assessment:
Plan:`,
            },
          ],
        },
      ],
    });

    const aiText =
      typeof result.response.text === "function"
        ? result.response.text()
        : result.response.text || "";

    const cleaned = aiText.trim();

    // -------------------------
    // Save to Firestore
    // -------------------------
    const ref = await db
      .collection("patients")
      .doc(patientId)
      .collection("soapNotes")
      .add({
        text: cleaned,
        createdAt: Date.now(),
        voiceSource: transcript,
      });

    return NextResponse.json({
      success: true,
      soapId: ref.id,
      soap: cleaned,
    });
  } catch (err: any) {
    console.error("SOAP NOTE ERROR:", err);
    return NextResponse.json({
      success: false,
      error: err.message,
    });
  }
}
