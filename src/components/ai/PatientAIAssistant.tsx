"use client";

import { useState, useEffect } from "react";
import { Loader2, Send, Sparkles, Mic, MicOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSpeechToText } from "@/hooks/useSpeechToText";

export default function PatientAIAssistant({ patientId }: { patientId?: string }) {
  const { toast } = useToast();

  // TEXT + AI MODE
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"summary" | "letter">("summary");
  const [loading, setLoading] = useState(false);

  // AI OUTPUT
  const [output, setOutput] = useState<{
    summary: string;
    impression: string;
    plan: string;
  } | null>(null);

  // VOICE HOOK
  const {
    transcript,
    listening,
    startListening,
    stopListening,
  } = useSpeechToText();

  // SYNC SPEECH → INPUT
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  // GENERATE SUMMARY / LETTER
  async function generateAI() {
    if (!input.trim()) return;

    setLoading(true);
    setOutput(null);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        body: JSON.stringify({ text: input, mode }),
      });

      const json = await res.json();

      if (!json.success) {
        toast({
          title: "AI Error",
          description: json.error,
          variant: "destructive",
        });
        return;
      }

      setOutput(json.output);
    } catch (e) {
      toast({
        title: "AI Error",
        description: "Failed to get AI response",
        variant: "destructive",
      });
    }

    setLoading(false);
  }

  // SAVE TO NOTES
  async function saveToNotes() {
    if (!patientId) {
      toast({
        title: "Not Available",
        description: "Open a patient record to save notes.",
        variant: "destructive",
      });
      return;
    }

    if (!output) return;

    const payload = {
      patientId,
      type: "ai-generated",
      content: `${output.summary}\n\nImpression:\n${output.impression}\n\nPlan:\n${output.plan}`,
    };

    try {
      const res = await fetch("/api/treatment-notes", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.success) throw new Error("Save failed");

      toast({
        title: "Saved",
        description: "AI notes saved successfully.",
      });
    } catch {
      toast({
        title: "Save Error",
        description: "Unable to save notes.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-6">

      {/* AI MODE SELECTOR */}
      <div className="flex gap-2">
        <button
          className={`px-4 py-2 rounded-lg border ${
            mode === "summary"
              ? "bg-teal-600 text-white"
              : "bg-white text-gray-700"
          }`}
          onClick={() => setMode("summary")}
        >
          Summary
        </button>

        <button
          className={`px-4 py-2 rounded-lg border ${
            mode === "letter"
              ? "bg-teal-600 text-white"
              : "bg-white text-gray-700"
          }`}
          onClick={() => setMode("letter")}
        >
          Letter
        </button>
      </div>

      {/* TEXTAREA + VOICE BUTTON */}
      <div className="relative">
        <textarea
          className="w-full border rounded-xl p-4 min-h-[140px] text-sm pr-14"
          placeholder="Type or dictate clinical notes…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        {/* MIC BUTTON */}
        <button
          onClick={() => {
            if (listening) stopListening();
            else startListening();
          }}
          className={`absolute right-4 top-4 p-2 rounded-full transition ${
            listening
              ? "bg-red-500 text-white animate-pulse"
              : "bg-teal-600 text-white hover:bg-teal-700"
          }`}
        >
          {listening ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        {/* Optional pulse ring for listening effect */}
        {listening && (
          <div className="pulse-ring absolute -top-4 -right-4" />
        )}
      </div>

      {/* AI GENERATE BUTTON */}
      <button
        onClick={generateAI}
        disabled={loading}
        className="w-full bg-teal-600 text-white py-3 rounded-xl hover:bg-teal-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
        {loading ? "Generating..." : "Generate with AI"}
      </button>

      {/* AI OUTPUT */}
      {output && (
        <div className="border rounded-xl p-4 bg-white space-y-4">

          <div>
            <h3 className="font-semibold text-teal-700 mb-1">Summary</h3>
            <p className="text-sm text-gray-700 whitespace-pre-line">
              {output.summary}
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-teal-700 mb-1">Impression</h3>
            <p className="text-sm text-gray-700 whitespace-pre-line">
              {output.impression}
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-teal-700 mb-1">Plan</h3>
            <p className="text-sm text-gray-700 whitespace-pre-line">
              {output.plan}
            </p>
          </div>

          {/* SAVE NOTES BUTTON */}
          <button
            onClick={saveToNotes}
            disabled={!patientId}
            className={`w-full py-3 rounded-xl mt-2 flex items-center justify-center gap-2 transition ${
              patientId
                ? "bg-teal-600 text-white hover:bg-teal-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <Send size={18} />
            Save to Treatment Notes
          </button>
        </div>
      )}
    </div>
  );
}
