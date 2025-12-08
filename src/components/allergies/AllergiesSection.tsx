"use client";

import React, { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

import {
  Loader2,
  Plus,
  Trash2,
  Pencil,
  Mic,
  Square,
  Zap,   // allergy icon
} from "lucide-react";

interface Allergy {
  id: string;
  condition: string;
  reaction: string;
  category?: string;
  severity: string;
  notes?: string;
  createdAt?: string;
}

export default function AllergiesCard({ patientId }: { patientId: string }) {
  const [list, setList] = useState<Allergy[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // edit state
  const [editingId, setEditingId] = useState<string | null>(null);

  // form fields
  const [condition, setCondition] = useState("");
  const [reaction, setReaction] = useState("");
  const [category, setCategory] = useState("Drug");
  const [severity, setSeverity] = useState("Moderate");
  const [notes, setNotes] = useState("");

  // voice state
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // ------------ LOAD -------------
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/allergies?patientId=${patientId}`);
        const json = await res.json();
        setList(json.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [patientId]);

  // ------------ VOICE INPUT -------------
  const startListening = () => {
    const Speech =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;
    if (!Speech) return alert("Voice not supported.");

    const rec = new Speech();
    rec.lang = "en-US";
    rec.interimResults = false;

    recognitionRef.current = rec;
    setListening(true);

    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;

      // simple auto-fill
      setCondition(text);
      setShowForm(true);
      setListening(false);
    };

    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);

    rec.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop?.();
    setListening(false);
  };

  // ------------ SAVE -------------
  async function save() {
    if (!condition.trim()) return;

    setSaving(true);

    const payload = {
      patientId,
      condition,
      reaction,
      category,
      severity,
      notes,
    };

    const method = editingId ? "PUT" : "POST";

    const res = await fetch("/api/allergies", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
    });

    const json = await res.json();
    if (json.success) {
      const reload = await fetch(`/api/allergies?patientId=${patientId}`).then(
        (r) => r.json()
      );
      setList(reload.data || []);

      // reset form
      setCondition("");
      setReaction("");
      setCategory("Drug");
      setSeverity("Moderate");
      setNotes("");
      setEditingId(null);
      setShowForm(false);
    }

    setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm("Delete allergy?")) return;

    await fetch("/api/allergies", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, patientId }),
    });

    setList((prev) => prev.filter((a) => a.id !== id));
  }

  function beginEdit(a: Allergy) {
    setEditingId(a.id);
    setCondition(a.condition);
    setReaction(a.reaction);
    setCategory(a.category || "Drug");
    setSeverity(a.severity);
    setNotes(a.notes || "");
    setShowForm(true);
  }

  const countLabel =
    list.length === 0 ? "No records" : `${list.length} record${list.length > 1 ? "s" : ""}`;

  // ------------ UI -------------
  return (
    <Card className="p-5 rounded-2xl border bg-white shadow-sm space-y-4">

      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-teal-600" />
            <h2 className="text-sm font-semibold">Allergies</h2>
          </div>
          <p className="text-[11px] text-slate-600 mt-1">
            Record drug, food, and environmental allergies clearly for safety.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className="text-[11px] font-medium border bg-teal-50 border-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
            {countLabel}
          </span>

          <div className="flex items-center gap-2">
            <Button
              size="icon"
              onClick={startListening}
              disabled={listening}
              className={`h-8 w-8 ${
                listening ? "bg-teal-500/50" : "bg-teal-600 hover:bg-teal-700"
              }`}
            >
              <Mic className="h-4 w-4 text-white" />
            </Button>

            <Button
              size="icon"
              variant="outline"
              disabled={!listening}
              onClick={stopListening}
              className="h-8 w-8 border-slate-300 text-slate-700"
            >
              <Square className="h-4 w-4" />
            </Button>

            <Button
              size="sm"
              className="h-8 bg-teal-600 hover:bg-teal-700 text-white text-xs"
              onClick={() => setShowForm((v) => !v)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add new
            </Button>
          </div>
        </div>
      </div>

      {/* FORM */}
      {showForm && (
        <div className="border bg-white p-4 rounded-xl shadow-sm space-y-3">

          <div className="flex justify-between text-xs">
            <span className="font-semibold text-slate-700">
              {editingId ? "Edit Allergy" : "Add Allergy"}
            </span>

            {editingId && (
              <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[11px]">
                Editing
              </span>
            )}
          </div>

          <div className="space-y-3">

            <div>
              <label className="text-xs font-semibold">Allergen *</label>
              <Input
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                placeholder="Amoxicillin"
                className="mt-1 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold">Reaction</label>
              <Input
                value={reaction}
                onChange={(e) => setReaction(e.target.value)}
                placeholder="Rash, swelling, urticaria"
                className="mt-1 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold">Severity</label>
              <select
                className="mt-1 h-9 border rounded-md px-3 text-sm"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
              >
                <option>Mild</option>
                <option>Moderate</option>
                <option>Severe</option>
                <option>Anaphylaxis</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold">Notes</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 min-h-[70px] text-sm"
                placeholder="Clinical notes…"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            {editingId && (
              <Button
                variant="outline"
                className="text-xs"
                onClick={() => {
                  setEditingId(null);
                  setShowForm(false);
                }}
              >
                Cancel
              </Button>
            )}

            <Button
              className="bg-teal-600 hover:bg-teal-700 text-xs"
              disabled={!condition.trim() || saving}
              onClick={save}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : editingId ? (
                <>
                  <Pencil className="h-4 w-4 mr-2" />
                  Update
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </>
              )}
            </Button>
          </div>

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
          <div className="border border-dashed bg-slate-50 text-xs p-3 rounded-md text-slate-600">
            No allergies recorded.
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {list.map((a) => (
              <Card
                key={a.id}
                className="p-3 rounded-md border shadow-sm text-xs flex justify-between items-start hover:shadow-md transition border-slate-200"
              >
                <div className="space-y-1 pr-2">

                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold">{a.condition}</p>

                    <Badge className="bg-amber-50 text-amber-700 border border-amber-200">
                      {a.severity}
                    </Badge>
                  </div>

                  <p className="text-[11px] text-slate-600">
                    Reaction: {a.reaction}
                  </p>

                  {a.notes && (
                    <p className="text-[11px] text-slate-500">
                      {a.notes.length > 80 ? a.notes.slice(0, 80) + "…" : a.notes}
                    </p>
                  )}
                </div>

                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-slate-400 hover:text-teal-700 hover:bg-teal-50"
                    onClick={() => beginEdit(a)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                    onClick={() => remove(a.id)}
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
