import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString("base64");

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error("Missing GOOGLE_API_KEY");

    const prompt = `
Extract the following from the South African ID document:

- Full Name
- ID Number
- Date of Birth (YYYY-MM-DD)
- Gender
- Age

Return ONLY valid JSON:

{
  "name": "",
  "idNumber": "",
  "dob": "",
  "gender": "",
  "age": ""
}
`;

    // ⭐ Using your supported multimodal model
    const url =
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: file.type || "image/jpeg",
                  data: base64Image,
                },
              },
              { text: prompt },
            ],
          },
        ],
      }),
    });

    const json = await response.json();

    if (!response.ok) {
      console.error("Gemini OCR ERROR:", json);
      throw new Error(json.error?.message || "Gemini OCR failed.");
    }

    const raw = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const cleanText = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleanText);

    const nameParts = parsed.name?.trim().split(/\s+/) || [];
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ");

    return NextResponse.json({
      success: true,
      data: {
        firstName,
        lastName,
        idNumber: parsed.idNumber,
        dateOfBirth: parsed.dob,
        gender: parsed.gender,
        age: parsed.age,
      },
    });
  } catch (err: any) {
    console.error("OCR API ERROR:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
