// src/app/id-ocr/page.tsx (or wherever this lives)
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Camera,
  Upload,
  ArrowRight,
  Mic,
  Square,
} from "lucide-react";

export default function IDScanPage() {
  const router = useRouter();

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [extracting, setExtracting] = useState(false);
  const [creating, setCreating] = useState(false);

  const [name, setName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  const [hasExtracted, setHasExtracted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -------------------------------
  // CONSULT VOICE + TEXT
  // -------------------------------
  const [consultTranscript, setConsultTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

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

  // ==========================
  // HANDLE IMAGE UPLOAD
  // ==========================
  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setHasExtracted(false);
      setError(null);
    }
  }

  // ==========================
  // OCR PROCESSING
  // ==========================
  async function extractOCR() {
    if (!selectedImage) return;

    setExtracting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedImage);

      const res = await fetch("/api/ocr-id", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error || "OCR failed. Please try again.");
        setExtracting(false);
        return;
      }

      const data = json.data || {};

      setName(data.name || "");
      setIdNumber(data.idNumber || "");
      setDob(data.dob || "");
      setGender(data.gender || "");
      setAge(data.age || "");
      setPhotoUrl(data.photoUrl || "");

      setHasExtracted(true);
    } catch (err) {
      console.error("OCR EXTRACT ERROR:", err);
      setError("OCR failed. Check console for details.");
    } finally {
      setExtracting(false);
    }
  }

  // ==========================
  // VOICE CAPTURE LOGIC
  // ==========================
  function startListening() {
    setVoiceError(null);

    if (typeof window === "undefined") return;

    const Speech =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;

    if (!Speech) {
      setVoiceError("This browser does not support speech recognition.");
      return;
    }

    const rec = new Speech();
    rec.lang = "en-US";
    rec.interimResults = false;

    recognitionRef.current = rec;
    setListening(true);

    rec.onresult = (event: any) => {
      const transcript: string = event.results[0][0].transcript;
      setListening(false);

      // Append to existing transcript so doctor can pause + continue
      setConsultTranscript((prev) =>
        prev ? `${prev}\n${transcript}` : transcript
      );
    };

    rec.onerror = (event: any) => {
      console.error("Speech Recognition Error:", event.error);
      setListening(false);
      setVoiceError("Voice input failed. Please try again.");
    };

    rec.onend = () => {
      setListening(false);
    };

    rec.start();
  }

  function stopListening() {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setListening(false);
  }

  // ==========================
  // CREATE PATIENT + REDIRECT
  // ==========================
  async function createPatientAndOpen() {
    if (!name || !idNumber) {
      setError("Name and ID number are required.");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          idNumber,
          age,
          dob,
          gender,
          photoUrl,
          // 👇 consult transcript goes along with the create
          // Later we’ll hook an AI backend to explode this into
          // problems, meds, allergies, etc.
          initialConsultTranscript: consultTranscript || null,
          source: "idScan",
        }),
      });

      const json = await res.json();

      if (!json.success || !json.id) {
        setError(json.error || "Failed to create patient.");
        setCreating(false);
        return;
      }

      const patientId = json.id as string;

      router.push(`/patients/${patientId}?fromIdScan=1`);
    } catch (err) {
      console.error("Create patient error:", err);
      setError("Failed to create patient. Check console.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-teal-700">
            New Patient via ID Scan
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            Scan a South African ID, confirm demographics, then capture the
            consult by voice. SmartBridge will store the transcript and we’ll
            hook AI to auto-populate the record.
          </p>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: IMAGE + OCR */}
        <Card className="p-6 space-y-4 bg-white">
          <h2 className="text-lg font-semibold text-gray-800">
            1. Capture or upload ID
          </h2>

          <div className="space-y-3">
            <Label>Choose an image</Label>
            <Input type="file" accept="image/*" onChange={handleImageChange} />

            {/* CAMERA BUTTON */}
            <Button
              variant="outline"
              type="button"
              className="flex items-center gap-2"
              onClick={() => document.getElementById("cameraInput")?.click()}
            >
              <Camera className="w-4 h-4" />
              Use Camera
            </Button>

            <Input
              id="cameraInput"
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          {/* PREVIEW */}
          {previewUrl && (
            <div className="mt-4">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full max-h-80 object-cover rounded shadow"
              />
            </div>
          )}

          {/* OCR BUTTON */}
          <Button
            type="button"
            className="w-full mt-4 bg-teal-600 hover:bg-teal-700 text-white"
            onClick={extractOCR}
            disabled={!selectedImage || extracting}
          >
            {extracting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4" /> Extract Details from ID
              </div>
            )}
          </Button>

          {error && (
            <p className="text-sm text-red-600 mt-2">
              {error}
            </p>
          )}
        </Card>

        {/* RIGHT: EXTRACTED DETAILS */}
        <Card className="p-6 space-y-4 bg-white">
          <h2 className="text-lg font-semibold text-gray-800">
            2. Confirm patient details
          </h2>

          <p className="text-xs text-gray-500">
            SmartBridge pre-fills from the ID. Edit anything before saving.
          </p>

          <div className="space-y-3">
            <div>
              <Label>Full Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name from ID"
              />
            </div>

            <div>
              <Label>ID Number</Label>
              <Input
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder="13-digit SA ID number"
              />
            </div>

            <div>
              <Label>Date of Birth</Label>
              <Input
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                placeholder="YYYY-MM-DD"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Gender</Label>
                <Input
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  placeholder="Male / Female"
                />
              </div>
              <div>
                <Label>Age</Label>
                <Input
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Age"
                />
              </div>
            </div>

            <div>
              <Label>Photo URL (optional)</Label>
              <Textarea
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="Link to extracted or uploaded photo (optional)"
                className="min-h-[70px]"
              />
            </div>
          </div>
        </Card>
      </div>

      {/* STEP 3: CONSULT CAPTURE */}
      <Card className="p-6 space-y-4 bg-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              3. Capture consult (voice + notes)
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Hit the mic, talk through the whole consult (HPC, exam, plan).
              You can pause and tap again to append more. Edit the text before
              saving if needed.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="icon"
              onClick={startListening}
              disabled={listening}
              className={`h-9 w-9 ${
                listening
                  ? "bg-teal-500/60 cursor-not-allowed"
                  : "bg-teal-600 hover:bg-teal-700"
              } text-white`}
            >
              <Mic className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={stopListening}
              disabled={!listening}
              className="h-9 w-9 border-slate-300 text-slate-700 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
            >
              <Square className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {listening && (
          <div className="rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-xs text-teal-800 flex items-center gap-2">
            <Mic className="h-4 w-4" />
            <span className="font-medium">
              Listening… describe the full consult. You can pause and resume.
            </span>
          </div>
        )}

        {voiceError && (
          <p className="text-xs text-red-600">
            {voiceError}
          </p>
        )}

        <Textarea
          value={consultTranscript}
          onChange={(e) => setConsultTranscript(e.target.value)}
          placeholder="Dictated consult transcript will appear here. You can also type or edit manually."
          className="min-h-[140px] text-sm"
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
          <p className="text-xs text-gray-500">
            This transcript will be saved with the new patient as an initial
            consult note. In the next step we’ll plug in AI so it can populate
            problems, medications, allergies, and history for you.
          </p>

          <Button
            type="button"
            className="bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2 px-5"
            onClick={createPatientAndOpen}
            disabled={creating || !name || !idNumber}
          >
            {creating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Finish & Create Patient
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
