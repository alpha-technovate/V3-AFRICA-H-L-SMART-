// src/components/history/HistorySection.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Save,
  Mic,
  Trash2,
  AlertTriangle,
} from "lucide-react";

interface PatientHistory {
  patientId: string;
  pastMedical: string;
  surgical: string;
  family: string;
  social: string;
  other: string;
  updatedAt: { seconds: number } | null;
}

const initialHistoryState: PatientHistory = {
  patientId: "",
  pastMedical: "",
  surgical: "",
  family: "",
  social: "",
  other: "",
  updatedAt: null,
};

type HistoryField = "pastMedical" | "surgical" | "family" | "social" | "other";

type VoiceTarget = "global" | HistoryField | null;

export default function HistorySection({ patientId }: { patientId: string }) {
  const [history, setHistory] = useState<PatientHistory>(initialHistoryState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [status, setStatus] = useState<string>("");
  const [statusType, setStatusType] = useState<"success" | "error" | "">("");

  // Voice state
  const [listeningTarget, setListeningTarget] = useState<VoiceTarget>(null);
  const recognitionRef = useRef<any | null>(null);

  // ------------------------------------------------
  // Helpers
  // ------------------------------------------------
  const formatDate = (timestamp: { seconds: number } | null) => {
    if (!timestamp) return "Never";
    return new Date(timestamp.seconds * 1000).toLocaleString();
  };

  const setMessage = (msg: string, type: "success" | "error" | "") => {
    setStatus(msg);
    setStatusType(type);
    if (msg) {
      setTimeout(() => {
        setStatus("");
        setStatusType("");
      }, 3500);
    }
  };

  // ------------------------------------------------
  // LOAD HISTORY
  // ------------------------------------------------
  const fetchHistory = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/history?patientId=${patientId}`);
      const json = await res.json();

      // API shape: { success, history, error }
      if (json.success && json.history) {
        setHistory({
          ...json.history,
          patientId,
        });
      } else {
        // No history yet
        setHistory((prev) => ({ ...prev, patientId }));
        if (!json.success && json.error) {
          console.error("API Error loading history:", json.error);
        }
      }
    } catch (err) {
      console.error("Fetch history failed:", err);
      setMessage("Failed to load history. Check API connection.", "error");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (!patientId) return;
    setHistory((prev) => ({ ...prev, patientId }));
    fetchHistory();
  }, [patientId, fetchHistory]);

  // ------------------------------------------------
  // SAVE HISTORY (manual global save)
  // ------------------------------------------------
  async function saveHistory() {
    if (!patientId) return;
    setSaving(true);
    setMessage("", "");

    const payload = {
      patientId,
      pastMedical: history.pastMedical,
      surgical: history.surgical,
      family: history.family,
      social: history.social,
      other: history.other,
    };

    try {
      const res = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const bodyText = await res.text().catch(() => "");
        throw new Error(
          `Save failed (HTTP ${res.status})${
            bodyText ? `: "${bodyText.slice(0, 120)}"` : ""
          }`
        );
      }

      const json = await res.json();
      if (json.success) {
        setHistory((prev) => ({
          ...prev,
          updatedAt: { seconds: Date.now() / 1000 } as any,
        }));
        setMessage("History saved globally.", "success");
      } else {
        throw new Error(json.error || "Unknown API error.");
      }
    } catch (err: any) {
      console.error("Save history error:", err);
      setMessage(
        err?.message || "An unexpected error occurred during save.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  // ------------------------------------------------
  // FIELD HANDLERS
  // ------------------------------------------------
  const handleChange = (field: HistoryField, value: string) => {
    setHistory((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const clearField = (field: HistoryField) => {
    setHistory((prev) => ({
      ...prev,
      [field]: "",
    }));
  };

  // ------------------------------------------------
  // VOICE: send transcript to /api/voice/add-history
  // ------------------------------------------------
  const applyVoiceTranscript = async (
    target: VoiceTarget,
    transcript: string
  ) => {
    if (!patientId || !transcript.trim()) return;

    try {
      setMessage("Updating from dictation…", "");

      let payload: any;

      if (target === "global") {
        // Let backend decide how to split / store it
        payload = {
          rawText: transcript,
          mode: "append",
        };
      } else if (target) {
        // Append into a specific field
        payload = {
          [target]: transcript,
          mode: "append",
        };
      } else {
        // fallback – treat as raw
        payload = {
          rawText: transcript,
          mode: "append",
        };
      }

      const res = await fetch("/api/voice/add-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, payload }),
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || "Voice history update failed.");
      }

      // Merge changed fields into local state
      if (json.history) {
        setHistory((prev) => ({
          ...prev,
          ...json.history,
          patientId,
          updatedAt: { seconds: Date.now() / 1000 } as any,
        }));
      }

      setMessage("History updated from dictation.", "success");
    } catch (err: any) {
      console.error("Voice history error:", err);
      setMessage(
        err?.message || "Could not update history from dictation.",
        "error"
      );
    }
  };

  // ------------------------------------------------
  // VOICE HANDLING (global + per-field)
  // ------------------------------------------------
  const startDictation = (target: VoiceTarget) => {
    if (typeof window === "undefined") return;

    const Speech =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;

    if (!Speech) {
      setMessage("This browser does not support voice input.", "error");
      return;
    }

    const rec = new Speech();
    rec.lang = "en-US";
    rec.interimResults = false;

    recognitionRef.current = rec;
    setListeningTarget(target);
    setMessage("", "");

    rec.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setListeningTarget(null);

      // For field dictation, also update the textarea immediately
      if (target && target !== "global") {
        setHistory((prev) => ({
          ...prev,
          [target]: (prev[target] ? prev[target] + "\n" : "") + transcript,
        }));
      }

      await applyVoiceTranscript(target, transcript);
    };

    rec.onerror = (event: any) => {
      console.error("History voice error:", event.error);
      setMessage("Voice capture failed. Please try again.", "error");
      setListeningTarget(null);
    };

    rec.onend = () => {
      setListeningTarget(null);
    };

    rec.start();
  };

  const stopDictation = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setListeningTarget(null);
  };

  // ------------------------------------------------
  // RENDER
  // ------------------------------------------------
  const listening = listeningTarget !== null;

  return (
    <Card className="p-5 md:p-6 space-y-5 shadow-md rounded-2xl bg-white/95 border border-teal-50">
      {/* Header row */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b pb-3">
        <div>
          <h2 className="text-base md:text-xl font-semibold text-teal-800">
            Structured Medical History
          </h2>
          <p className="text-[11px] md:text-xs text-slate-500">
            Capture past medical issues, surgeries, accidents, family loading,
            and social context in one place.
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Last updated:{" "}
            <span className="font-medium text-slate-600">
              {formatDate(history.updatedAt)}
            </span>
          </p>
        </div>

        <div className="flex flex-col gap-2 md:items-end">
          {/* Status + Save */}
          <div className="flex items-center gap-2">
            {status && (
              <span
                className={`text-[11px] md:text-xs flex items-center gap-1 ${
                  statusType === "success"
                    ? "text-emerald-700"
                    : statusType === "error"
                    ? "text-red-600"
                    : "text-slate-500"
                }`}
              >
                {statusType === "error" && (
                  <AlertTriangle className="w-3 h-3" />
                )}
                {status}
              </span>
            )}
            <Button
              size="sm"
              onClick={saveHistory}
              disabled={saving || loading}
              className="bg-teal-600 hover:bg-teal-700 text-xs md:text-sm"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  Save History
                </>
              )}
            </Button>
          </div>

          {/* Big global mic */}
          <button
            type="button"
            onClick={() =>
              listening && listeningTarget === "global"
                ? stopDictation()
                : startDictation("global")
            }
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium border transition
              ${
                listening && listeningTarget === "global"
                  ? "bg-red-50 border-red-200 text-red-700"
                  : "bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100"
              }`}
          >
            <Mic
              className={`w-3.5 h-3.5 ${
                listening && listeningTarget === "global"
                  ? "animate-pulse"
                  : ""
              }`}
            />
            {listening && listeningTarget === "global"
              ? "Listening (all sections)…"
              : "Dictate full history"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-10 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* TOP ROW: Past Medical + Surgical */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SectionBlock
              title="Past Medical History (PMHx)"
              subtitle="Chronic diseases, prior admissions, ICU stays, previous MI/PCI/CABG, strokes, asthma, TB, etc."
              value={history.pastMedical}
              onChange={(v) => handleChange("pastMedical", v)}
              onClear={() => clearField("pastMedical")}
              onMic={() =>
                listening && listeningTarget === "pastMedical"
                  ? stopDictation()
                  : startDictation("pastMedical")
              }
              micActive={listeningTarget === "pastMedical"}
            />

            <SectionBlock
              title="Surgical / Interventions"
              subtitle="Major/minor surgeries, procedures, devices (stents, valves, pacemaker), dates if known."
              value={history.surgical}
              onChange={(v) => handleChange("surgical", v)}
              onClear={() => clearField("surgical")}
              onMic={() =>
                listening && listeningTarget === "surgical"
                  ? stopDictation()
                  : startDictation("surgical")
              }
              micActive={listeningTarget === "surgical"}
            />
          </div>

          {/* SECOND ROW: Family + Social */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SectionBlock
              title="Family History (FHx)"
              subtitle="Premature IHD, sudden cardiac death, cardiomyopathy, diabetes, HTN, cancers, hereditary conditions."
              value={history.family}
              onChange={(v) => handleChange("family", v)}
              onClear={() => clearField("family")}
              onMic={() =>
                listening && listeningTarget === "family"
                  ? stopDictation()
                  : startDictation("family")
              }
              micActive={listeningTarget === "family"}
            />

            <SectionBlock
              title="Social History (SHx)"
              subtitle="Occupation, living situation, smoking, alcohol, recreational drugs, exercise tolerance, support system."
              value={history.social}
              onChange={(v) => handleChange("social", v)}
              onClear={() => clearField("social")}
              onMic={() =>
                listening && listeningTarget === "social"
                  ? stopDictation()
                  : startDictation("social")
              }
              micActive={listeningTarget === "social"}
            />
          </div>

          {/* OTHER */}
          <SectionBlock
            title="Other / Immunisations / Allergies / Special Notes"
            subtitle="Childhood illnesses, immunisation gaps, major accidents/trauma, travel history, red-flag information."
            value={history.other}
            onChange={(v) => handleChange("other", v)}
            onClear={() => clearField("other")}
            onMic={() =>
              listening && listeningTarget === "other"
                ? stopDictation()
                : startDictation("other")
            }
            micActive={listeningTarget === "other"}
          />
        </div>
      )}
    </Card>
  );
}

// ----------------- Reusable section block -----------------
function SectionBlock({
  title,
  subtitle,
  value,
  onChange,
  onClear,
  onMic,
  micActive,
}: {
  title: string;
  subtitle?: string;
  value: string;
  onChange: (val: string) => void;
  onClear: () => void;
  onMic: () => void;
  micActive: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 md:p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm md:text-[15px] font-semibold text-slate-900">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-[11px] md:text-[12px] text-slate-500">
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            onClick={onMic}
            className={`inline-flex items-center justify-center rounded-full border w-7 h-7 text-[11px] transition
              ${
                micActive
                  ? "bg-red-50 border-red-200 text-red-700"
                  : "bg-white border-slate-200 text-teal-700 hover:bg-teal-50"
              }`}
          >
            <Mic className={`w-3 h-3 ${micActive ? "animate-pulse" : ""}`} />
          </button>
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 text-[10px] md:text-[11px] text-slate-400 hover:text-red-500"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        </div>
      </div>

      <Textarea
        className="mt-1 min-h-[90px] md:min-h-[120px] text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Free-text clinical history. You can also dictate into this section using the small mic."
      />
    </div>
  );
}
