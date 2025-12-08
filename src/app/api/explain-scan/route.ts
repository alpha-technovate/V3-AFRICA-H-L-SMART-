import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json(
        { success: false, error: "Missing image" },
        { status: 400 }
      );
    }

    // Gemini 1.5 Flash Vision call
    const prompt = `
      You are an expert radiologist. 
      Analyze the medical image and produce:

      1. Key Findings
      2. Impression (Diagnosis)
      3. Urgency level (Routine / Early Attention / Urgent / Emergency)
      4. Recommended next steps
      5. Red flags to monitor

      Keep it short but clinically useful.
    `;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
        process.env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                { inlineData: { mimeType: "image/jpeg", data: image.split(",")[1] } },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    const explanation =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No interpretation available.";

    return NextResponse.json({ success: true, explanation });
  } catch (err: any) {
    console.error("EXPLAIN-SCAN ERROR:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
