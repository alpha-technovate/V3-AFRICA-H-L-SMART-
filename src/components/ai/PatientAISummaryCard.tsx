"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Loader2, Brain } from "lucide-react";

interface AISummary {
  summary: string;
  findings: string[];
  recommendations: string[];
}

export default function PatientAISummaryCard({ patientId }: { patientId: string }) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadSummary() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/patient-ai-summary?patientId=${patientId}`);
      const json = await res.json();

      if (json.success) {
        setSummary(json.data);
      } else {
        setError(json.error || "AI failed to generate summary.");
      }
    } catch (err) {
      setError("Failed to load AI summary.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSummary();
  }, [patientId]);

  return (
    <Card className="p-6 bg-white rounded-2xl shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <Brain className="w-5 h-5 text-teal-700" />
        <h2 className="text-xl font-semibold text-teal-700">AI Patient Summary</h2>

        <button
          onClick={loadSummary}
          className="ml-auto text-xs text-teal-600 hover:underline"
        >
          Refresh
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-6 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Generating summary…
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 py-4">{error}</p>
      )}

      {!loading && summary && (
        <div className="space-y-4">
          {/* MAIN SUMMARY */}
          <p className="text-gray-800 whitespace-pre-line leading-relaxed">
            {summary.summary}
          </p>

          {/* FINDINGS */}
          {summary.findings?.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-teal-700">Key Findings</h3>
              <ul className="list-disc ml-5 text-sm text-gray-700 space-y-1">
                {summary.findings.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}

          {/* RECOMMENDATIONS */}
          {summary.recommendations?.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-teal-700">AI Recommendations</h3>
              <ul className="list-disc ml-5 text-sm text-gray-700 space-y-1">
                {summary.recommendations.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
