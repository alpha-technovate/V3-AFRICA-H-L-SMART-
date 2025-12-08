"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  Loader2,
  Plus,
  Trash2,
  Pencil,
  HeartPulse,
  Mic,
  Square,
} from "lucide-react";

import { lookupICD10, getAllICD10 } from "@/lib/icd10";

interface ChronicCondition {
  id: string;
  patientId: string;
  conditionName: string;
  diagnosisDate: string;
  status: "Active" | "Controlled" | "Remission" | "Inactive" | string;
  notes?: string;
  icd10Code?: string;
}

interface ChronicAPIResponse {
  success: boolean;
  data?: ChronicCondition[];
  error?: string;
}

const ICD10_OPTIONS = getAllICD10();
const ICD10_MAP = new Map(ICD10_OPTIONS.map((e) => [e.code, e.description]));

const statusColors: Record<string, string> = {
  Active: "bg-red-50 text-red-700 border-red-200",
  Controlled: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Remission: "bg-sky-50 text-sky-700 border-sky-200",
  Inactive: "bg-slate-50 text-slate-700 border-slate-200",
};

function prettyDate(d: string) {
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return d;
  }
}

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

function parseVoice(text: string) {
  const parts = text.split(",").map((p) => p.trim());
  const lower = text.toLowerCase();

  return {
    conditionName: parts[0] || "",
    notes: parts.slice(1).join(", "),
    status: lower.includes("remission")
      ? "Remission"
      : lower.includes("controlled") || lower.includes("stable")
      ? "Controlled"
      : lower.includes("inactive")
      ? "Inactive"
      : lower.includes("active")
      ? "Active"
      : undefined,
  };
}

export default function ChronicCard({ patientId }: { patientId: string }) {
  const [list, setList] = useState<ChronicCondition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState<ChronicCondition | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    date: "",
    status: "Active",
    notes: "",
    icd: "",
  });

  const [error, setError] = useState<string | null>(null);

  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // ----------------------------------------------------
  // LOAD
  // ----------------------------------------------------
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/chronic?patientId=${patientId}`);
      const json = await safeJson<ChronicAPIResponse>(res);
      if (json?.success) setList(json.data || []);
      else setError(json?.error || "Failed to load.");
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return () => recognitionRef.current?.stop?.();
  }, []);

  // ----------------------------------------------------
  // HANDLERS
  // ----------------------------------------------------
  function resetForm() {
    setForm({
      name: "",
      date: "",
      status: "Active",
      notes: "",
      icd: "",
    });
    setEditing(null);
    setError(null);
  }

  function openCreate() {
    resetForm();
    setIsModalOpen(true);
  }

  function openEdit(c: ChronicCondition) {
    setEditing(c);
    setForm({
      name: c.conditionName,
      date: c.diagnosisDate,
      status: c.status,
      notes: c.notes || "",
      icd: c.icd10Code || "",
    });
    setIsModalOpen(true);
  }

  // ----------------------------------------------------
  // VOICE
  // ----------------------------------------------------
  const startListen = () => {
    const Speech =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;

    if (!Speech) {
      alert("Voice not supported");
      return;
    }

    const rec = new Speech();
    rec.lang = "en-US";
    rec.interimResults = false;
    recognitionRef.current = rec;
    setListening(true);

    rec.onresult = (event: any) => {
      const parsed = parseVoice(event.results[0][0].transcript);
      setForm((p) => ({
        ...p,
        name: p.name || parsed.conditionName,
        notes: p.notes ? p.notes + "\n" + parsed.notes : parsed.notes,
        status: parsed.status || p.status,
      }));
      setIsModalOpen(true);
      setListening(false);
    };

    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
  };

  const stopListen = () => {
    recognitionRef.current?.stop?.();
    setListening(false);
  };

  // ----------------------------------------------------
  // SAVE
  // ----------------------------------------------------
  async function save() {
    if (!form.name.trim()) {
      setError("Condition name is required.");
      return;
    }

    setSaving(true);
    const resolvedICD = form.icd || lookupICD10(form.name.trim()) || null;

    const payload = {
      patientId,
      conditionName: form.name.trim(),
      diagnosisDate: form.date || new Date().toISOString().split("T")[0],
      status: form.status,
      notes: form.notes,
      icd10Code: resolvedICD,
    };

    try {
      const res = await fetch("/api/chronic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? { id: editing.id, ...payload } : payload),
      });

      const json = await safeJson<ChronicAPIResponse>(res);
      if (!json?.success) {
        setError(json?.error || "Save failed.");
        return;
      }

      setIsModalOpen(false);
      resetForm();
      load();
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  // ----------------------------------------------------
  // DELETE
  // ----------------------------------------------------
  async function remove(id: string) {
    if (!confirm("Delete this record?")) return;

    try {
      const res = await fetch("/api/chronic", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const json = await safeJson<ChronicAPIResponse>(res);
      if (!json?.success) {
        setError(json?.error || "Delete failed.");
        return;
      }

      setList((prev) => prev.filter((c) => c.id !== id));
    } catch {
      setError("Network error.");
    }
  }

  // ----------------------------------------------------
  // UI (IDENTICAL TO ALLERGIES CARD)
  // ----------------------------------------------------
  return (
    <>
      <Card className="p-4 sm:p-5 rounded-2xl border bg-white shadow-sm space-y-4">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <HeartPulse className="h-4 w-4 text-teal-600" />
              <h2 className="text-sm font-semibold text-slate-900">
                Chronic Conditions
              </h2>
            </div>
            <p className="text-[11px] text-slate-600">
              Long-term medical conditions requiring ongoing care.
            </p>
          </div>

          {/* RIGHT */}
          <div className="flex flex-row sm:flex-col items-end gap-2 sm:gap-3">
            <span className="inline-flex items-center rounded-full border bg-teal-50 border-teal-100 px-2 py-0.5 text-[11px] font-medium text-teal-700">
              {list.length === 0
                ? "No records"
                : `${list.length} record${list.length > 1 ? "s" : ""}`}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={listening ? stopListen : startListen}
                className={`inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-medium transition ${
                  listening
                    ? "bg-red-50 border-red-200 text-red-700"
                    : "bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100"
                }`}
              >
                {listening ? (
                  <>
                    <Square className="w-3 h-3 mr-1" /> Stop
                  </>
                ) : (
                  <>
                    <Mic className="w-3 h-3 mr-1" /> Chronic voice
                  </>
                )}
              </button>

              <Button
                size="sm"
                className="h-8 rounded-md bg-teal-600 text-xs text-white hover:bg-teal-700"
                onClick={openCreate}
              >
                <Plus className="mr-1 h-3 w-3" />
                Add new
              </Button>
            </div>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* LIST */}
        <div>
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : list.length === 0 ? (
            <div className="border border-dashed rounded-md bg-slate-50 px-3 py-3 text-xs text-slate-600">
              <p className="font-medium text-slate-800">No chronic conditions.</p>
              <p className="mt-1">Use “Add new” to record one.</p>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {list.map((c) => (
                <Card
                  key={c.id}
                  className="flex justify-between items-start p-3 text-xs border hover:shadow-md transition cursor-pointer"
                  onClick={() => openEdit(c)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {c.conditionName}
                      </p>

                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                          statusColors[c.status] || statusColors.Inactive
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>

                    {c.diagnosisDate && (
                      <p className="text-[11px] text-slate-600">
                        Diagnosed: {prettyDate(c.diagnosisDate)}
                      </p>
                    )}

                    {c.icd10Code && (
                      <p className="text-[11px] text-slate-700">
                        ICD-10: <strong>{c.icd10Code}</strong>{" "}
                        {ICD10_MAP.get(c.icd10Code)
                          ? `— ${ICD10_MAP.get(c.icd10Code)}`
                          : ""}
                      </p>
                    )}

                    {c.notes && (
                      <p className="text-[11px] text-slate-500 whitespace-pre-line">
                        {c.notes.length > 100 ? c.notes.slice(0, 100) + "…" : c.notes}
                      </p>
                    )}
                  </div>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(c.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* ============= MODAL ============= */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="rounded-2xl bg-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {editing ? "Edit condition" : "Add condition"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              {editing
                ? "Update this chronic condition."
                : "Record a chronic condition."}
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4 mt-2"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            {/* Condition */}
            <div>
              <label className="text-xs font-semibold">Condition *</label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                className="mt-1 text-sm"
                placeholder="e.g. Type 2 Diabetes"
              />

              {form.icd && (
                <p className="text-[10px] text-teal-700 mt-1">
                  ICD-10: <strong>{form.icd}</strong> —{" "}
                  {ICD10_MAP.get(form.icd)}
                </p>
              )}
            </div>

            {/* Date / Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold">Diagnosis date</label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, date: e.target.value }))
                  }
                  className="mt-1 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold">Status</label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, status: e.target.value }))
                  }
                  className="mt-1 h-9 w-full border rounded-md px-3 text-sm"
                >
                  <option>Active</option>
                  <option>Controlled</option>
                  <option>Remission</option>
                  <option>Inactive</option>
                </select>
              </div>
            </div>

            {/* ICD-10 */}
            <div>
              <label className="text-xs font-semibold">ICD-10 Code</label>
              <select
                value={form.icd}
                onChange={(e) => {
                  const code = e.target.value;
                  const entry = ICD10_OPTIONS.find((i) => i.code === code);
                  setForm((p) => ({
                    ...p,
                    icd: code,
                    name: entry ? entry.description : p.name,
                  }));
                }}
                className="mt-1 h-9 w-full border rounded-md px-3 text-sm"
              >
                <option value="">Auto-detect</option>
                {ICD10_OPTIONS.map((i) => (
                  <option key={i.code} value={i.code}>
                    {i.code} — {i.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold">Notes</label>

                <button
                  type="button"
                  onClick={listening ? stopListen : startListen}
                  className={`inline-flex items-center rounded-md border px-2 py-1 text-[11px] transition ${
                    listening
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100"
                  }`}
                >
                  {listening ? (
                    <>
                      <Square className="h-3 w-3 mr-1" /> Stop
                    </>
                  ) : (
                    <>
                      <Mic className="h-3 w-3 mr-1" /> Notes voice
                    </>
                  )}
                </button>
              </div>

              <Textarea
                rows={3}
                value={form.notes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, notes: e.target.value }))
                }
                className="mt-1 text-sm"
              />
            </div>

            {/* Footer */}
            <DialogFooter className="mt-2 flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="text-xs"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={saving}
                className="bg-teal-600 hover:bg-teal-700 text-xs text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Saving…
                  </>
                ) : editing ? (
                  "Update"
                ) : (
                  "Save"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
