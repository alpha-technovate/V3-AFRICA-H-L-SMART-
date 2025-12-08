"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Zap,
  Mic,
  Square,
  Plus,
  Trash2,
  Loader2,
  XCircle,
} from "lucide-react";

import type { Allergy } from "@/lib/types";
import { ALLERGY_CATALOG, findAllergyByName } from "@/lib/allergies";

const severityColors: Record<string, string> = {
  "Life-Threatening": "bg-red-50 text-red-700 border-red-200",
  Severe: "bg-orange-50 text-orange-700 border-orange-200",
  Moderate: "bg-amber-50 text-amber-700 border-amber-200",
  Mild: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Unknown: "bg-slate-50 text-slate-700 border-slate-200",
};

export default function AllergiesCard({ patientId }: { patientId: string }) {
  const [list, setList] = useState<Allergy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Allergy | null>(null);

  const [allergen, setAllergen] = useState("");
  const [type, setType] = useState<Allergy["type"]>("Drug");
  const [severity, setSeverity] = useState<Allergy["severity"]>("Moderate");
  const [reaction, setReaction] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);

  const [listeningCommand, setListeningCommand] = useState(false);
  const [listeningNotes, setListeningNotes] = useState(false);
  const recognitionRef = useRef<any>(null);

  // ======================================================
  // LOAD
  // ======================================================
  const loadAllergies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/allergies?patientId=${patientId}`);
      const json = await res.json();

      if (json.success) setList(json.data || []);
      else setError(json.error || "Failed to load allergies.");
    } catch {
      setError("Network error loading allergies.");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadAllergies();
  }, [loadAllergies]);

  // ======================================================
  // FORM HELPERS
  // ======================================================
  const resetForm = () => {
    setAllergen("");
    setType("Drug");
    setSeverity("Moderate");
    setReaction("");
    setNotes("");
    setAutoFilled(false);
    setError(null);
  };

  const openCreate = () => {
    resetForm();
    setEditing(null);
    setIsModalOpen(true);
  };

  const openEdit = (a: Allergy) => {
    setEditing(a);
    setAllergen(a.allergen);
    setType(a.type);
    setSeverity(a.severity);
    setReaction(a.reaction || "");
    setNotes(a.notes || "");
    setIsModalOpen(true);
  };

  const handleAllergenInput = (value: string) => {
    setAllergen(value);
    setAutoFilled(false);

    const match = findAllergyByName(value);
    if (!match) return;

    setType(match.type);
    setSeverity(match.severityHint);
    setReaction(match.commonReactions.join(", "));
    setNotes(match.notes || "");
    setAutoFilled(true);
  };

  // ======================================================
  // SAVE
  // ======================================================
  const save = async (e: any) => {
    e.preventDefault();
    if (!allergen.trim()) {
      setError("Allergen name is required.");
      return;
    }

    setSaving(true);

    try {
      const body: any = {
        patientId,
        allergen: allergen.trim(),
        type,
        severity,
        reaction,
        notes,
      };
      if (editing?.id) body.id = editing.id;

      const res = await fetch("/api/allergies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Save failed.");

      setIsModalOpen(false);
      loadAllergies();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ======================================================
  // DELETE
  // ======================================================
  const remove = async (id: string) => {
    try {
      const res = await fetch("/api/allergies", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Delete failed.");

      setList((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ======================================================
  // UI
  // ======================================================
  return (
    <>
      <Card className="w-full rounded-2xl border bg-white shadow-sm p-4 sm:p-5 space-y-4">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-teal-600" />
              <h2 className="text-sm font-semibold text-slate-900">Allergies</h2>
            </div>
            <p className="text-[11px] text-slate-600">
              Record drug, food and environmental allergies clearly for safety.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className="inline-flex items-center rounded-full border bg-teal-50 border-teal-100 px-2 py-0.5 text-[11px] font-medium text-teal-700">
              {list.length === 0
                ? "No records"
                : `${list.length} record${list.length > 1 ? "s" : ""}`}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setListeningCommand(!listeningCommand)}
                className={`inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-medium transition ${
                  listeningCommand
                    ? "bg-red-50 border-red-200 text-red-700"
                    : "bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100"
                }`}
              >
                {listeningCommand ? (
                  <>
                    <Square className="h-3 w-3 mr-1" /> Stop
                  </>
                ) : (
                  <>
                    <Mic className="h-3 w-3 mr-1" /> Allergy voice
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
            <XCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {/* LIST */}
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading allergies…
          </div>
        ) : list.length === 0 ? (
          <div className="border border-dashed rounded-md bg-slate-50 px-3 py-3 text-xs text-slate-600">
            <p className="font-medium text-slate-800">No documented allergies.</p>
            <p className="mt-1">Use “Add new” to record allergy details.</p>
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto pr-1 space-y-2 scrollbar-thin">
            {list.map((a) => (
              <Card
                key={a.id}
                className="flex justify-between items-start rounded-xl border p-3 text-xs hover:shadow-md transition cursor-pointer"
                onClick={() => openEdit(a)}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-900">
                      {a.allergen}
                    </p>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                        severityColors[a.severity] || severityColors.Unknown
                      }`}
                    >
                      {a.severity}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-700">
                    <span className="font-medium">Reaction:</span>{" "}
                    {a.reaction || "Not specified"}
                  </p>

                  {a.notes && (
                    <p className="text-[11px] text-slate-500 whitespace-pre-line">
                      {a.notes.length > 70 ? a.notes.slice(0, 70) + "…" : a.notes}
                    </p>
                  )}
                </div>

                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(a.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="rounded-2xl bg-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {editing ? "Edit allergy" : "Add allergy"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              {editing
                ? "Update this allergy record."
                : "Record a new drug, food or environmental allergy."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={save} className="space-y-4 mt-2">

            {/* Allergen */}
            <div>
              <label className="text-xs font-semibold">Allergen *</label>
              <Input
                list="allergen-catalog"
                value={allergen}
                onChange={(e) => handleAllergenInput(e.target.value)}
                className="mt-1 text-sm"
                placeholder="e.g. Penicillin"
              />
              <datalist id="allergen-catalog">
                {ALLERGY_CATALOG.map((item) => (
                  <option key={item.id} value={item.name} />
                ))}
              </datalist>
              {autoFilled && (
                <p className="text-[10px] text-emerald-700 mt-1">
                  Auto-filled from knowledge base.
                </p>
              )}
            </div>

            {/* Type / Severity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="mt-1 h-9 w-full rounded-md border px-3 text-sm"
                >
                  <option>Drug</option>
                  <option>Food</option>
                  <option>Environmental</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold">Severity</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="mt-1 h-9 w-full rounded-md border px-3 text-sm"
                >
                  <option>Mild</option>
                  <option>Moderate</option>
                  <option>Severe</option>
                  <option>Life-Threatening</option>
                </select>
              </div>
            </div>

            {/* Reaction */}
            <div>
              <label className="text-xs font-semibold">Typical Reaction</label>
              <Input
                value={reaction}
                onChange={(e) => setReaction(e.target.value)}
                className="mt-1 text-sm"
                placeholder="e.g. Rash, swelling, wheeze"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold flex items-center justify-between">
                Notes
                <button
                  type="button"
                  onClick={() => setListeningNotes(!listeningNotes)}
                  className={`inline-flex items-center rounded-md border px-2 py-1 text-[11px] transition ${
                    listeningNotes
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100"
                  }`}
                >
                  {listeningNotes ? (
                    <>
                      <Square className="h-3 w-3 mr-1" /> Stop
                    </>
                  ) : (
                    <>
                      <Mic className="h-3 w-3 mr-1" /> Notes voice
                    </>
                  )}
                </button>
              </label>

              <Textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 text-sm"
                placeholder="Extra clinical notes…"
              />
            </div>

            <DialogFooter className="mt-2 flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="text-xs"
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
                  "Update allergy"
                ) : (
                  "Save allergy"
                )}
              </Button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
