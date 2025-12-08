"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Trash2, Pencil, Pill } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Medication {
  id: string;
  name: string;
  dose: string;
  notes?: string;
  createdAt?: any;
}

export default function MedicationsCard({ patientId }: { patientId: string }) {
  const [meds, setMeds] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [notes, setNotes] = useState("");

  // LOAD MEDICATIONS
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/medications?patientId=${patientId}`);
        const json = await res.json();
        if (json.success) setMeds(json.medications);
      } catch (err) {
        console.error("Load meds error:", err);
        setMeds([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [patientId]);

  // ADD / EDIT MEDICATION
  async function saveMed(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !dose) return;

    setSaving(true);

    try {
      const res = await fetch("/api/medications", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          patientId,
          name,
          dose,
          notes,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setName("");
        setDose("");
        setNotes("");
        setEditingId(null);
        setShowForm(false);

        const reload = await fetch(`/api/medications?patientId=${patientId}`);
        const data = await reload.json();
        if (data.success) setMeds(data.medications);
      }
    } catch {
      console.error("Save error");
    } finally {
      setSaving(false);
    }
  }

  async function deleteMed(id: string) {
    if (!confirm("Delete this medication?")) return;

    try {
      await fetch("/api/medications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      setMeds((prev) => prev.filter((m) => m.id !== id));
    } catch {
      console.error("Delete error");
    }
  }

  function startEdit(m: Medication) {
    setEditingId(m.id);
    setName(m.name);
    setDose(m.dose);
    setNotes(m.notes || "");
    setShowForm(true);
  }

  const countLabel =
    meds.length === 0 ? "No records" : `${meds.length} item${meds.length > 1 ? "s" : ""}`;

  return (
    <Card className="p-4 sm:p-5 rounded-2xl border bg-white shadow-sm space-y-4">
      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <Pill className="h-4 w-4 text-teal-600" />
            <h2 className="text-sm font-semibold text-slate-900">
              Medications
            </h2>
          </div>
          <p className="text-[11px] text-slate-600 mt-1">
            Track current prescriptions and treatment history.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className="text-[11px] font-medium border bg-teal-50 border-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
            {countLabel}
          </span>

          <Button
            size="sm"
            className="h-8 bg-teal-600 text-white text-xs hover:bg-teal-700"
            onClick={() => {
              if (showForm && !editingId) {
                setShowForm(false);
                setName("");
                setDose("");
                setNotes("");
              } else {
                setShowForm(true);
              }
            }}
          >
            {editingId ? "Edit Medication" : "Add Medication"}
          </Button>
        </div>
      </div>

      {/* FORM */}
      {showForm && (
        <div className="border bg-white p-4 rounded-xl shadow-sm space-y-3">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-slate-700">
              {editingId ? "Edit Medication" : "Add Medication"}
            </span>
            {editingId && (
              <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[11px]">
                Editing record
              </span>
            )}
          </div>

          <form onSubmit={saveMed} className="space-y-3">
            <div>
              <label className="text-xs font-semibold">Medication</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Amlodipine"
                className="mt-1 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold">Dose</label>
              <Input
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                placeholder="5mg daily"
                className="mt-1 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold">Notes</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Instructions, follow-up, side effects..."
                className="mt-1 min-h-[70px] text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  className="text-xs"
                  onClick={() => {
                    setEditingId(null);
                    setName("");
                    setDose("");
                    setNotes("");
                    setShowForm(false);
                  }}
                >
                  Cancel
                </Button>
              )}

              <Button
                type="submit"
                disabled={!name || !dose || saving}
                className="text-xs bg-teal-600 hover:bg-teal-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving…
                  </>
                ) : editingId ? (
                  "Update"
                ) : (
                  "Add"
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* LIST */}
      <div>
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading medications…
          </div>
        ) : meds.length === 0 ? (
          <div className="border border-dashed bg-slate-50 text-xs p-3 rounded-md text-slate-600">
            <p className="font-semibold text-slate-800">No medications recorded.</p>
            <p className="mt-1">Use “Add Medication” to begin documenting treatments.</p>
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {meds.map((m) => (
              <Card
                key={m.id}
                className={`p-3 rounded-md border shadow-sm text-xs flex justify-between items-start hover:shadow-md transition ${
                  editingId === m.id ? "border-teal-500 bg-teal-50/60" : "border-slate-200"
                }`}
              >
                <div className="space-y-1 pr-2">
                  <p className="text-sm font-semibold">{m.name}</p>
                  <p className="text-[11px] text-slate-700">{m.dose}</p>

                  {m.notes && (
                    <p className="text-[11px] text-slate-500 whitespace-pre-line">
                      {m.notes.length > 80 ? m.notes.slice(0, 80) + "…" : m.notes}
                    </p>
                  )}

                  {m.createdAt?.seconds && (
                    <span className="text-[11px] text-slate-400">
                      Added: {new Date(m.createdAt.seconds * 1000).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-slate-400 hover:text-teal-700 hover:bg-teal-50"
                    onClick={() => startEdit(m)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                    onClick={() => deleteMed(m.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
