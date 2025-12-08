// src/app/id-ocr/page.tsx
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
  AlertTriangle, // New icon for persistent camera warning
} from "lucide-react";

// Global variable for Speech Recognition constructor
const SpeechRecognition = 
    (typeof window !== "undefined") ? 
    ((window as any).webkitSpeechRecognition || (window as any).SpeechRecognition) : 
    null;

export default function IDScanPage() {
  const router = useRouter();

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [creating, setCreating] = useState(false);

  // Extracted Data States
  const [name, setName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [hasExtracted, setHasExtracted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // CONSULT VOICE + TEXT States
  const [consultTranscript, setConsultTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [cameraBlocked, setCameraBlocked] = useState(false); // New state for persistent camera warning
  
  const recognitionRef = useRef<any>(null);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          // Explicitly clear the onend handler before stopping to prevent restart loops
          recognitionRef.current.onend = null; 
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Check camera permission status once on load (Best effort check)
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                // Permission granted, but stop the stream immediately
                stream.getTracks().forEach(track => track.stop());
                setCameraBlocked(false);
            })
            .catch(err => {
                // Permission denied or stream error
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    setCameraBlocked(true);
                } else {
                    setCameraBlocked(false); // Likely device error, not security
                }
            });
    }
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
      setCameraBlocked(false); // Assume successful interaction means permission is now OK
    }
  }

  // ==========================
  // OCR PROCESSING (Logic remains same)
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

      setName(data.firstName + ' ' + data.lastName || data.name || "");
      setIdNumber(data.idNumber || "");
      setDob(data.dateOfBirth || data.dob || "");
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
  // VOICE CAPTURE LOGIC (IMPROVED)
  // ==========================
  function startListening() {
    setVoiceError(null);

    if (!SpeechRecognition) {
      setVoiceError("This browser does not support speech recognition.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.interimResults = true; // Use interim results for live feedback
    rec.continuous = true; // Attempt continuous capture

    recognitionRef.current = rec;
    setListening(true);

    rec.onresult = (event: any) => {
        // Collect all results, but only update the transcript from the final result text
        let interimTranscript = '';
        let finalTranscript = consultTranscript;
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                // Only append final result to the official transcript
                finalTranscript = (finalTranscript ? finalTranscript + '\n' : '') + transcript;
            } else {
                // Show interim result for live feedback (optional, not implemented in UI)
                interimTranscript += transcript;
            }
        }
        setConsultTranscript(finalTranscript);
    };

    rec.onerror = (event: any) => {
      console.error("Speech Recognition Error:", event.error);
      setListening(false);
      
      if (event.error === 'not-allowed') {
         // Specific error for permission denial
         setVoiceError("Microphone access denied. Please check your browser's site permissions and ensure you are using HTTPS.");
      } else {
         setVoiceError(`Voice input error: ${event.error}. Try reloading the page.`);
      }
    };

    rec.onend = () => {
      // If the API stops listening unexpectedly, reset the listening state.
      // We don't auto-restart to prevent endless permission loops.
      if (listening) {
          setListening(false);
          setVoiceError("Dictation stopped (silence/timeout). Tap the mic to resume.");
      }
    };

    try {
        rec.start();
    } catch (e: any) {
        // Handle case where start() is called when already recording
        if (e.name !== 'InvalidStateError') {
             console.error("Recognition start error:", e);
             setVoiceError("Could not start voice recognition.");
        }
        // If InvalidStateError, the previous instance is still running, which is fine.
    }
  }

  function stopListening() {
    if (recognitionRef.current) {
      // Crucially remove onend handler before stopping
      recognitionRef.current.onend = null; 
      recognitionRef.current.stop();
    }
    setListening(false);
  }

  // ==========================
  // CREATE PATIENT + REDIRECT (Logic remains same)
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
          // Use full name, server will likely split into first/last
          name: name, 
          idNumber,
          age,
          dob,
          gender,
          photoUrl,
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
            consult by voice. SmartBridge will store the transcript.
          </p>
        </div>
      </div>

      {/* PERSISTENT CAMERA WARNING */}
      {cameraBlocked && (
        <div className="rounded-md border border-red-300 bg-red-100 px-4 py-3 text-sm text-red-800 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div>
                <p className="font-semibold">Camera Access Denied by Browser/OS.</p>
                <p>Please ensure you are using a secure connection (HTTPS via ngrok/Vercel) and check your device's Privacy Settings to grant camera access to your browser.</p>
            </div>
        </div>
      )}

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: IMAGE + OCR */}
        <Card className="p-6 space-y-4 bg-white">
          <h2 className="text-lg font-semibold text-gray-800">
            1. Capture or upload ID
          </h2>

          <div className="space-y-3">
            <Label>Choose an image</Label>
            {/* The standard file input is the primary method */}
            <Input type="file" accept="image/*" onChange={handleImageChange} />

            {/* CAMERA BUTTON that triggers the hidden input */}
            <Button
              variant="outline"
              type="button"
              className="flex items-center gap-2"
              onClick={() => document.getElementById("cameraInput")?.click()}
              disabled={cameraBlocked}
            >
              <Camera className="w-4 h-4" />
              Use Camera
            </Button>

            {/* HIDDEN INPUT with capture attribute */}
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

        {/* RIGHT: EXTRACTED DETAILS (Form fields remain the same) */}
        <Card className="p-6 space-y-4 bg-white">
          <h2 className="text-lg font-semibold text-gray-800">
            2. Confirm patient details
          </h2>

          <p className="text-xs text-gray-500">
            SmartBridge pre-fills from the ID. Edit anything before saving.
          </p>

          <div className="space-y-3">
            {/* ... Form fields (name, ID number, DOB, Gender, Age, Photo URL) remain here ... */}
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