// src/components/scans/ScansSection.tsx
"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, Image, Trash2, Plus } from "lucide-react";

interface Timestamp {
  seconds: number;
  nanoseconds?: number;
}

interface ScanRecord {
  id: string;
  patientId: string;
  scanType: string;
  notes?: string;
  fileBase64?: string;
  fileUrl?: string;
  mimeType?: string;
  createdAt?: Timestamp;
  interpreted?: boolean;
  aiInterpretationStatus?: "Pending" | "Complete" | "Failed" | "None" | string;
  aiReport?: string;
  aiImpression?: string;
  aiSeverity?: string;
  aiRecommendations?: string[] | string;
  [key: string]: any;
}

const initialFormState = {
  scanType: "",
  notes: "",
  fileUrl: "",
};

export default function ScansSection({ patientId }: { patientId: string }) {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [interpreting, setInterpreting] = useState<string | null>(null);
  const [formState, setFormState] = useState(initialFormState);

  // --------------- Helpers ---------------
  const formatDate = (ts?: Timestamp) => {
    if (!ts) return "Unknown date";
    return new Date(ts.seconds * 1000).toLocaleString();
  };

  const getAiStatusColor = (status?: string) => {
    if (status === "Complete")
      return "bg-green-100 text-green-700";
    if (status === "Pending")
      return "bg-yellow-100 text-yellow-700";
    if (status === "Failed")
      return "bg-red-100 text-red-700";
    if (status === "None" || !status)
      return "bg-gray-100 text-gray-500";
    return "bg-gray-100 text-gray-500";
  };

  // --------------- Load scans ---------------
  async function loadScans() {
    try {
      const res = await fetch(`/api/scans?patientId=${patientId}`);
      const json = await res.json();

      if (json.success && Array.isArray(json.scans)) {
        setScans(json.scans as ScanRecord[]);
      } else if (json.success && Array.isArray(json.data)) {
        // in case you change API to { success, data }
        setScans(json.data as ScanRecord[]);
      } else {
        console.error("API error loading scans:", json.error);
        setScans([]);
      }
    } catch (err) {
      console.error("Failed to fetch scans:", err);
      setScans([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadScans();
  }, [patientId]);

  // --------------- Add scan ---------------
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!formState.scanType.trim()) return;

    setSaving(true);

    const payload = {
      patientId,
      scanType: formState.scanType,
      notes: formState.notes,
      // For now we store the URL only; later you can wire an uploader
      fileBase64: undefined,
      fileUrl: formState.fileUrl || undefined,
      mimeType: "image/jpeg",
    };

    try {
      const res = await fetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (json.success) {
        setFormState(initialFormState);
        await loadScans();
      } else {
        alert(`Save failed: ${json.error}`);
      }
    } catch (e) {
      console.error("Add scan error:", e);
    } finally {
      setSaving(false);
    }
  }

  // --------------- AI Interpretation ---------------
  async function handleInterpret(scanId: string) {
    setInterpreting(scanId);

    try {
      const res = await fetch("/api/scans-interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanId }),
      });

      const json = await res.json();

      if (json.success) {
        // Optimistic UI
        setScans((prev) =>
          prev.map((s) =>
            s.id === scanId
              ? {
                  ...s,
                  aiInterpretationStatus: "Complete",
                  interpreted: true,
                }
              : s
          )
        );
        // Re-fetch to get full report fields
        setTimeout(() => loadScans(), 1500);
      } else {
        alert(`AI failed: ${json.error}`);
      }
    } catch (err) {
      console.error("AI error:", err);
      alert("AI error while interpreting scan.");
    } finally {
      setInterpreting(null);
    }
  }

  // --------------- Delete scan ---------------
  async function handleDelete(id: string) {
    if (!confirm("Delete this scan?")) return;

    try {
      await fetch("/api/scans", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      setScans((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      console.error("Delete scan error:", e);
    }
  }

  // --------------- Render ---------------
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-teal-700">
        Medical Scans & Imaging
      </h2>

      {/* Add Form */}
      <Card className="p-4 space-y-4 shadow-md">
        <h3 className="font-semibold text-sm text-gray-700">
          Add Scan / Imaging Record
        </h3>

        <form onSubmit={handleAdd} className="space-y-3">
          <Input
            placeholder="Type (CXR, CT, MRI, Ultrasound...)"
            value={formState.scanType}
            onChange={(e) =>
              setFormState((p) => ({ ...p, scanType: e.target.value }))
            }
          />

          <Textarea
            placeholder="Short description or clinical notes"
            value={formState.notes}
            onChange={(e) =>
              setFormState((p) => ({ ...p, notes: e.target.value }))
            }
            rows={3}
          />

          <Input
            placeholder="Image/report URL (optional, e.g. PACS link)"
            value={formState.fileUrl}
            onChange={(e) =>
              setFormState((p) => ({ ...p, fileUrl: e.target.value }))
            }
          />

          <Button
            type="submit"
            disabled={saving || !formState.scanType}
            className="w-full"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" /> Save Scan Record
              </>
            )}
          </Button>
        </form>
      </Card>

      {/* Scan List */}
      <div className="space-y-3">
        <h3 className="text-xl font-semibold border-b pb-2">
          Scan History & AI Reports
        </h3>

        {loading ? (
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-500" />
        ) : scans.length === 0 ? (
          <Card className="p-4 text-sm text-gray-500">
            No scans recorded.
          </Card>
        ) : (
          <>
            {scans.map((scan) => {
              const recs =
                Array.isArray(scan.aiRecommendations)
                  ? scan.aiRecommendations
                  : scan.aiRecommendations
                  ? [scan.aiRecommendations]
                  : [];

              return (
                <Card
                  key={scan.id}
                  className="p-4 space-y-3 flex flex-col md:flex-row justify-between gap-4"
                >
                  {/* Left: info */}
                  <div className="flex-1 space-y-1">
                    <h4 className="font-semibold text-lg">
                      {scan.scanType || "Scan"}
                    </h4>

                    <div className="flex flex-wrap gap-2 items-center">
                      <Badge className={getAiStatusColor(scan.aiInterpretationStatus)}>
                        AI Status: {scan.aiInterpretationStatus || "None"}
                      </Badge>
                      {scan.aiSeverity && (
                        <Badge variant="outline">
                          Severity: {scan.aiSeverity}
                        </Badge>
                      )}
                    </div>

                    {scan.notes && (
                      <p className="text-sm text-gray-700 whitespace-pre-line pt-1">
                        <span className="font-semibold">Notes: </span>
                        {scan.notes}
                      </p>
                    )}

                    {scan.aiImpression && (
                      <p className="text-sm text-teal-700 font-semibold pt-2">
                        Impression: {scan.aiImpression}
                      </p>
                    )}

                    {scan.aiReport && (
                      <p className="text-sm text-gray-800 whitespace-pre-line pt-1">
                        {scan.aiReport}
                      </p>
                    )}

                    {recs.length > 0 && (
                      <div className="pt-2">
                        <p className="text-xs font-semibold text-gray-700">
                          Recommendations:
                        </p>
                        <ul className="list-disc list-inside text-xs text-gray-600">
                          {recs.map((r, idx) => (
                            <li key={idx}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <p className="text-xs text-gray-400 pt-1">
                      Recorded: {formatDate(scan.createdAt)}
                    </p>
                  </div>

                  {/* Right: actions */}
                  <div className="flex flex-col gap-2 items-end">
                    {scan.fileUrl && (
                      <a href={scan.fileUrl} target="_blank">
                        <Button size="sm" variant="outline">
                          <Image className="w-4 h-4 mr-2" /> View File
                        </Button>
                      </a>
                    )}

                    <Button
                      size="sm"
                      className="bg-teal-600 hover:bg-teal-700"
                      disabled={interpreting === scan.id}
                      onClick={() => handleInterpret(scan.id)}
                    >
                      {interpreting === scan.id ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Zap className="w-4 h-4 mr-2" />
                      )}
                      {interpreting === scan.id
                        ? "Interpreting…"
                        : "Run AI Interpretation"}
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(scan.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
