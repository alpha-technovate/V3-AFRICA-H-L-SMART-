// src/app/api/pdf-full-summary/route.ts (REWRITTEN)

import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { 
    doc, 
    getDoc, 
    collection, // Needed for sub-collection queries
    query,     // Needed for ordering/limiting
    getDocs,   // Needed for getting multiple documents
    orderBy, 
    limit, 
    Timestamp // For type safety
} from "firebase/firestore"; 
import { db } from "@/lib/firebaseConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// --- Configuration (Remains the same) ---
const PAGE_WIDTH = 600;
const PAGE_HEIGHT = 850;
const MARGIN = 40;
const FONT_SIZE_HEADER = 18;
const FONT_SIZE_SECTION = 14;
const FONT_SIZE_BODY = 10;
const LINE_HEIGHT = 14;

// --- Helper Functions (IMPROVED DATA FETCHING) ---

/** Placeholder function to fetch comprehensive clinical and admin data. */
async function fetchAllPatientData(patientId: string) {
    // 1. Fetch Patient Demographics (Base Document)
    const patientRef = doc(db, "patients", patientId);
    const snap = await getDoc(patientRef);
    if (!snap.exists()) return null;
    const patient = snap.data() as any;

    // 2. Fetch Clinical Lists Concurrently using Promise.all
    // Assuming sub-collections under the patient document: /patients/{id}/[collectionName]

    const [vitalsSnap, medsSnap, chronicSnap, allergiesSnap] = await Promise.all([
        // Get Latest Vitals (Query by timestamp/createdAt, limit 1)
        getDocs(query(collection(db, `patients/${patientId}/vitals`), orderBy('createdAt', 'desc'), limit(1))),
        
        // Get all Active Medications (assuming status field exists)
        // NOTE: This should likely be filtered by status if your schema supports it
        getDocs(collection(db, `patients/${patientId}/medications`)),

        // Get all Chronic Conditions
        getDocs(collection(db, `patients/${patientId}/chronicConditions`)),

        // Get all Allergies
        getDocs(collection(db, `patients/${patientId}/allergies`)),
    ]);
    
    // 3. Process Fetched Data

    // A. Vitals
    const latestVitalsDoc = vitalsSnap.docs[0]?.data();
    const latestVitals = latestVitalsDoc ? [
        `BP: ${latestVitalsDoc.bloodPressure || 'N/A'} mmHg`,
        `HR: ${latestVitalsDoc.heartRate || 'N/A'} bpm`,
        `Temp: ${latestVitalsDoc.temperature || 'N/A'} °C`,
        `Date: ${(latestVitalsDoc.createdAt as Timestamp)?.toDate().toLocaleDateString() || 'N/A'}`
    ] : ["No recent vitals recorded."];

    // B. Medications (Uses data from the patient's base 'aiIntake' if available, otherwise fetched)
    const medications = medsSnap.docs.map(d => d.data() as any).map(m => 
        `${m.name || 'N/A'} ${m.dose || ''} x ${m.frequency || ''} (Status: ${m.status || 'Active'})`
    ).slice(0, 10); // Limit to 10 for summary

    // C. Chronic Conditions
    const chronicConditions = chronicSnap.docs.map(d => d.data() as any).map(c => 
        `${c.name || 'N/A'} (Status: ${c.status || 'Active'})`
    ).slice(0, 10);

    // D. Allergies
    const allergies = allergiesSnap.docs.map(d => d.data() as any).map(a => 
        `${a.allergen || 'N/A'} (Reaction: ${a.reaction || 'N/A'})`
    ).slice(0, 10);
    
    // E. Latest Notes (Still using AI Intake placeholder as the primary source)
    const latestNotes = patient.aiIntake?.notes?.soapNote || "No recent structured clinical notes found.";


    // 4. Combine and return the final summary object
    return { 
        ...patient,
        latestVitals: medications.length > 0 ? latestVitals : ["No active medications recorded."],
        medications: medications.length > 0 ? medications : ["No active medications recorded."],
        chronicConditions: chronicConditions.length > 0 ? chronicConditions : ["No chronic conditions recorded."],
        allergies: allergies.length > 0 ? allergies : ["No known allergies recorded."],
        latestNotes
    };
}

// -----------------------------------------------------------------
// GET — /api/pdf-full-summary?patientId=XYZ (PDF GENERATION LOGIC)
// -----------------------------------------------------------------
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const patientId = searchParams.get("patientId");

        if (!patientId) {
            return NextResponse.json(
                { success: false, data: null, error: "Missing required query parameter: patientId." },
                { status: 400 }
            );
        }

        // --- 1. Fetch All Data ---
        const data = await fetchAllPatientData(patientId);

        if (!data) {
            return NextResponse.json(
                { success: false, data: null, error: "Patient not found." },
                { status: 404 }
            );
        }

        const fullName = `${data.firstName || data.name || "N/A"} ${data.lastName || ""}`.trim();

        // --- 2. Create PDF ---
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        let y = PAGE_HEIGHT - MARGIN;
        const x = MARGIN;

        // --- Title and Demographics ---
        page.drawText('Full Clinical Summary', {
            x, y, size: FONT_SIZE_HEADER, font: fontBold, color: rgb(0.1, 0.5, 0.4),
        });
        y -= 25;

        page.drawText('PATIENT DEMOGRAPHICS', { x, y, size: FONT_SIZE_SECTION, font: fontBold });
        y -= LINE_HEIGHT;
        page.drawText(`Name: ${fullName}`, { x, y, size: FONT_SIZE_BODY, font });
        y -= LINE_HEIGHT;
        page.drawText(`ID: ${data.idNumber || 'N/A'} | DOB: ${data.dateOfBirth || 'N/A'} | Gender: ${data.gender || 'N/A'}`, { x, y, size: FONT_SIZE_BODY, font });
        y -= LINE_HEIGHT;
        page.drawText(`Contact: ${data.contactNumber || 'N/A'}`, { x, y, size: FONT_SIZE_BODY, font });
        y -= LINE_HEIGHT * 2; // Extra space

        // --- Primary Diagnosis ---
        page.drawText('PRIMARY DIAGNOSIS', { x, y, size: FONT_SIZE_SECTION, font: fontBold, color: rgb(0.6, 0.1, 0.1) });
        y -= LINE_HEIGHT;
        // Use wrap text if the diagnosis is long
        const diagnosisText = data.diagnosis || "No primary diagnosis recorded.";
        page.drawText(diagnosisText, { x, y, size: FONT_SIZE_BODY, font, maxWidth: PAGE_WIDTH - 2 * MARGIN });
        y -= diagnosisText.split('\n').length * LINE_HEIGHT;
        y -= LINE_HEIGHT * 2;

        // --- Vitals ---
        page.drawText('LATEST VITALS', { x, y, size: FONT_SIZE_SECTION, font: fontBold });
        y -= LINE_HEIGHT;
        data.latestVitals.forEach((line: string) => {
            page.drawText(line, { x, y, size: FONT_SIZE_BODY, font });
            y -= LINE_HEIGHT;
        });
        y -= LINE_HEIGHT;

        // --- Chronic Conditions ---
        page.drawText('CHRONIC CONDITIONS', { x, y, size: FONT_SIZE_SECTION, font: fontBold });
        y -= LINE_HEIGHT;
        data.chronicConditions.forEach((line: string) => {
            page.drawText(`• ${line}`, { x, y, size: FONT_SIZE_BODY, font });
            y -= LINE_HEIGHT;
        });
        y -= LINE_HEIGHT;

        // --- Medications ---
        page.drawText('ACTIVE MEDICATIONS', { x, y, size: FONT_SIZE_SECTION, font: fontBold });
        y -= LINE_HEIGHT;
        data.medications.forEach((line: string) => {
            page.drawText(`• ${line}`, { x, y, size: FONT_SIZE_BODY, font });
            y -= LINE_HEIGHT;
        });
        y -= LINE_HEIGHT;

        // --- Allergies ---
        page.drawText('ALLERGIES', { x, y, size: FONT_SIZE_SECTION, font: fontBold });
        y -= LINE_HEIGHT;
        data.allergies.forEach((line: string) => {
            page.drawText(`• ${line}`, { x, y, size: FONT_SIZE_BODY, font, color: rgb(0.8, 0.2, 0.2) });
            y -= LINE_HEIGHT;
        });
        y -= LINE_HEIGHT;

        // --- Latest Notes ---
        page.drawText('LATEST CLINICAL NOTES (AI Summary)', { x, y, size: FONT_SIZE_SECTION, font: fontBold });
        y -= LINE_HEIGHT;
        
        // Split and draw the notes content with text wrapping
        const notesLines = data.latestNotes.split('\n');
        for (let line of notesLines) {
             page.drawText(line, { x, y, size: FONT_SIZE_BODY, font, lineHeight: LINE_HEIGHT, maxWidth: PAGE_WIDTH - 2 * MARGIN });
             y -= LINE_HEIGHT;
             // Basic pagination stop
             if (y < MARGIN) break; 
        }

        // --- Footer ---
        y = MARGIN; 
        page.drawText(`Generated by SmartBridge System | ${new Date().toLocaleString()}`, { 
            x, y, size: 8, font, color: rgb(0.5, 0.5, 0.5) 
        });

        const pdfBytes = await pdfDoc.save();

        // --- 3. Return the file buffer ---
        return new NextResponse(Buffer.from(pdfBytes), {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="SmartBridge-Full-Summary-${patientId}.pdf"`,
            },
        });

    } catch (error) {
        console.error("FULL SUMMARY PDF ERROR:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to generate comprehensive PDF summary.";

        return NextResponse.json(
            { success: false, data: null, error: `Server Error: ${errorMessage}` },
            { status: 500 }
        );
    }
}