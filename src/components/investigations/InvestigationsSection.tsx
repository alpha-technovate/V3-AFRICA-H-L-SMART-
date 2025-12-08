// src/components/investigations/InvestigationsSection.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2, Pencil, Mic, Square } from "lucide-react";

// ---------- Types ----------

type FirestoreTimestampLike =
  | {
      seconds?: number;
      nanoseconds?: number;
      toDate?: () => Date;
    }
  | Date
  | string
  | null
  | undefined;

interface Investigation {
  id: string;
  patientId: string;
  doctorId: string;
  type: "Lab" | "Imaging" | "Procedure" | string;
  details: string | null;
  status: "Ordered" | "Pending" | "Complete" | "Cancelled" | string;
  results?: string | null;
  orderDate?: FirestoreTimestampLike;
  [key: string]: any;
}

interface InvestigationFormState {
  type: Investigation["type"];
  details: string;
  results: string;
  status: Investigation["status"];
  doctorId: string;
}

const initialInvestigationState: InvestigationFormState = {
  type: "Lab",
  details: "",
  results: "",
  status: "Ordered",
  doctorId: "DOC_CURRENT_USER", // placeholder for current doctor
};

// ---------- Date helpers (safe) ----------

function resolveDate(input: FirestoreTimestampLike): Date | null {
  if (!input) return null;

  try {
    if (typeof input === "object" && typeof (input as any).toDate === "function") {
      return (input as any).toDate();
    }

    if (typeof input === "object" && typeof (input as any).seconds === "number") {
      return new Date((input as any).seconds * 1000);
    }

    if (input instanceof Date) {
      return input;
    }

    if (typeof input === "string") {
      const d = new Date(input);
      if (!isNaN(d.getTime())) return d;
    }

    return null;
  } catch (e) {
    console.error("resolveDate error:", e, "value:", input);
    return null;
  }
}

function formatDate(input: FirestoreTimestampLike): string {
  const d = resolveDate(input);
  if (!d) return "";
  return d.toLocaleString();
}

function getSecondsForSort(input: FirestoreTimestampLike): number {
  const d = resolveDate(input);
  if (!d) return 0;
  return d.getTime() / 1000;
}

// ---------- Voice parsing ----------

function parseVoiceToInvestigation(
  transcript: string
): Partial<Investigation> {
  const lower = transcript.toLowerCase();
  const updates: Partial<Investigation> = {};

  // Type detection
  if (
    lower.includes("blood") ||
    lower.includes("lab") ||
    lower.includes("fbc") ||
    lower.includes("full blood") ||
    lower.includes("cbc")
  ) {
    updates.type = "Lab";
  } else if (
    lower.includes("x-ray") ||
    lower.includes("xray") ||
    lower.includes("scan") ||
    lower.includes("ct") ||
    lower.includes("mri") ||
    lower.includes("imaging")
  ) {
    updates.type = "Imaging";
  } else if (
    lower.includes("procedure") ||
    lower.includes("biopsy") ||
    lower.includes("endoscopy") ||
    lower.includes("colonoscopy")
  ) {
    updates.type = "Procedure";
  }

  // Status detection
  if (lower.includes("complete") || lower.includes("result available")) {
    updates.status = "Complete";
  } else if (lower.includes("pending")) {
    updates.status = "Pending";
  } else if (lower.includes("cancelled") || lower.includes("canceled")) {
    updates.status = "Cancelled";
  } else if (lower.includes("ordered") || lower.includes("request")) {
    updates.status = "Ordered";
  }

  // Split into [details, results]
  const parts = transcript.split(",").map((p) => p.trim());
  if (parts[0]) {
    updates.details = parts[0];
  }
  if (parts.length > 1) {
    updates.results = parts.slice(1).join(", ");
  }

  return updates;
}

// ---------- Component ----------

export default function InvestigationsSection({ patientId }: { patientId: string }) {
  const [list, setList] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formState, setFormState] = useState<InvestigationFormState>(
    initialInvestigationState
  );
  const [error, setError] = useState<string | null>(null);

  // Tabs: all / pending / completed
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "complete">(
    "all"
  );

  // Track which order is being marked complete
  const [completingId, setCompletingId] = useState<string | null>(null);

  // Voice
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // ---------- Load investigations ----------

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/investigations?patientId=${patientId}`);
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        const data = json.data as Investigation[];

        const sortedList = [...data].sort((a, b) => {
          const aSec = getSecondsForSort(a.orderDate);
          const bSec = getSecondsForSort(b.orderDate);
          return bSec - aSec;
        });

        setList(sortedList);
      } else {
        console.error("API Error loading investigations:", json.error);
        setError(json.error || "Failed to load investigations.");
      }
    } catch (err) {
      console.error("Failed to fetch investigations:", err);
      setError("Network error loading investigations.");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [patientId]);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // ---------- Voice handlers ----------

  const startListening = () => {
    if (typeof window === "undefined") return;

    const Speech =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;

    if (!Speech) {
      const msg = "Your browser does not support speech recognition.";
      setError(msg);
      alert(msg);
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }

    const rec = new Speech();
    rec.lang = "en-US";
    rec.interimResults = false;

    setListening(true);
    recognitionRef.current = rec;

    rec.onresult = (event: any) => {
      try {
        const transcript: string =
          event?.results?.[0]?.[0]?.transcript || "";
        setListening(false);
        setError(null);

        if (!transcript) return;

        const parsed = parseVoiceToInvestigation(transcript);

        setFormState((prev) => ({
          ...prev,
          type: (parsed.type as Investigation["type"]) || prev.type,
          status:
            (parsed.status as Investigation["status"]) || prev.status,
          details: parsed.details ?? prev.details ?? "",
          results: parsed.results ?? prev.results ?? "",
        }));
      } catch (e) {
        console.error("Speech onresult error:", e);
        setError("Something went wrong handling the voice result.");
        setListening(false);
      }
    };

    rec.onerror = (event: any) => {
      console.error("Speech error event:", event);
      const code = event?.error as string | undefined;
      let message = "Voice input failed. Please try again.";

      if (code === "not-allowed") {
        message =
          "Microphone permission was denied. Please allow access and try again.";
      } else if (code === "no-speech") {
        message = "No speech detected. Please speak clearly and try again.";
      } else if (code === "audio-capture") {
        message = "No microphone detected. Please check your audio device.";
      } else if (code === "aborted") {
        message = "Voice capture was interrupted.";
      } else if (!code) {
        message = "Unknown speech error occurred.";
      }

      setError(message);
      setListening(false);
    };

    rec.onend = () => {
      setListening(false);
    };

    try {
      rec.start();
    } catch (e) {
      console.error("Failed to start speech recognition:", e);
      setError("Unable to start voice input.");
      setListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setListening(false);
  };

  // ---------- CRUD ----------

  function clearForm() {
    setFormState(initialInvestigationState);
    setEditingId(null);
  }

  function edit(investigation: Investigation) {
    setEditingId(investigation.id);
    setFormState({
      type: (investigation.type as Investigation["type"]) || "Lab",
      details: investigation.details ?? "",
      results: investigation.results ?? "",
      status: (investigation.status as Investigation["status"]) || "Ordered",
      doctorId: investigation.doctorId || "DOC_CURRENT_USER",
    });
  }

  async function save() {
    setSaving(true);
    setError(null);

    const payload = {
      patientId,
      ...formState,
      doctorId: formState.doctorId || "DOC_CURRENT_USER",
    };

    try {
      const url = "/api/investigations";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      });

      const json = await res.json();
      if (!json.success) {
        console.error("Save failed:", json.error);
        setError(json.error || "Save failed.");
        alert(`Save Failed: ${json.error || "Unknown error"}`);
        return;
      }

      clearForm();
      load();
    } catch (err) {
      console.error("Save failed:", err);
      setError("Save failed due to a network or server error.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Are you sure you want to delete this investigation order?"))
      return;

    setError(null);

    try {
      await fetch("/api/investigations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      setList((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
      setError("Delete failed due to a network or server error.");
    }
  }

  // 🔥 Mark as complete (quick action on the card)
  async function markAsComplete(id: string) {
    setCompletingId(id);
    setError(null);

    try {
      const res = await fetch("/api/investigations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "Complete" }),
      });

      const json = await res.json();
      if (!json.success) {
        console.error("Mark complete failed:", json.error);
        setError(json.error || "Failed to mark as complete.");
        return;
      }

      // Refresh or optimistic update
      setList((prev) =>
        prev.map((inv) =>
          inv.id === id ? { ...inv, status: "Complete" } : inv
        )
      );
    } catch (err) {
      console.error("Mark complete failed:", err);
      setError("Failed to mark as complete due to network/server error.");
    } finally {
      setCompletingId(null);
    }
  }

  // ---------- Filtering for tabs ----------

  const filteredList = list.filter((inv) => {
    if (activeTab === "all") return true;
    const s = (inv.status || "").toLowerCase();
    if (activeTab === "pending") {
      return s === "ordered" || s === "pending";
    }
    if (activeTab === "complete") {
      return s === "complete";
    }
    return true;
  });

  // ---------- UI ----------

  return (
    <div className="space-y-6">
      {/* Header + Voice controls */}
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-2xl font-semibold text-teal-700">
          Investigation Orders
        </h2>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="icon"
            onClick={startListening}
            disabled={listening || saving}
            className={`h-8 w-8 flex-shrink-0 ${
              listening
                ? "bg-teal-500/60 hover:bg-teal-500/60 cursor-not-allowed"
                : "bg-teal-600 hover:bg-teal-700"
            }`}
          >
            <Mic className="h-3.5 w-3.5 text-white" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={stopListening}
            disabled={!listening}
            className="h-8 w-8 flex-shrink-0 border-slate-300 text-slate-700 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
          >
            <Square className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Listening / Error banners */}
      {listening && (
        <div className="flex items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-xs text-teal-800">
          <Mic className="h-4 w-4" />
          <span className="font-medium">
            Listening… describe the investigation, status, and any results.
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <span className="font-medium">Error:</span>
          <span>{error}</span>
        </div>
      )}

      {/* NEW ORDER / EDIT FORM CARD */}
      <Card className="p-6 space-y-4 shadow-md">
        <h3 className="text-xl font-semibold border-b pb-2">
          {editingId
            ? `Edit Results for Order ${editingId.substring(0, 5)}...`
            : "Place New Investigation Order"}
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* TYPE SELECT */}
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            value={formState.type || "Lab"}
            onChange={(e) =>
              setFormState((p) => ({
                ...p,
                type: (e.target.value as Investigation["type"]) || "Lab",
              }))
            }
            disabled={!!editingId}
          >
            <option value="Lab">Lab Work (Bloods, Urinalysis)</option>
            <option value="Imaging">Imaging (X-ray, CT, MRI)</option>
            <option value="Procedure">Procedure (Endoscopy, Biopsy)</option>
          </select>

          {/* STATUS SELECT */}
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            value={formState.status || "Ordered"}
            onChange={(e) =>
              setFormState((p) => ({
                ...p,
                status: (e.target.value as Investigation["status"]) || "Ordered",
              }))
            }
          >
            <option value="Ordered">Ordered (Waiting for patient)</option>
            <option value="Pending">Pending (Specimen/Scan done)</option>
            <option value="Complete">Complete (Results available)</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {/* DETAILS */}
        <Input
          placeholder="Specific Test Details (e.g., Full Blood Count, Brain MRI)"
          value={formState.details ?? ""}
          onChange={(e) =>
            setFormState((p) => ({ ...p, details: e.target.value }))
          }
          disabled={!!editingId}
        />

        {/* RESULTS (only when editing) */}
        {editingId && (
          <Textarea
            placeholder="Interpretation or summary of results..."
            value={formState.results ?? ""}
            onChange={(e) =>
              setFormState((p) => ({ ...p, results: e.target.value }))
            }
            rows={4}
          />
        )}

        <div className="flex justify-end gap-3 pt-2">
          {editingId && (
            <Button variant="outline" onClick={clearForm}>
              Cancel Edit
            </Button>
          )}
          <Button
            disabled={!formState.details.trim() || saving}
            onClick={save}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Saving…
              </>
            ) : editingId ? (
              "Save Results Update"
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Place Order
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* INVESTIGATION HISTORY LIST WITH TABS */}
      <Card className="p-6 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-semibold border-b pb-2 flex-1">
            Order History
          </h3>

          {/* Tabs */}
          <div className="flex gap-2 text-xs ml-4">
            <Button
              variant={activeTab === "all" ? "default" : "outline"}
              size="sm"
              className="h-7 px-3"
              onClick={() => setActiveTab("all")}
            >
              All
            </Button>
            <Button
              variant={activeTab === "pending" ? "default" : "outline"}
              size="sm"
              className="h-7 px-3"
              onClick={() => setActiveTab("pending")}
            >
              Pending
            </Button>
            <Button
              variant={activeTab === "complete" ? "default" : "outline"}
              size="sm"
              className="h-7 px-3"
              onClick={() => setActiveTab("complete")}
            >
              Completed
            </Button>
          </div>
        </div>

        {loading ? (
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-500" />
        ) : filteredList.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No investigation orders found for this view.
          </p>
        ) : (
          <div className="space-y-3">
            {filteredList.map((inv) => {
              const statusLower = (inv.status || "").toLowerCase();
              const isComplete = statusLower === "complete";
              const isCancelled = statusLower === "cancelled";

              return (
                <Card
                  key={inv.id}
                  className="p-4 bg-gray-50 border flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  {/* Left Content */}
                  <div className="flex-1 space-y-1">
                    <p className="font-semibold text-lg">
                      {inv.details || "Unnamed investigation"}
                    </p>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                        statusLower === "complete"
                          ? "bg-green-100 text-green-700"
                          : statusLower === "pending" ||
                            statusLower === "ordered"
                          ? "bg-yellow-100 text-yellow-700"
                          : statusLower === "cancelled"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {inv.type} • {inv.status}
                    </span>
                    <p className="text-xs text-gray-500 pt-1">
                      Ordered: {formatDate(inv.orderDate)}
                    </p>

                    {inv.results && (
                      <div className="mt-2 p-2 border-l-4 border-teal-500 bg-white shadow-inner text-sm italic">
                        Results:{" "}
                        {inv.results.length > 100
                          ? inv.results.substring(0, 100).trimEnd() + "…"
                          : inv.results}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 self-end sm:self-auto">
                    {/* Quick complete button */}
                    {!isComplete && !isCancelled && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAsComplete(inv.id)}
                        disabled={completingId === inv.id}
                      >
                        {completingId === inv.id ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                            Completing…
                          </>
                        ) : (
                          "Mark complete"
                        )}
                      </Button>
                    )}

                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => edit(inv)}
                      title="Edit results / status"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => remove(inv.id)}
                      title="Delete order"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
