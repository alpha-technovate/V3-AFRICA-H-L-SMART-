// src/components/chronic/ChronicSection.tsx
"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { lookupICD10, getAllICD10, ICD10Entry } from "@/lib/icd10";

interface ChronicCondition {
  id: string;
  conditionName: string;
  diagnosisDate?: string;
  status?: string;
  notes?: string;
  icd10Code?: string;
}

// Load once at module level – static JSON
const ICD10_OPTIONS: ICD10Entry[] = getAllICD10();
const ICD10_MAP = new Map<string, string>(
  ICD10_OPTIONS.map((e) => [e.code, e.description])
);

export default function ChronicSection({ patientId }: { patientId: string }) {
  const [items, setItems] = useState<ChronicCondition[]>([]);
  const [loading, setLoading] = useState(true);

  // --- form state ---
  const [conditionName, setConditionName] = useState("");
  const [icd10Code, setIcd10Code] = useState<string>("");
  const [diagnosisDate, setDiagnosisDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [status, setStatus] = useState("Active");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // derived: selected ICD entry for the form
  const selectedIcd = ICD10_OPTIONS.find((i) => i.code === icd10Code);

  // ------------------------------------------------
  // LOAD CHRONIC CONDITIONS
  // ------------------------------------------------
  async function load() {
    if (!patientId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/chronic?patientId=${patientId}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setItems(json.data);
      }
    } catch (e) {
      console.error("Failed to load chronic", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [patientId]);

  // ------------------------------------------------
  // SAVE (uses icd10Code + lookupICD10)
  // ------------------------------------------------
  async function handleSave() {
    if (!patientId) return;

    if (!conditionName && !icd10Code) {
      setError("Please enter a condition or select an ICD-10 code.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/chronic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          conditionName,
          icd10Code: icd10Code || lookupICD10(conditionName) || null,
          diagnosisDate,
          status,
          notes,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Failed to save chronic condition.");
      }

      // reset a bit
      setConditionName("");
      setIcd10Code("");
      setNotes("");
      setDiagnosisDate(new Date().toISOString().split("T")[0]);

      await load();
    } catch (err: any) {
      console.error("Save chronic error", err);
      setError(err?.message || "Unexpected error while saving.");
    } finally {
      setSaving(false);
    }
  }

  // ------------------------------------------------
  // DELETE
  // ------------------------------------------------
  async function handleDelete(id: string) {
    if (!id) return;

    const ok = window.confirm(
      "Remove this chronic condition from the record?"
    );
    if (!ok) return;

    setDeletingId(id);
    try {
      const res = await fetch("/api/chronic", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Failed to delete chronic condition.");
      }

      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      console.error("Delete chronic error", err);
      alert(err?.message || "Unexpected error while deleting.");
    } finally {
      setDeletingId(null);
    }
  }

  // ------------------------------------------------
  // RENDER
  // ------------------------------------------------
  return (
    <Card className="p-4 space-y-4">
      <h2 className="text-lg font-semibold text-teal-800">
        Chronic Conditions
      </h2>

      {/* LIST */}
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">
          No chronic conditions recorded yet.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((c) => {
            const desc =
              c.icd10Code ? ICD10_MAP.get(c.icd10Code) : null;
            return (
              <div
                key={c.id}
                className="border rounded-md px-3 py-2 bg-slate-50/60 flex flex-col gap-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">
                      {c.conditionName}
                    </span>
                    <div className="text-[11px] text-slate-500 flex gap-2 flex-wrap">
                      <span>Dx: {c.diagnosisDate || "Unknown"}</span>
                      {c.icd10Code && (
                        <span className="text-[11px] text-slate-600">
                          ICD-10:{" "}
                          <span className="font-semibold">
                            {c.icd10Code}
                          </span>
                          {desc ? ` — ${desc}` : null}
                        </span>
                      )}
                    </div>
                    {c.notes && (
                      <span className="text-[11px] text-slate-500 line-clamp-1">
                        {c.notes}
                      </span>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="text-[11px] px-2 py-1 border-red-200 text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(c.id)}
                    disabled={deletingId === c.id}
                  >
                    {deletingId === c.id ? "Removing…" : "Delete"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FORM */}
      <Card className="p-3.5 space-y-3 border-teal-100 bg-white/90">
        <h3 className="text-sm font-semibold text-slate-900">
          Add chronic condition
        </h3>

        {/* Condition name + selected ICD label */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">
            Condition name
          </label>
          <Input
            value={conditionName}
            onChange={(e) => setConditionName(e.target.value)}
            placeholder="e.g. Type 2 Diabetes Mellitus"
            className="h-9 text-sm"
          />
          {selectedIcd && (
            <p className="text-[11px] text-teal-700">
              Selected ICD-10:{" "}
              <span className="font-semibold">
                {selectedIcd.code}
              </span>{" "}
              — {selectedIcd.description}
            </p>
          )}
        </div>

        {/* Diagnosis date + Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">
              Diagnosis date
            </label>
            <Input
              type="date"
              value={diagnosisDate}
              onChange={(e) => setDiagnosisDate(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            >
              <option>Active</option>
              <option>Controlled</option>
              <option>Remission</option>
              <option>Resolved</option>
            </select>
          </div>
        </div>

        {/* ICD-10 DROPDOWN (from JSON) */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">
            ICD-10 code
          </label>
          <select
            value={icd10Code}
            onChange={(e) => setIcd10Code(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">Auto from name / voice</option>
            {ICD10_OPTIONS.map((item) => (
              <option key={item.code} value={item.code}>
                {item.code} — {item.description}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-slate-500">
            If left blank, I’ll try to infer from the condition name or voice text using lookupICD10().
          </p>
        </div>

        {/* Notes */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">
            Notes
          </label>
          <Textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="text-sm"
            placeholder="Control, complications, treatments, follow-up, etc."
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          {error && <p className="text-xs text-red-600">{error}</p>}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-teal-600 hover:bg-teal-700 text-xs md:text-sm"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
                Saving…
              </>
            ) : (
              "Add condition"
            )}
          </Button>
        </div>
      </Card>
    </Card>
  );
}
