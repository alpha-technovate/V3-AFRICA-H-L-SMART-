"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Calendar } from "lucide-react";

interface Visit {
  id: string;
  patientId: string;
  doctorId?: string;
  visitType?: string;
  reasonForVisit: string;
  notes: string;
  status?: string;
  visitDate?: { seconds: number };
  createdAt?: { seconds: number };
}

export default function VisitsSection({ patientId }: { patientId: string }) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [doctor, setDoctor] = useState("");
  const [type, setType] = useState("follow-up");

  const [saving, setSaving] = useState(false);

  // Convert Firestore timestamp safely
  function tsToDate(ts?: { seconds: number }) {
    if (!ts?.seconds) return "Unknown";
    return new Date(ts.seconds * 1000).toLocaleString();
  }

  // -------------------------------
  // LOAD VISITS (fixed to match backend)
  // -------------------------------
  async function loadVisits() {
    setLoading(true);

    try {
      const res = await fetch(`/api/visits?patientId=${patientId}`);

      if (!res.ok) {
        console.error("Visits API returned error:", res.status);
        setVisits([]);
        return;
      }

      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        setVisits(json.data);
      } else {
        console.error("Invalid visits structure:", json);
        setVisits([]);
      }
    } catch (err) {
      console.error("Failed loading visits:", err);
      setVisits([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (patientId) loadVisits();
  }, [patientId]);

  // -------------------------------
  // ADD VISIT (matching backend fields)
  // -------------------------------
  async function addVisit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/visits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          date: date || new Date().toISOString().split("T")[0],
          reason,
          notes,
          doctorId: doctor,
          type,
        }),
      });

      const json = await res.json();

      if (json.success) {
        setReason("");
        setNotes("");
        setDoctor("");
        setType("follow-up");
        setDate("");
        loadVisits();
      } else {
        console.error(json.error);
      }
    } catch (err) {
      console.error("Failed to add visit:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* ----------------------- */}
      {/* ADD VISIT FORM */}
      {/* ----------------------- */}
      <Card className="p-4 space-y-4">
        <h2 className="text-lg font-semibold text-teal-700 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Add Visit
        </h2>

        <form onSubmit={addVisit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold">Visit Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold">Type</label>
              <Input
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="follow-up / emergency / first visit"
              />
            </div>

            <div>
              <label className="text-xs font-semibold">Doctor ID</label>
              <Input
                value={doctor}
                onChange={(e) => setDoctor(e.target.value)}
                placeholder="DOC001, DOC002, etc"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold">Reason</label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Chest pain, follow-up, etc."
            />
          </div>

          <div>
            <label className="text-xs font-semibold">Notes</label>
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Clinical notes, findings, recommendations…"
            />
          </div>

          <div className="flex justify-end">
            <Button disabled={saving || !reason}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Visit"}
            </Button>
          </div>
        </form>
      </Card>

      {/* ----------------------- */}
      {/* VISITS LIST */}
      {/* ----------------------- */}
      <Card className="p-4 space-y-3">
        <h2 className="text-lg font-semibold text-teal-700">Previous Visits</h2>

        {loading ? (
          <p className="text-gray-500 text-sm">Loading visits…</p>
        ) : visits.length === 0 ? (
          <p className="text-gray-500 text-sm">No visits recorded.</p>
        ) : (
          <div className="space-y-3">
            {visits.map((v) => (
              <Card key={v.id} className="p-4 border shadow-sm">
                <h3 className="font-semibold text-teal-700">
                  {v.reasonForVisit || "Visit"}
                </h3>

                <p className="text-xs text-gray-500">
                  {tsToDate(v.visitDate)} — {v.visitType}
                </p>

                {v.doctorId && (
                  <p className="text-xs text-gray-700">Doctor ID: {v.doctorId}</p>
                )}

                {v.notes && (
                  <p className="text-sm mt-2 whitespace-pre-line">{v.notes}</p>
                )}

                <p className="text-[10px] text-gray-400 mt-2">
                  Recorded: {tsToDate(v.createdAt)}
                </p>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
