// src/components/right/AllergiesForm.tsx
"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, XCircle, Mic, Square } from "lucide-react";

// --- Configuration ---
const SEVERITY_OPTIONS = ["Mild", "Moderate", "Severe", "Life-Threatening"];
const TYPE_OPTIONS = ["Drug", "Food", "Environmental", "Other"];

const initialNewAllergyState = {
  allergen: "",
  reaction: "",
  severity: "Moderate",
  type: "Other",
  notes: "",
};
type NewAllergyState = typeof initialNewAllergyState;

interface AllergiesFormProps {
  patientId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // Callback to refresh parent list
}

// --- SIMPLE CLIENT-SIDE VOICE PARSER (FOR AUTO-FILL) ---
function parseVoiceInput(transcript: string): Partial<NewAllergyState> {
  const lowerTranscript = transcript.toLowerCase();
  const updates: Partial<NewAllergyState> = {};

  // Severity
  if (lowerTranscript.includes("life threatening") || lowerTranscript.includes("critical")) {
    updates.severity = "Life-Threatening";
  } else if (lowerTranscript.includes("severe")) {
    updates.severity = "Severe";
  } else if (lowerTranscript.includes("moderate")) {
    updates.severity = "Moderate";
  } else if (lowerTranscript.includes("mild")) {
    updates.severity = "Mild";
  }

  // Type
  if (
    lowerTranscript.includes("drug") ||
    lowerTranscript.includes("antibiotic") ||
    lowerTranscript.includes("medication")
  ) {
    updates.type = "Drug";
  } else if (lowerTranscript.includes("food")) {
    updates.type = "Food";
  } else if (lowerTranscript.includes("latex") || lowerTranscript.includes("pollen")) {
    updates.type = "Environmental";
  }

  return updates;
}

export default function AllergiesForm({
  patientId,
  isOpen,
  onClose,
  onSuccess,
}: AllergiesFormProps) {
  const [newAllergyInput, setNewAllergyInput] =
    useState<NewAllergyState>(initialNewAllergyState);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Reset form when opened / stop voice when closed
  useEffect(() => {
    if (isOpen) {
      setNewAllergyInput(initialNewAllergyState);
      setError(null);
    } else {
      // stop recognition if dialog closes mid-recording
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
        setListening(false);
      }
    }
  }, [isOpen]);

  // --------------------------------------------
  // VOICE INPUT LOGIC
  // --------------------------------------------
  const startListening = () => {
    if (typeof window === "undefined") return;

    const Speech =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;

    if (!Speech) {
      alert("Your browser does not support speech recognition.");
      return;
    }

    const rec = new Speech();
    rec.lang = "en-US";
    rec.interimResults = false;

    setListening(true);
    recognitionRef.current = rec;

    rec.onresult = (event: any) => {
      const transcript: string = event.results[0][0].transcript;
      setListening(false);
      setError(null);

      const parsedUpdates = parseVoiceInput(transcript);

      // crude split: "Penicillin, severe anaphylaxis"
      const parts = transcript.split(",").map((p) => p.trim());
      const allergenPart = parts[0];
      const reactionPart = parts.length > 1 ? parts.slice(1).join(", ") : "";

      const rawUpdates: Partial<NewAllergyState> = {
        allergen: newAllergyInput.allergen || allergenPart || "",
        reaction: newAllergyInput.reaction || reactionPart || "",
        ...parsedUpdates,
      };

      setNewAllergyInput((prev) => ({
        ...prev,
        ...rawUpdates,
      }));
    };

    rec.onerror = (event: any) => {
      console.error("Speech Recognition Error:", event.error);
      setError("Voice input failed. Try again.");
      setListening(false);
    };

    rec.onend = () => {
      setListening(false);
    };

    rec.start();
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

  // --------------------------------------------
  // SAVE LOGIC
  // --------------------------------------------
  const saveNewAllergy = useCallback(
    async (data: NewAllergyState) => {
      if (!data.allergen.trim() || !data.reaction.trim()) {
        return;
      }

      setIsSaving(true);
      setError(null);

      try {
        const body = { patientId, ...data };

        const res = await fetch("/api/allergies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const json = await res.json();

        if (json.success) {
          onSuccess();
          onClose();
        } else {
          setError(`Save Error: ${json.error}`);
        }
      } catch (e: any) {
        setError("Network error during save.");
      } finally {
        setIsSaving(false);
      }
    },
    [patientId, onSuccess, onClose]
  );

  const handleManualSubmit = () => {
    saveNewAllergy(newAllergyInput);
  };

  // --------------------------------------------
  // INPUT HANDLERS
  // --------------------------------------------
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewAllergyInput((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange =
    (name: keyof NewAllergyState) => (value: string) => {
      setNewAllergyInput((prev) => ({ ...prev, [name]: value }));
    };

  const isFormValid =
    newAllergyInput.allergen.trim() && newAllergyInput.reaction.trim();

  // --------------------------------------------
  // STATUS INDICATOR
  // --------------------------------------------
  const StatusIndicator = () => {
    if (!isSaving && !error && !listening) return null;

    return (
      <div className="flex items-center gap-2 rounded-lg border bg-white/70 px-3 py-2 text-xs text-slate-700">
        {isSaving && (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
            <span className="font-medium text-teal-700">
              Saving allergy record…
            </span>
          </>
        )}
        {listening && (
          <>
            <Mic className="h-4 w-4 text-red-600" />
            <span className="font-medium text-red-700">
              Listening… Speak substance, severity, and reaction.
            </span>
          </>
        )}
        {!isSaving && error && (
          <>
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="font-medium text-red-700">Error:</span>
            <span className="text-red-700">{error}</span>
          </>
        )}
      </div>
    );
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-xl rounded-2xl border border-slate-200 bg-slate-50/95 backdrop-blur">
        <DialogHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="space-y-1.5">
            <DialogTitle className="text-lg font-semibold text-slate-900">
              Add Allergy Record
            </DialogTitle>
            <p className="text-xs text-slate-500">
              Capture critical allergy information to keep this patient safe from
              preventable adverse reactions.
            </p>
          </div>

          {/* Voice controls */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="icon"
              onClick={startListening}
              disabled={listening || isSaving}
              className={`h-9 w-9 flex-shrink-0 ${
                listening
                  ? "bg-teal-500/60 hover:bg-teal-500/60 cursor-not-allowed"
                  : "bg-teal-600 hover:bg-teal-700"
              }`}
            >
              <Mic className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={stopListening}
              disabled={!listening}
              className="h-9 w-9 flex-shrink-0 border-slate-300 text-slate-700 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
            >
              <Square className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <StatusIndicator />

          <div className="space-y-6 rounded-xl border border-slate-200 bg-white/90 p-4 shadow-sm sm:p-5">
            {/* Header row inside card */}
            <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-1 font-medium text-teal-700">
                • Allergy details
              </span>
              <span>
                <span className="text-red-500">*</span> Required fields
              </span>
            </div>

            {/* Allergen + Reaction */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="allergen"
                  className="text-xs font-semibold text-slate-800"
                >
                  Allergen / Substance <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="allergen"
                  name="allergen"
                  value={newAllergyInput.allergen}
                  onChange={handleInputChange}
                  placeholder="e.g. Penicillin, Peanuts, Latex"
                  className="bg-white text-sm border-slate-200 placeholder:text-slate-400 focus-visible:ring-teal-600"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="reaction"
                  className="text-xs font-semibold text-slate-800"
                >
                  Reaction <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="reaction"
                  name="reaction"
                  value={newAllergyInput.reaction}
                  onChange={handleInputChange}
                  placeholder="e.g. Anaphylaxis, Urticaria, Wheeze, Rash"
                  className="bg-white text-sm border-slate-200 placeholder:text-slate-400 focus-visible:ring-teal-600"
                />
                <p className="text-[11px] text-slate-400">
                  Use concise clinical terms where possible.
                </p>
              </div>
            </div>

            {/* Severity + Type */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-800">
                Classification
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Severity
                  </Label>
                  <Select
                    value={newAllergyInput.severity}
                    onValueChange={handleSelectChange("severity")}
                  >
                    <SelectTrigger className="bg-white text-sm border-slate-200 focus:ring-teal-600">
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      {SEVERITY_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Type
                  </Label>
                  <Select
                    value={newAllergyInput.type}
                    onValueChange={handleSelectChange("type")}
                  >
                    <SelectTrigger className="bg-white text-sm border-slate-200 focus:ring-teal-600">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="notes"
                  className="text-xs font-semibold text-slate-800"
                >
                  Additional Notes
                </Label>
                <span className="text-[11px] text-slate-400">
                  Onset, route, previous exposures, management, etc.
                </span>
              </div>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={newAllergyInput.notes}
                onChange={handleInputChange}
                className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="e.g. First reaction in 2022 after IV dose; responded to IM adrenaline and steroids."
              />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full border-slate-200 text-slate-700 hover:bg-slate-100 sm:w-auto"
            >
              Cancel
            </Button>
          </DialogClose>

          <Button
            type="button"
            onClick={handleManualSubmit}
            disabled={!isFormValid || isSaving}
            className="w-full bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60 sm:w-auto"
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save allergy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
