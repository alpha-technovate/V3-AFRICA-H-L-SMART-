import { NextResponse, NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("CRITICAL: GEMINI_API_KEY environment variable is not set.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    // --- STREAMING FIX ---
    const result: any = await model.generateContentStream(prompt);

    // Your SDK hides the real async iterator inside result.stream
    const stream = result.stream;

    if (!stream || typeof stream[Symbol.asyncIterator] !== "function") {
      console.error("Stream object:", stream);
      throw new Error("Gemini SDK did not return an async iterable stream");
    }

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          // Some SDK versions use chunk.text(), others chunk.text
          const text =
            typeof chunk.text === "function" ? chunk.text() : chunk.text;

          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      },
    });

    return new NextResponse(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (err: any) {
    console.error("AI STREAM ERROR:", err);
    return NextResponse.json(
      { error: err?.message || "Streaming failed" },
      { status: 500 }
    );
  }
}
