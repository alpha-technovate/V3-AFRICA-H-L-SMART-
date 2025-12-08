"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash, Pencil } from "lucide-react";

interface Medication {
  id: string;
  name: string;
  dose: string;
  notes?: string;
  createdAt?: any;
}

export default function MedicationsSection({ patientId }: { patientId: string }) {
  const [meds, setMeds] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [notes, setNotes] = useState("");

  // Editing
  const [editingId, setEditingId] = useState<string | null>(null);

  // ================================
  // LOAD MEDICATIONS
  // ================================
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/medications?patientId=${patientId}`);
        const json = await res.json();
        if (json.success) setMeds(json.medications);
      } catch (err) {
        console.error("Failed to load medications:", err);
        setMeds([]);
      } finally {
        setLoading(false);
      }
    }
    if (patientId) load();
  }, [patientId]);

  // ================================
  // ADD OR EDIT MEDICATION
  // ================================
  async function handleSubmit(e: React.FormEvent) {
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

        // Reload
        const reload = await fetch(`/api/medications?patientId=${patientId}`);
        const data = await reload.json();
        if (data.success) setMeds(data.medications);
      }
    } catch (err) {
      console.error("Save med error:", err);
    } finally {
      setSaving(false);
    }
  }

  // ================================
  // DELETE
  // ================================
  async function deleteMed(id: string) {
    if (!confirm("Delete this medication?")) return;

    try {
      await fetch("/api/medications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      setMeds((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error("Delete med failed:", err);
    }
  }

  // ================================
  // EDIT CLICK
  // ================================
  function startEdit(m: Medication) {
    setEditingId(m.id);
    setName(m.name);
    setDose(m.dose);
    setNotes(m.notes || "");
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-teal-700">
          Medications
        </h2>
        <Badge variant="outline">{meds.length} total</Badge>
      </div>

      {/* FORM */}
      <Card className="p-4 space-y-3 border">
        <h3 className="text-sm font-semibold text-gray-700">
          {editingId ? "Edit Medication" : "Add Medication"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            placeholder="Medication name (e.g., Amlodipine)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            placeholder="Dose (e.g., 5mg daily)"
            value={dose}
            onChange={(e) => setDose(e.target.value)}
          />

          <Textarea
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <Button type="submit" disabled={saving || !name || !dose} className="w-full">
            {saving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Saving…
              </span>
            ) : editingId ? (
              "Update Medication"
            ) : (
              "Add Medication"
            )}
          </Button>

          {/* Cancel edit */}
          {editingId && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                setEditingId(null);
                setName("");
                setDose("");
                setNotes("");
              }}
            >
              Cancel Edit
            </Button>
          )}
        </form>
      </Card>

      {/* LIST */}
      <div className="space-y-3">
        {loading && (
          <Card className="p-4 text-gray-500 text-sm">
            Loading medications…
          </Card>
        )}

        {!loading && meds.length === 0 && (
          <Card className="p-4 text-gray-500 text-sm">
            No medications recorded yet.
          </Card>
        )}

        {meds.map((m) => (
          <Card
            key={m.id}
            className="p-4 border flex flex-col gap-2 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-teal-700">{m.name}</p>
                <p className="text-sm text-gray-700">{m.dose}</p>
              </div>

              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => startEdit(m)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>

                <Button
                  size="icon"
                  variant="destructive"
                  onClick={() => deleteMed(m.id)}
                >
                  <Trash className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {m.notes && (
              <p className="text-xs text-gray-600 whitespace-pre-line">
                {m.notes}
              </p>
            )}

            {m.createdAt?.seconds && (
              <span className="text-[11px] text-gray-400">
                Added: {new Date(m.createdAt.seconds * 1000).toLocaleString()}
              </span>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
