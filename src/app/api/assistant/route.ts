// src/app/api/assistant/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

// ✔ MUST MATCH the model list you provided
const MODEL = "gemini-2.5-flash";

export async function POST(req: Request) {
  try {
    const { input } = await req.json();

    if (!input || !input.trim()) {
      return NextResponse.json({
        success: false,
        error: "No input provided",
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: "Missing GEMINI_API_KEY",
      });
    }

    // -------------------------------------------------
    // Correct REST Endpoint (NO SDK, NO Vertex, NO OAuth)
    // -------------------------------------------------
    const url = `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: input }],
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini Error:", data);
      throw new Error(data.error?.message || "Gemini API Error");
    }

    // Extract text
    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      data.text ||
      "";

    return NextResponse.json({
      success: true,
      reply,
    });
  } catch (err: any) {
    console.error("ASSISTANT ERROR:", err);

    return NextResponse.json({
      success: false,
      error: err.message || "Unexpected AI error",
    });
  }
}
