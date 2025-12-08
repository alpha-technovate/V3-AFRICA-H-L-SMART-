// src/app/api/pdf-motivation/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
// USE MODERN FIREBASE CLIENT SDK IMPORTS
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore"; 
// USE GEMINI SDK
import { GoogleGenAI } from "@google/genai"; 

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The GoogleGenAI client will automatically read the GEMINI_API_KEY from process.env
const ai = new GoogleGenAI({}); 

// Define a basic interface for the data retrieved from Firestore
interface PatientData {
    name?: string;
    firstName?: string;
    lastName?: string;
    age?: number | string;
    diagnosis?: string;
}

// -----------------------------------------------------------------
// ⬇️ GET /api/pdf-motivation?patientId=...
// -----------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json(
        { success: false, error: "Missing required query parameter: patientId." },
        { status: 400 }
      );
    }

    // --- 1. Fetch Patient Data ---
    const patientRef = doc(db, "patients", patientId); 
    const snap = await getDoc(patientRef);

    if (!snap.exists()) {
      return NextResponse.json(
        { success: false, error: "Patient not found." },
        { status: 404 }
      );
    }

    const patient = snap.data() as PatientData;
    // Safely construct patient name using available data
    const patientName = patient.name || `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || "Valued Patient";
    const patientAge = patient.age || "Unknown Age";
    const patientCondition = patient.diagnosis || "your health goals";


    // --- 2. Generate Motivational Text (Gemini) ---
    const prompt = `
Write a short, professional, and compassionate motivational message for a patient.
Patient Name: ${patientName}
Age: ${patientAge}
Condition: ${patientCondition}
Tone: encouraging, compassionate, and focused on perseverance. Keep the message strictly to 3-4 concise lines.
    `;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "You are a compassionate medical assistant providing personalized encouragement.",
        temperature: 0.7,
      }
    });

    // Extract message content from the Gemini response object
    const message =
      result.text.trim() ||
      "Stay strong, you are showing incredible courage and resilience on your health journey. We believe in your ability to achieve your best health.";

    
    // --- 3. PDF GENERATION (Optimized for Readability) ---
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([500, 700]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    let y = 650;
    const x = 50;
    const lineHeight = 20;

    // Header Title
    page.drawText('A Message of Encouragement from Your Care Team', {
      x,
      y,
      size: 18,
      font: fontBold,
      color: rgb(0.1, 0.5, 0.4), // Dark Teal
    });
    y -= 35;

    // Personalized Salutation
    page.drawText(`Dear ${patientName},`, {
      x,
      y,
      size: 14,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= 30;

    // AI Generated Message Content
    page.drawText(message, {
      x,
      y,
      size: 14,
      font,
      lineHeight: lineHeight,
      maxWidth: 400, // Constrain width for cleaner text block
      color: rgb(0.3, 0.3, 0.3),
    });
    
    // Footer / Signature
    // Estimate final Y position based on message line breaks
    const messageLines = message.split('\n').filter(line => line.trim() !== '').length;
    y -= (messageLines * lineHeight) + 60; 

    page.drawText('We are here to support you every step of the way.', {
      x,
      y,
      size: 12,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= 25;

    page.drawText(`— SmartBridge Care`, {
      x,
      y,
      size: 14,
      font: fontBold,
      color: rgb(0.1, 0.5, 0.4),
    });


    const pdfBytes = await pdfDoc.save();

    // --- 4. Return the file buffer ---
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="SmartBridge-Motivational-Letter-${patientId}.pdf"`,
      },
    });

  } catch (error: any) {
    console.error("GEMINI PDF ERROR:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate PDF" },
      { status: 500 }
    );
  }
}