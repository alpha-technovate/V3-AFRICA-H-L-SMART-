// src/components/patients/ReferToSpecialistButton.tsx
"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Share2 } from "lucide-react";

interface Specialist {
  id: string;
  name: string;
  specialty?: string;
  email?: string;
}

interface ReferToSpecialistButtonProps {
  patientId: string;
  patientName?: string;
  // optional: let you pass extra classes to the trigger button
  className?: string;
}

export default function ReferToSpecialistButton({
  patientId,
  patientName,
  className,
}: ReferToSpecialistButtonProps) {
  const [open, setOpen] = useState(false);

  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loadingSpecialists, setLoadingSpecialists] = useState(false);

  const [selectedSpecialistId, setSelectedSpecialistId] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load specialists when dropdown first opens
  useEffect(() => {
    if (!open || specialists.length > 0) return;

    async function loadSpecialists() {
      setLoadingSpecialists(true);
      setError(null);
      try {
        // 🔹 Change this to your actual endpoint that returns doctor users
        // Expected response: { success: true, data: Specialist[] }
        const res = await fetch("/api/specialists");
        const json = await res.json();

        if (json.success && Array.isArray(json.data)) {
          setSpecialists(json.data as Specialist[]);
        } else {
          setError(json.error || "Failed to load specialists.");
        }
      } catch (err) {
        console.error("Failed to fetch specialists:", err);
        setError("Network error loading specialists.");
      } finally {
        setLoadingSpecialists(false);
      }
    }

    loadSpecialists();
  }, [open, specialists.length]);

  async function sendReferral() {
    if (!selectedSpecialistId) return;

    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      // 🔹 Change this to match your referrals API
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
        console.error("Referral failed:", json.error);
        setError(json.error || "Failed to create referral.");
        return;
      }

      setSuccess("Referral sent successfully.");
      setNote("");
    } catch (err) {
      console.error("Referral error:", err);
      setError("Network error sending referral.");
    } finally {
      setSending(false);
    }
  }

  function closePanel() {
    setOpen(false);
    setError(null);
    setSuccess(null);
    // don’t reset selection automatically; up to you
  }

  return (
    <div className="relative inline-block text-left">
      {/* This is your "Share" trigger button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen((o) => !o)}
        className={`text-xs md:text-sm border-teal-100 text-slate-700 hover:bg-teal-50 flex items-center gap-1 ${className || ""}`}
      >
        <Share2 className="h-4 w-4" />
        <span>Share / Refer</span>
      </Button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 sm:w-96">
          <Card className="p-4 shadow-lg border border-slate-200 bg-white rounded-xl space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-slate-800">
                  Refer patient
                </p>
                {patientName && (
                  <p className="text-[11px] text-slate-500 truncate">
                    {patientName}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-[11px] px-2 h-7"
                onClick={closePanel}
              >
                Close
              </Button>
            </div>

            {/* Specialist select */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Select specialist
              </label>

              {loadingSpecialists ? (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Loading specialists…</span>
                </div>
              ) : specialists.length === 0 ? (
                <p className="text-[11px] text-slate-500">
                  No specialists found. Make sure doctor users are configured /
                  exposed via /api/specialists.
                </p>
              ) : (
                <select
                  className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
                  value={selectedSpecialistId}
                  onChange={(e) => setSelectedSpecialistId(e.target.value)}
                >
                  <option value="">Select a specialist…</option>
                  {specialists.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name}
                      {doc.specialty ? ` — ${doc.specialty}` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Optional note */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Note to specialist (optional)
              </label>
              <Textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Reason for referral, key findings, urgency…"
                className="text-sm border-slate-200"
              />
            </div>

            {/* Status */}
            {error && (
              <p className="text-[11px] text-red-600 bg-red-50 border border-red-100 rounded px-2 py-1">
                {error}
              </p>
            )}
            {success && (
              <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-2 py-1">
                {success}
              </p>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                onClick={closePanel}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-8 bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60"
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
