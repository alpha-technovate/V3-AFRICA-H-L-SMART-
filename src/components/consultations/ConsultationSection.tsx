"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus } from "lucide-react";

export default function ConsultationSection({
  patientId,
}: {
  patientId: string;
}) {
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/consultations?patientId=${patientId}`);
    const data = await res.json();

    if (data.success) {
      setConsultations(data.consultations);
    }
    setLoading(false);
  }

  async function createConsultation() {
    if (!summary.trim()) return;

    setSaving(true);
    await fetch("/api/consultations", {
      method: "POST",
      body: JSON.stringify({
        patientId,
        summary,
      }),
    });
    setSaving(false);
    setSummary("");
    load();
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="bg-gray-50 rounded-xl p-6 border shadow-inner">
      <h2 className="text-2xl font-semibold mb-4">Consultations</h2>

      {/* Add Consultation */}
      <div className="flex gap-3 mb-6">
        <input
          className="flex-1 border rounded-xl p-3"
          placeholder="Enter consultation summary..."
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />

        <button
          onClick={createConsultation}
          className="bg-teal-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-teal-700 transition"
        >
          <Plus size={20} />
          {saving ? "Saving..." : "Add"}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 className="animate-spin" size={20} />
          Loading...
        </div>
      )}

      {/* Empty */}
      {!loading && consultations.length === 0 && (
        <div className="text-gray-500">No consultations yet.</div>
      )}

      {/* List */}
      {!loading && consultations.length > 0 && (
        <div className="space-y-4">
          {consultations.map((c) => (
            <div
              key={c.id}
              className="bg-white p-4 rounded-xl shadow border border-gray-200"
            >
              <p className="font-semibold text-gray-900">{c.summary}</p>
              <p className="text-sm text-gray-500 mt-1">
                {c.createdAt?.seconds
                  ? new Date(c.createdAt.seconds * 1000).toLocaleString()
                  : "Unknown date"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
