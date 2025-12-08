"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Share2, X } from "lucide-react";

interface Specialist {
  id: string;
  name: string;
  specialty?: string;
}

interface ReferToSpecialistButtonProps {
  patientId: string;
  patientName?: string;
  className?: string;
}

export default function ReferToSpecialistButton({
  patientId,
  patientName,
  className,
}: ReferToSpecialistButtonProps) {
  const [open, setOpen] = useState(false);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSpecialistId, setSelectedSpecialistId] = useState("");
  const [note, setNote] = useState("");

  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{
    type: "error" | "success" | null;
    message: string | null;
  }>({ type: null, message: null });

  useEffect(() => {
    if (!open || specialists.length > 0) return;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/specialists");
        const json = await res.json();
        if (json.success) {
          setSpecialists(json.data);
        } else {
          setStatus({ type: "error", message: json.error });
        }
      } catch {
        setStatus({
          type: "error",
          message: "Could not load specialists.",
        });
      }
      setLoading(false);
    }
    load();
  }, [open, specialists.length]);

  async function sendReferral() {
    if (!selectedSpecialistId) return;

    setSending(true);
    setStatus({ type: null, message: null });

    try {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          specialistId: selectedSpecialistId,
          note,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        setStatus({ type: "error", message: json.error });
        return;
      }

      setStatus({
        type: "success",
        message: "Referral sent successfully.",
      });

      setNote("");
      setSelectedSpecialistId("");
    } catch {
      setStatus({
        type: "error",
        message: "Network error while sending referral.",
      });
    }

    setSending(false);
  }

  function closePanel() {
    setOpen(false);
    setStatus({ type: null, message: null });
  }

  return (
    <div className="relative inline-block">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setOpen(true)}
        className={`h-8 w-8 border-teal-200 text-slate-700 hover:bg-teal-50 ${className || ""}`}
      >
        <Share2 className="h-4 w-4" />
      </Button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-96">
          <Card className="p-4 shadow-lg border border-slate-200 bg-white rounded-xl space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Refer Patient
                </h3>
                {patientName && (
                  <p className="text-[11px] text-slate-500">{patientName}</p>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-400 hover:text-slate-600"
                onClick={closePanel}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Specialist List */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Select Specialist
              </label>

              {loading ? (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading…
                </div>
              ) : specialists.length === 0 ? (
                <p className="text-[11px] text-slate-500">
                  No specialists found.
                </p>
              ) : (
                <select
                  className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-900 focus:ring-2 focus:ring-teal-600"
                  value={selectedSpecialistId}
                  onChange={(e) => setSelectedSpecialistId(e.target.value)}
                >
                  <option value="">Choose a specialist…</option>
                  {specialists.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name}
                      {doc.specialty ? ` — ${doc.specialty}` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Note */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Note (optional)
              </label>
              <Textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Reason for referral, findings, urgency…"
                className="text-sm border-slate-300"
              />
            </div>

            {/* Status */}
            {status.type === "error" && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
                {status.message}
              </p>
            )}
            {status.type === "success" && (
              <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-1">
                {status.message}
              </p>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                className="h-8 text-sm"
                onClick={closePanel}
              >
                Cancel
              </Button>
              <Button
                className="h-8 text-sm bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
                disabled={!selectedSpecialistId || sending}
                onClick={sendReferral}
              >
                {sending ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    Sending…
                  </>
                ) : (
                  "Send referral"
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
