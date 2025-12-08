"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

interface Medication {
  id: string;
  name: string;
  dose?: string;
  frequency?: string;
  createdAt?: { seconds: number; nanoseconds: number };
}

export default function MedicationsSection({ patientId }: { patientId: string }) {
  const [meds, setMeds] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [frequency, setFrequency] = useState("");

  useEffect(() => {
    if (!patientId) return;

    const q = query(
      collection(db, `patients/${patientId}/medications`),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows: Medication[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
        setMeds(rows);
        setLoading(false);
      },
      (err) => {
        console.error("Meds snapshot error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [patientId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId || !name.trim()) return;

    try {
      await addDoc(collection(db, `patients/${patientId}/medications`), {
        name: name.trim(),
        dose: dose || "",
        frequency: frequency || "",
        createdAt: serverTimestamp(),
      });

      setName("");
      setDose("");
      setFrequency("");
    } catch (err) {
      console.error("Add medication error:", err);
    }
  }

  async function handleDelete(id: string) {
    if (!patientId) return;
    try {
      await deleteDoc(doc(db, `patients/${patientId}/medications`, id));
    } catch (err) {
      console.error("Delete med error:", err);
    }
  }

  async function handleEditDose(med: Medication) {
    if (!patientId) return;
    const newDose = window.prompt("Update dose", med.dose || "");
    if (newDose === null) return;
    try {
      await updateDoc(doc(db, `patients/${patientId}/medications`, med.id), {
        dose: newDose,
      });
    } catch (err) {
      console.error("Update med dose error:", err);
    }
  }

  return (
    <Card className="p-4 space-y-4">
      <h2 className="text-lg font-semibold text-teal-700">Medications</h2>

      {/* Add form */}
      <form
        onSubmit={handleAdd}
        className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end"
      >
        <div>
          <label className="text-xs text-gray-600">Name</label>
          <Input
            placeholder="Amlodipine"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-gray-600">Dose</label>
          <Input
            placeholder="5 mg"
            value={dose}
            onChange={(e) => setDose(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-gray-600">Frequency</label>
          <Input
            placeholder="daily / bd / tds"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" className="self-end">
            Add
          </Button>
        </div>
      </form>

      {/* List */}
      {loading && (
        <p className="text-sm text-gray-500">Loading medications…</p>
      )}

      {!loading && meds.length === 0 && (
        <p className="text-sm text-gray-500">No medications added.</p>
      )}

      <div className="space-y-2">
        {meds.map((m) => (
          <div
            key={m.id}
            className="border rounded-md p-2 flex items-start justify-between text-sm"
          >
            <div>
              <p className="font-semibold">{m.name}</p>
              {m.dose && <p>Dose: {m.dose}</p>}
              {m.frequency && <p>Frequency: {m.frequency}</p>}
              {m.createdAt?.seconds && (
                <p className="text-[11px] text-gray-400 mt-1">
                  {new Date(m.createdAt.seconds * 1000).toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <Button
                variant="outline"
                size="sm"
                type="button"
                className="text-xs"
                onClick={() => handleEditDose(m)}
              >
                Edit dose
              </Button>
              <Button
                variant="outline"
                size="sm"
                type="button"
                className="text-xs text-red-600"
                onClick={() => handleDelete(m.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
