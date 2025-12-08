"use server";

import PDFDocument from "pdfkit";

export async function generatePatientPDFServer(patient: any) {
  const doc = new PDFDocument();

  const chunks: any[] = [];
  doc.on("data", chunks.push.bind(chunks));
  doc.on("end", () => {});

  doc.fontSize(20).text("SmartBridge Patient Summary", { underline: true });
  doc.moveDown();

  doc.fontSize(14).text(`Name: ${patient.name}`);
  doc.text(`Age: ${patient.age}`);
  doc.text(`ID: ${patient.idNumber}`);
  doc.text(`Diagnosis: ${patient.diagnosis}`);

  doc.end();

  return Buffer.concat(chunks);
}
