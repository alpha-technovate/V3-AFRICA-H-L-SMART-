"use client";

import { useState } from "react";
import jsPDF from "jspdf";
import { FileText, Sparkles, Loader2 } from "lucide-react";

type ReportGeneratorProps = {
  patientId: string;
  name: string;
  age: number;
  idNumber: string;
  diagnosis?: string;
};

export default function ReportGenerator({
  patientId,
  name,
  age,
  idNumber,
  diagnosis,
}: ReportGeneratorProps) {
  const [loading, setLoading] = useState(false);

  async function generateSummaryPdf() {
    setLoading(true);

    try {
      // fetch treatment notes to include in summary
      const res = await fetch(`/api/treatment-notes?patientId=${patientId}`);
      const data = await res.json();

      const notes: any[] = data.success ? data.notes : [];

      const doc = new jsPDF();

      let y = 20;

      doc.setFontSize(16);
      doc.text("SmartBridge 2.0 – Clinical Summary", 10, y);
      y += 10;

      doc.setFontSize(11);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 10, y);
      y += 10;

      doc.line(10, y, 200, y);
      y += 10;

      doc.setFontSize(12);
      doc.text("Patient Details", 10, y);
      y += 8;

      doc.setFontSize(11);
      doc.text(`Name: ${name}`, 10, y);
      y += 6;
      doc.text(`ID Number: ${idNumber}`, 10, y);
      y += 6;
      doc.text(`Age: ${age}`, 10, y);
      y += 10;

      if (diagnosis) {
        doc.setFontSize(12);
        doc.text("Primary Diagnosis / Reason for Visit", 10, y);
        y += 8;
        doc.setFontSize(11);

        const lines = doc.splitTextToSize(diagnosis, 180);
        doc.text(lines, 10, y);
        y += lines.length * 6 + 6;
      }

      // Treatment notes section
      doc.setFontSize(12);
      doc.text("Treatment Notes (Recent)", 10, y);
      y += 8;
      doc.setFontSize(11);

      if (!notes || notes.length === 0) {
        doc.text("No treatment notes recorded.", 10, y);
      } else {
        const sorted = [...notes].sort((a, b) => {
          const ta = a.createdAt?.seconds || 0;
          const tb = b.createdAt?.seconds || 0;
          return tb - ta;
        });

        const toShow = sorted.slice(0, 3);

        toShow.forEach((note, idx) => {
          const created =
            note.createdAt?.seconds
              ? new Date(note.createdAt.seconds * 1000).toLocaleString()
              : "Unknown date";

          const label =
            note.source === "ai-generated" ? "AI note" : "Manual note";

          const title = `• ${label} (${created})`;
          const text = note.text || "";

          const lines = doc.splitTextToSize(text, 180);

          if (y > 270) {
            doc.addPage();
            y = 20;
          }

          doc.text(title, 10, y);
          y += 6;

          doc.text(lines, 10, y);
          y += lines.length * 6 + 6;

          if (idx < toShow.length - 1) {
            doc.setDrawColor(200);
            doc.line(10, y, 200, y);
            y += 6;
          }
        });
      }

      // Footer
      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      y = 280;
      doc.setFontSize(9);
      doc.setTextColor(130);
      doc.text(
        "This summary was generated via SmartBridge 2.0. All clinical decisions must be verified by a qualified clinician.",
        10,
        y
      );

      doc.save(`${name.replace(/\s+/g, "_")}_clinical_summary.pdf`);
    } finally {
      setLoading(false);
    }
  }

  async function generateMotivationalLetter() {
    setLoading(true);

    try {
      const doc = new jsPDF();

      let y = 20;

      doc.setFontSize(16);
      doc.text("Motivational Letter", 10, y);
      y += 10;

      doc.setFontSize(11);
      doc.text(`Dear ${name},`, 10, y);
      y += 10;

      const body = [
        "We know that navigating health challenges can be stressful and overwhelming.",
        "This letter is a reminder that you are not alone in this process.",
        "",
        "Your care team is working with you, step by step, to improve your heart and overall health.",
        "Small, consistent changes can have a big impact over time.",
        "",
        "Please continue to attend your appointments, take your medications as prescribed,",
        "and ask questions whenever you are unsure. SmartBridge 2.0 is here to support",
        "your care, and our hope is that you feel informed, supported and empowered.",
        "",
        "With care,",
        "",
        "Your SmartBridge Care Team",
      ].join(" ");

      const lines = doc.splitTextToSize(body, 180);
      doc.text(lines, 10, y);

      y = 270;
      doc.setFontSize(9);
      doc.setTextColor(130);
      doc.text(
        "This motivational letter is generated to support and encourage the patient. It does not replace clinical advice.",
        10,
        y
      );

      doc.save(`${name.replace(/\s+/g, "_")}_motivational_letter.pdf`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
        <FileText className="text-teal-600" /> Generate Reports
      </h3>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={generateSummaryPdf}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-sm hover:bg-teal-700 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <FileText size={16} />
          )}
          Summary PDF
        </button>

        <button
          onClick={generateMotivationalLetter}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-sm hover:bg-purple-700 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Sparkles size={16} />
          )}
          Motivational Letter
        </button>
      </div>
    </div>
  );
}
