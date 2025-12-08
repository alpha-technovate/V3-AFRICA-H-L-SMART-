// src/components/referrals/ReferralSlideOver.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, SendHorizonal, Loader2 } from "lucide-react";
import { useEffect } from "react";

interface Specialist {
  id: string;
  name: string;
  role?: string;
  contact?: string;
  imageUrl?: string | null;
}

export default function ReferralSlideOver({
  open,
  onClose,
  patientId,
  patientName,
  referringDoctorId,
}: {
  open: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  referringDoctorId: string;
}) {
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [specialistId, setSpecialistId] = useState("");
  const [reason, setReason] = useState("");
  const [clinicalSummary, setClinicalSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load specialists from Firestore
  useEffect(() => {
    if (!open) return;

    async function loadData() {
      // Set loading state for specialist list fetch, if desired
      // setLoadingSpecialists(true); 
      try {
        const res = await fetch("/api/specialists");
        const json = await res.json();
        
        // Assuming API returns { success: true, specialists: [...] }
        if (json.success && Array.isArray(json.data)) {
          setSpecialists(json.data as Specialist[]);
        } else if (json.specialists && Array.isArray(json.specialists)) {
          // Handle case where API might return 'specialists' array directly
          setSpecialists(json.specialists as Specialist[]);
        }
      } catch (err) {
        console.error("Failed to fetch specialists", err);
        // Optionally set a persistent error message here
      } finally {
        // setLoadingSpecialists(false);
      }
    }

    loadData();
  }, [open]);

  async function submitReferral() {
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!specialistId || !reason) {
      setError("Please select a specialist and enter a referral reason.");
      setLoading(false);
      return;
    }

    // Ensure referringDoctorId is not empty (though checked in parent, good to be safe)
    if (!referringDoctorId || referringDoctorId.trim() === "") {
        setError("Error: Referring Doctor ID is missing. Cannot send referral.");
        setLoading(false);
        return;
    }

    try {
      // This hits the /api/referrals POST endpoint you previously fixed
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          specialistId,
          referringDoctorId,
          reason,
          clinicalSummary, // clinicalSummary is optional here, defaults to ""
        }),
      });

      const json = await res.json();

      if (!res.ok || json.success === false) {
        // Log the detailed error from the API for debugging
        console.error("API Referral Error Response:", json);
        setError(json.error || "Failed to send referral.");
        setLoading(false);
        return;
      }

      setSuccess("Referral sent successfully!");
      
      // Clear form only on success
      setReason("");
      setClinicalSummary("");
      setSpecialistId("");

      // Close the slide-over after showing success message briefly
      setTimeout(() => {
        onClose();
      }, 900);
      
    } catch (err) {
      console.error("Referral error", err);
      setError("Network error sending referral. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`fixed inset-0 z-[999] transition ${
        open ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      {/* Background dimmer */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div
        className={`
          absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl
          transition-transform duration-300 ease-out border-l border-slate-200
          flex flex-col
          ${open ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Refer **{patientName}**
            </h2>
            <p className="text-xs text-slate-500">
              Choose a specialist & send a clinical note
            </p>
          </div>
          <button onClick={onClose} disabled={loading}>
            <X className="h-5 w-5 text-slate-500 hover:text-slate-700" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 space-y-4 overflow-y-auto">
          
          {/* Specialist selection */}
          <div>
            <label className="text-xs font-semibold text-slate-700">
              Specialist
            </label>
            <select
              value={specialistId}
              onChange={(e) => setSpecialistId(e.target.value)}
              className="w-full mt-1 h-10 border border-slate-300 rounded-md px-3 text-sm focus:ring-teal-500 focus:border-teal-500"
              disabled={loading || specialists.length === 0}
            >
              <option value="">
                {specialists.length === 0 ? 'Loading specialists...' : 'Select specialist...'}
              </option>
              {specialists.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.role || 'Specialist'}
                </option>
              ))}
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="text-xs font-semibold text-slate-700">
              Reason for referral (Required)
            </label>
            <Textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Chest pain, pleural effusion, abnormal ECG, etc."
              className="mt-1 text-sm resize-none"
              disabled={loading}
            />
          </div>

          {/* Clinical summary */}
          <div>
            <label className="text-xs font-semibold text-slate-700">
              Clinical summary (optional)
            </label>
            <Textarea
              rows={4}
              value={clinicalSummary}
              onChange={(e) => setClinicalSummary(e.target.value)}
              placeholder="Symptoms, duration, vitals, risks, differentials..."
              className="mt-1 text-sm resize-none"
              disabled={loading}
            />
          </div>

          {/* Alerts */}
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 p-2 rounded">
              {error}
            </p>
          )}

          {success && (
            <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-2 rounded">
              {success}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-200">
          <Button
            className="w-full bg-teal-600 hover:bg-teal-700 text-white text-sm"
            disabled={loading || !specialistId || !reason}
            onClick={submitReferral}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <SendHorizonal className="h-4 w-4 mr-2" />
                Send referral
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}