"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { Mic, Loader2, Stethoscope } from "lucide-react";

interface Patient {
  id: string;
  name: string;
  idNumber?: string;
}

async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export default function StartConsultPage() {
  const router = useRouter();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");

  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  // LOAD PATIENTS
  useEffect(() => {
    async function loadPatients() {
      try {
        const res = await fetch("/api/patients");
        const json = await res.json();
        if (json.success && Array.isArray(json.patients)) {
          setPatients(json.patients);
        }
      } catch (err) {
        console.error("LOAD PATIENTS ERROR:", err);
      }
    }
    loadPatients();
  }, []);

  // START RECORDING
  async function startRecording() {
    try {
      setTranscript("");
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        try {
          const blob = new Blob(audioChunksRef.current, {
            type: recorder.mimeType || "audio/webm",
          });

          stream.getTracks().forEach((t) => t.stop());
          setTranscribing(true);

          const base64 = await blobToBase64(blob);

          const res = await fetch("/api/consult/transcribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              audioBase64: base64,
              mimeType: blob.type,
            }),
          });

          const json = await res.json();
          if (!json.success) {
            setError(json.error || "Transcription failed");
          } else {
            setTranscript(json.transcript);
          }
        } catch (err) {
          console.error("TRANSCRIBE ERROR:", err);
          setError("Transcription failed.");
        } finally {
          setTranscribing(false);
          setRecording(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch (err) {
      console.error("MIC ERROR:", err);
      setError("Microphone access denied.");
      setRecording(false);
    }
  }

  // STOP RECORDING
  function stopRecording() {
    try {
      const rec = mediaRecorderRef.current;
      if (!rec || rec.state === "inactive") return;
      rec.stop();
    } catch (err) {
      console.error("STOP ERROR:", err);
      setRecording(false);
    }
  }

  // PROCESS CONSULT
  async function processConsult() {
    try {
      if (!selectedPatientId) {
        setError("Select a patient first.");
        return;
      }
      if (!transcript.trim()) {
        setError("No transcript to process.");
        return;
      }

      setProcessing(true);
      setError(null);

      const structRes = await fetch("/api/consult/structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });

      const structJson = await structRes.json();
      if (!structJson.success) {
        setError("Failed to structure consultation.");
        setProcessing(false);
        return;
      }

      const structured = structJson.data;

      const saveRes = await fetch("/api/consult/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatientId,
          data: structured,
        }),
      });

      const saveJson = await saveRes.json();
      if (!saveJson.success) {
        setError("Failed to save EMR data.");
        setProcessing(false);
        return;
      }

      alert("Consult processed and saved to EMR.");
      setProcessing(false);
      router.push(`/patients/${selectedPatientId}`);
    } catch (err) {
      console.error("PROCESS CONSULT ERROR:", err);
      setError("Error during consult processing.");
      setProcessing(false);
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Stethoscope className="w-6 h-6 text-teal-700" />
        <div>
          <h1 className="text-2xl font-semibold text-teal-700">
            Start New Consult
          </h1>
          <p className="text-sm text-gray-600">
            Record the encounter, let AI structure it, and save directly into
            the EMR.
          </p>
        </div>
      </div>

      {/* PATIENT SELECT */}
      <Card className="p-4 space-y-3">
        <label className="text-sm font-medium text-gray-700">
          Select patient
        </label>
        <Select
          value={selectedPatientId}
          onValueChange={(v) => setSelectedPatientId(v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose an existing patient…" />
          </SelectTrigger>
          <SelectContent>
            {patients.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name} {p.idNumber ? `• ${p.idNumber}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <p className="text-xs text-gray-500">
          (Later we can add &quot;Scan ID / Create patient&quot; here.)
        </p>
      </Card>

      {/* RECORDING + TRANSCRIPT */}
      <Card className="p-5 space-y-4">
        <h2 className="text-lg font-semibold text-teal-700 flex items-center gap-2">
          <Mic className="w-4 h-4" />
          AI Consultation Recorder
        </h2>

        {!recording && !transcribing && (
          <Button
            className="bg-teal-600 hover:bg-teal-700"
            onClick={startRecording}
          >
            <Mic className="w-4 h-4 mr-2" />
            Begin Recording
          </Button>
        )}

        {recording && (
          <Button
            className="bg-red-600 hover:bg-red-700"
            onClick={stopRecording}
          >
            Stop Recording
          </Button>
        )}

        {transcribing && (
          <div className="flex items-center gap-2 text-teal-700">
            <Loader2 className="w-4 h-4 animate-spin" />
            Transcribing consultation…
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Transcript (editable)
          </label>
          <Textarea
            className="min-h-[140px] text-sm"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="The AI transcript will appear here. You can edit before processing."
          />
        </div>

        {transcript && !processing && (
          <Button
            className="bg-teal-700 hover:bg-teal-800"
            onClick={processConsult}
          >
            Process Consultation &amp; Save to EMR
          </Button>
        )}

        {processing && (
          <div className="flex items-center gap-2 text-teal-700">
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing with AI and updating EMR…
          </div>
        )}
      </Card>
    </div>
  );
}
