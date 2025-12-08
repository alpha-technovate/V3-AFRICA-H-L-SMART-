"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
  Activity,
  Loader2,
  Plus,
  Mic,
  Square,
  Trash2,
  Pencil,
} from "lucide-react";

interface LevelOfCareRecord {
  id: string;
  patientId: string;
  locType: string;
  locDescription: string;
  startDate: string; // YYYY-MM-DD string
  isActive: boolean;
}

interface LOCResponse {
  success: boolean;
  data?: LevelOfCareRecord[];
  error?: string;
}

// LOC types (Option A)
const LOC_TYPES = [
  "Acute",
  "Chronic",
  "Palliative",
  "ICU",
  "General Ward",
  "Home Care",
  "Observation",
  "Other",
];

async function safeJson<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    console.error("Invalid JSON:", text);
    return null;
  }
}

// Voice parser
function parseVoice(text: string) {
  const lower = text.toLowerCase();
  let detectedType = LOC_TYPES.find((type) =>
    lower.includes(type.toLowerCase())
  );

  return {
    locType: detectedType || "",
    locDescription: text.trim(),
    isActive:
      lower.includes("active") ||
      lower.includes("current") ||
      lower.includes("ongoing"),
  };
}

export default function LevelOfCareCard({ patientId }: { patientId: string }) {
  const [list, setList] = useState<LevelOfCareRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  const [loc, setLoc] = useState({
    locType: "",
    locDescription: "",
    isActive: true,
    startDate: "",
  });

  const [error, setError] = useState<string | null>(null);

  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // --------------------------------------------
  // LOAD LOC RECORDS
  // --------------------------------------------
  const load = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch(`/api/levelofcare?patientId=${patientId}`);
      const json = await safeJson<LOCResponse>(res);

      if (json?.success && Array.isArray(json.data)) {
        setList(json.data);
      } else {
        setError(json?.error || "Failed to load Level of Care.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    load();
  }, [load]);

  // --------------------------------------------
  // START EDIT
  // --------------------------------------------
  function beginEdit(record: LevelOfCareRecord) {
    setEditing(record.id);
    setLoc({
      locType: record.locType,
      locDescription: record.locDescription,
      isActive: record.isActive,
      startDate: record.startDate,
    });
    setShowForm(true);
  }

  // --------------------------------------------
  // VOICE INPUT
  // --------------------------------------------
  function startVoice() {
    const Speech =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;

    if (!Speech) {
      alert("Speech recognition not supported.");
      return;
    }

    const rec = new Speech();
    rec.lang = "en-US";
    rec.interimResults = false;

    setListening(true);
    recognitionRef.current = rec;

    rec.onresult = (e: any) => {
      const parsed = parseVoice(e.results[0][0].transcript);

      setLoc((p) => ({
        ...p,
        locType: p.locType || parsed.locType,
        locDescription: parsed.locDescription || p.locDescription,
        isActive: parsed.isActive ?? p.isActive,
        startDate: p.startDate || new Date().toISOString().split("T")[0],
      }));

      setShowForm(true);
      setListening(false);
    };

    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);

    rec.start();
  }

  function stopVoice() {
    recognitionRef.current?.stop?.();
    setListening(false);
  }

  // --------------------------------------------
  // SAVE
  // --------------------------------------------
  async function save() {
    if (!loc.locType.trim()) return setError("Level of Care type required.");
    if (!loc.startDate.trim())
      return setError("Start date is required (auto-set).");

    setSaving(true);
    setError(null);

    const body: any = {
      patientId,
      locType: loc.locType,
      locDescription: loc.locDescription,
      startDate: loc.startDate,
      isActive: loc.isActive,
    };

    if (editing) body.id = editing;

    try {
      const res = await fetch("/api/levelofcare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await safeJson<LOCResponse>(res);
      if (!json?.success) return setError(json?.error || "Save failed.");

      setEditing(null);
      setShowForm(false);

      setLoc({
        locType: "",
        locDescription: "",
        isActive: true,
        startDate: "",
      });

      load();
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  // --------------------------------------------
  // DELETE
  // --------------------------------------------
  async function remove(id: string) {
    if (!confirm("Delete this record?")) return;

    try {
      const res = await fetch("/api/levelofcare", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, patientId }),
      });

      const json = await safeJson<LOCResponse>(res);

      if (!json?.success) return setError(json?.error || "Delete failed.");
      setList((prev) => prev.filter((i) => i.id !== id));
    } catch {
      setError("Network error.");
    }
  }

  // --------------------------------------------
  // UI
  // --------------------------------------------
  return (
    <Card className="rounded-2xl border bg-white p-4 sm:p-5 shadow-sm space-y-4">

      {/* HEADER */}
      <div className="flex justify-between items-start gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-teal-600" />
            <h2 className="text-sm font-semibold">Level of Care</h2>
          </div>
          <p className="text-[11px] text-slate-600">
            Current and past levels of care.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] text-teal-700 border border-teal-100">
            {list.length === 0
              ? "No records"
              : `${list.length} record${list.length > 1 ? "s" : ""}`}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={listening ? stopVoice : startVoice}
              className={`inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-medium transition
                ${
                  listening
                    ? "bg-red-50 border-red-200 text-red-700"
                    : "bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100"
                }`}
            >
              {listening ? (
                <>
                  <Square className="h-3 w-3 mr-1" /> Stop
                </>
              ) : (
                <>
                  <Mic className="h-3 w-3 mr-1" /> LOC voice
                </>
              )}
            </button>

            <Button
              size="sm"
              className="h-8 bg-teal-600 text-xs text-white hover:bg-teal-700"
              onClick={() => {
                setEditing(null);
                setLoc({
                  locType: "",
                  locDescription: "",
                  isActive: true,
                  startDate: new Date().toISOString().split("T")[0],
                });
                setShowForm(true);
              }}
            >
              <Plus className="h-3 w-3 mr-1" /> Add new
            </Button>
          </div>
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* FORM */}
      {showForm && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">

          <div className="text-xs font-semibold">
            {editing ? "Edit Level of Care" : "Add Level of Care"}
          </div>

          {/* LOC Type */}
          <div>
            <label className="text-xs font-semibold">Level of Care *</label>
            <select
              value={loc.locType}
              onChange={(e) =>
                setLoc((p) => ({ ...p, locType: e.target.value }))
              }
              className="mt-1 w-full h-10 rounded-md border px-3 text-sm"
            >
              <option value="">Choose type…</option>
              {LOC_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold">Description</label>
            <Textarea
              rows={3}
              value={loc.locDescription}
              onChange={(e) =>
                setLoc((p) => ({ ...p, locDescription: e.target.value }))
              }
              className="mt-1 text-sm"
            />
          </div>

          {/* Active */}
          <div>
            <label className="text-xs font-semibold">Status</label>
            <select
              value={loc.isActive ? "Active" : "Past"}
              onChange={(e) =>
                setLoc((p) => ({ ...p, isActive: e.target.value === "Active" }))
              }
              className="mt-1 w-full h-10 rounded-md border px-3 text-sm"
            >
              <option>Active</option>
              <option>Past</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="text-xs font-semibold">Start Date</label>
            <Input
              type="date"
              value={loc.startDate}
              onChange={(e) =>
                setLoc((p) => ({ ...p, startDate: e.target.value }))
              }
              className="mt-1 text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            {editing && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
              >
                Cancel
              </Button>
            )}

            <Button
              size="sm"
              disabled={saving || !loc.locType.trim()}
              onClick={save}
              className="bg-teal-600 hover:bg-teal-700 text-xs text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1" /> Saving…
                </>
              ) : editing ? (
                "Update"
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* LIST */}
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-600">
          No Level of Care recorded.
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto space-y-2 pr-1 scrollbar-thin">

          {list.map((i) => (
            <Card
              key={i.id}
              className="rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm hover:shadow-md transition cursor-pointer flex justify-between items-start gap-3"
              onClick={() => beginEdit(i)}
            >
              <div className="space-y-1 text-xs flex-1">
                <p className="text-sm font-semibold text-slate-900">{i.locType}</p>

                <p className="text-[11px] text-slate-600">
                  Since: {i.startDate}
                </p>

                <p className="text-[11px] text-slate-500 whitespace-pre-line">
                  {i.locDescription.length > 100
                    ? i.locDescription.slice(0, 100) + "…"
                    : i.locDescription}
                </p>

                <p
                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    i.isActive
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-50 text-slate-600 border-slate-200"
                  }`}
                >
                  {i.isActive ? "Active" : "Past"}
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-slate-400 hover:text-teal-700 hover:bg-teal-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    beginEdit(i);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(i.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}

        </div>
      )}
    </Card>
  );
}
