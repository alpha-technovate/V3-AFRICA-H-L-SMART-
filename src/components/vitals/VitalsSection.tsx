// src/components/vitals/VitalsSection.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  TrendingUp,
  Heart,
  Save,
  AlertTriangle,
  Mic,
  Square,
} from "lucide-react";

interface VitalsRecord {
  id: string;
  patientId: string;
  systolic?: number;
  diastolic?: number;
  heartRate?: number;
  respiratoryRate?: number;
  temperature?: number;
  spo2?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  notes?: string;
  createdAt: { seconds: number };
}

const initialNewVitalsState = {
  systolic: undefined as number | undefined,
  diastolic: undefined as number | undefined,
  heartRate: undefined as number | undefined,
  temperature: undefined as number | undefined,
  spo2: undefined as number | undefined,
  weight: undefined as number | undefined,
  notes: "",
};

type NewVitalsState = typeof initialNewVitalsState;

// Refresh every 1 hour
const REFRESH_INTERVAL_MS = 60 * 60 * 1000;

export default function VitalsSection({ patientId }: { patientId: string }) {
  const [vitalsHistory, setVitalsHistory] = useState<VitalsRecord[]>([]);
  const [latestVitals, setLatestVitals] = useState<VitalsRecord | null>(null);
  const [newVitalsInput, setNewVitalsInput] =
    useState<NewVitalsState>(initialNewVitalsState);

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  // Voice state for Notes
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any | null>(null);

  // -------------------------------
  // Helpers
  // -------------------------------
  const formatDate = (timestamp: { seconds: number }) => {
    return new Date(timestamp.seconds * 1000).toLocaleString();
  };

  const formatTimeShort = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // -------------------------------
  // LOAD VITALS (history + latest)
  // -------------------------------
  const fetchVitals = useCallback(async () => {
    if (!patientId) return;

    try {
      setLoading(true);
      setError(null);

      const [historyRes, latestRes] = await Promise.all([
        fetch(`/api/vitals?patientId=${patientId}`),
        fetch(`/api/vitals?patientId=${patientId}&latest=true`),
      ]);

      const historyJson = await historyRes.json();
      const latestJson = await latestRes.json();

      if (historyJson.success && Array.isArray(historyJson.data)) {
        setVitalsHistory(historyJson.data as VitalsRecord[]);
      } else {
        console.warn("Vitals history API error:", historyJson.error);
      }

      if (latestJson.success && latestJson.data) {
        const latestData = latestJson.data as VitalsRecord;
        setLatestVitals(latestData);

        // PRESET FORM FROM LAST RECORD
        setNewVitalsInput({
          systolic: latestData.systolic,
          diastolic: latestData.diastolic,
          heartRate: latestData.heartRate,
          temperature: latestData.temperature,
          spo2: latestData.spo2,
          weight: latestData.weight,
          notes: latestData.notes || "",
        });
      } else {
        setLatestVitals(null);
        setNewVitalsInput(initialNewVitalsState);
      }
    } catch (err) {
      console.error("Failed to load Vitals:", err);
      setError("Failed to load vitals. Check API connection.");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  // Initial load + hourly refresh
  useEffect(() => {
    if (!patientId) return;
    fetchVitals();

    const id = setInterval(() => {
      fetchVitals();
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(id);
  }, [patientId, fetchVitals]);

  // -------------------------------
  // SAVE (manual, NOT auto)
  // -------------------------------
  const saveVitals = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const data = newVitalsInput;

      const body = {
        patientId,
        systolic: data.systolic ?? undefined,
        diastolic: data.diastolic ?? undefined,
        heartRate: data.heartRate ?? undefined,
        temperature: data.temperature ?? undefined,
        spo2: data.spo2 ?? undefined,
        weight: data.weight ?? undefined,
        notes: data.notes?.trim() || undefined,
      };

      const hasAnyValue = Object.values(body).some(
        (v) => v !== undefined && v !== null && v !== ""
      );

      if (!hasAnyValue) {
        setError("Please enter at least one vital before saving.");
        setIsSaving(false);
        return;
      }

      const res = await fetch("/api/vitals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          `Save failed (HTTP ${res.status})${
            text ? `: "${text.slice(0, 120)}"` : ""
          }`
        );
      }

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || "Failed to save vitals.");
      }

      setLastSavedAt(formatTimeShort(new Date()));
      fetchVitals();
    } catch (err: any) {
      console.error("Save Vitals Error:", err);
      setError(err.message || "Failed to save vitals.");
    } finally {
      setIsSaving(false);
    }
  };

  // -------------------------------
  // Voice for NOTES
  // -------------------------------
  const startNotesVoice = () => {
    if (typeof window === "undefined") return;

    const Speech =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;

    if (!Speech) {
      setError("This browser does not support voice input.");
      return;
    }

    const rec = new Speech();
    rec.lang = "en-US";
    rec.interimResults = false;

    recognitionRef.current = rec;
    setListening(true);
    setError(null);

    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;

      setNewVitalsInput((prev) => ({
        ...prev,
        notes: (prev.notes ? prev.notes + " " : "") + transcript,
      }));

      setListening(false);
    };

    rec.onerror = (event: any) => {
      console.error("Vitals voice error:", event.error);
      setError("Voice input failed. Please try again.");
      setListening(false);
    };

    rec.onend = () => {
      setListening(false);
    };

    rec.start();
  };

  const stopNotesVoice = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setListening(false);
  };

  // -------------------------------
  // Input handlers
  // -------------------------------
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewVitalsInput((prev) => ({
      ...prev,
      [name]:
        name === "notes"
          ? value
          : value === ""
          ? undefined
          : Number.isNaN(parseFloat(value))
          ? undefined
          : parseFloat(value),
    }));
  };

  // -------------------------------
  // Small metric card
  // -------------------------------
  const MetricCard = ({
    title,
    value,
    unit,
    icon: Icon,
  }: {
    title: string;
    value: any;
    unit: string;
    icon: any;
  }) => (
    <Card className="rounded-xl border border-slate-100 bg-white/90 shadow-sm px-3 py-3 sm:px-4 sm:py-4 flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-[11px] sm:text-xs font-medium text-slate-500 uppercase tracking-wide">
          {title}
        </p>
        <p className="text-lg sm:text-xl md:text-2xl font-semibold text-slate-900">
          {value ?? "N/A"}
          {value != null && value !== "" && (
            <span className="text-[11px] sm:text-xs md:text-sm font-normal ml-1 text-slate-500">
              {unit}
            </span>
          )}
        </p>
      </div>
      <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-teal-50">
        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 opacity-80" />
      </div>
    </Card>
  );

  const SaveStatus = () => (
    <div className="flex items-center gap-2 text-[11px] md:text-xs">
      {isSaving && (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
          <span className="text-teal-700">Saving vitals…</span>
        </>
      )}
      {!isSaving && error && (
        <>
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="text-red-600">{error}</span>
        </>
      )}
      {!isSaving && !error && lastSavedAt && (
        <>
          <Save className="w-4 h-4 text-emerald-600" />
          <span className="text-emerald-700">
            Saved at <span className="font-semibold">{lastSavedAt}</span>
          </span>
        </>
      )}
    </div>
  );

  // -------------------------------
  // RENDER
  // -------------------------------
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header + summary strip */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base sm:text-lg md:text-xl font-semibold text-slate-900 flex items-center gap-2">
          <span className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-teal-50 border border-teal-100">
            <Heart className="w-4 h-4 text-teal-600" />
          </span>
          Vitals Monitoring
        </h2>
        <span className="text-[10px] sm:text-[11px] text-slate-400">
          Auto-refreshes every hour
        </span>
      </div>

      {/* LATEST SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Heart Rate"
          value={latestVitals?.heartRate}
          unit="bpm"
          icon={Heart}
        />
        <MetricCard
          title="Blood Pressure"
          value={
            latestVitals?.systolic && latestVitals?.diastolic
              ? `${latestVitals.systolic}/${latestVitals.diastolic}`
              : null
          }
          unit="mmHg"
          icon={TrendingUp}
        />
        <MetricCard
          title="Temperature"
          value={latestVitals?.temperature}
          unit="°C"
          icon={TrendingUp}
        />
        <MetricCard
          title="SpO₂"
          value={latestVitals?.spo2}
          unit="%"
          icon={TrendingUp}
        />
      </div>

      {/* FORM */}
      <Card className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm sm:shadow-md px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div className="space-y-1">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-slate-900">
              Record New Vitals
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500">
              Prefilled from the last reading. Update fields and click{" "}
              <span className="font-semibold">Save Vitals</span>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <SaveStatus />
            <button
              type="button"
              onClick={listening ? stopNotesVoice : startNotesVoice}
              className={`inline-flex items-center justify-center rounded-full border px-3 py-1.5 text-[11px] sm:text-xs font-medium transition
                ${
                  listening
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100"
                }`}
            >
              {listening ? (
                <>
                  <Square className="w-3 h-3 mr-1" />
                  Stop voice
                </>
              ) : (
                <>
                  <Mic className="w-3 h-3 mr-1" />
                  Notes by voice
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4">
          {/* BP */}
          <div className="space-y-1.5">
            <Label
              htmlFor="systolic"
              className="text-[11px] sm:text-xs font-medium text-slate-700"
            >
              Blood Pressure (mmHg)
            </Label>
            <div className="flex gap-2">
              <Input
                id="systolic"
                name="systolic"
                type="number"
                value={newVitalsInput.systolic ?? ""}
                onChange={handleInputChange}
                placeholder="Sys"
                className="w-1/2 text-sm"
              />
              <Input
                id="diastolic"
                name="diastolic"
                type="number"
                value={newVitalsInput.diastolic ?? ""}
                onChange={handleInputChange}
                placeholder="Dia"
                className="w-1/2 text-sm"
              />
            </div>
          </div>

          {/* HR */}
          <div className="space-y-1.5">
            <Label
              htmlFor="heartRate"
              className="text-[11px] sm:text-xs font-medium text-slate-700"
            >
              Heart Rate (bpm)
            </Label>
            <Input
              id="heartRate"
              name="heartRate"
              type="number"
              value={newVitalsInput.heartRate ?? ""}
              onChange={handleInputChange}
              className="text-sm"
            />
          </div>

          {/* Temp */}
          <div className="space-y-1.5">
            <Label
              htmlFor="temperature"
              className="text-[11px] sm:text-xs font-medium text-slate-700"
            >
              Temperature (°C)
            </Label>
            <Input
              id="temperature"
              name="temperature"
              type="number"
              step="0.1"
              value={newVitalsInput.temperature ?? ""}
              onChange={handleInputChange}
              className="text-sm"
            />
          </div>

          {/* SpO2 */}
          <div className="space-y-1.5">
            <Label
              htmlFor="spo2"
              className="text-[11px] sm:text-xs font-medium text-slate-700"
            >
              SpO₂ (%)
            </Label>
            <Input
              id="spo2"
              name="spo2"
              type="number"
              value={newVitalsInput.spo2 ?? ""}
              onChange={handleInputChange}
              className="text-sm"
            />
          </div>

          {/* Weight */}
          <div className="space-y-1.5">
            <Label
              htmlFor="weight"
              className="text-[11px] sm:text-xs font-medium text-slate-700"
            >
              Weight (kg)
            </Label>
            <Input
              id="weight"
              name="weight"
              type="number"
              value={newVitalsInput.weight ?? ""}
              onChange={handleInputChange}
              className="text-sm"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <Label
            htmlFor="notes"
            className="text-[11px] sm:text-xs font-medium text-slate-700"
          >
            Notes
          </Label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            value={newVitalsInput.notes ?? ""}
            onChange={handleInputChange}
            className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
            placeholder="Add any context (position, oxygen, symptoms, etc.)… Or tap Notes by voice."
          />
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={saveVitals}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 disabled:opacity-60"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Vitals
          </button>
        </div>
      </Card>

      {/* HISTORY */}
      <Card className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm sm:shadow-md px-4 py-4 sm:px-5 sm:py-5">
        <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-3 border-b border-slate-100 pb-2 text-slate-900">
          Vitals History{" "}
          <span className="text-[11px] sm:text-xs text-slate-400">
            ({vitalsHistory.length} records)
          </span>
        </h3>

        {loading && !vitalsHistory.length ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
          </div>
        ) : vitalsHistory.length > 0 ? (
          <div className="overflow-x-auto overflow-y-auto max-h-64 md:max-h-80 rounded-xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-200 text-xs md:text-sm">
              <thead className="bg-slate-50/80 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-[11px] tracking-wide text-slate-500 uppercase">
                    Time
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-[11px] tracking-wide text-slate-500 uppercase">
                    HR
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-[11px] tracking-wide text-slate-500 uppercase">
                    BP
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-[11px] tracking-wide text-slate-500 uppercase">
                    Temp
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-[11px] tracking-wide text-slate-500 uppercase">
                    SpO₂
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-[11px] tracking-wide text-slate-500 uppercase">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {vitalsHistory.map((v) => (
                  <tr key={v.id}>
                    <td className="px-4 py-2 whitespace-nowrap text-slate-900">
                      {formatDate(v.createdAt)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-slate-600">
                      {v.heartRate ?? "—"}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-slate-600">
                      {v.systolic && v.diastolic
                        ? `${v.systolic}/${v.diastolic}`
                        : "—"}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-slate-600">
                      {v.temperature ?? "—"}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-slate-600">
                      {v.spo2 ?? "—"}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-slate-600">
                      {v.notes?.substring(0, 40) || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs sm:text-sm text-slate-500">
            No vital sign records found yet.
          </p>
        )}
      </Card>
    </div>
  );
}
