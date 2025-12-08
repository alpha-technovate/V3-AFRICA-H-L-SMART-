"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload } from "lucide-react";

export default function NewPatientForm() {
  const router = useRouter();

  // ============================================================
  // FORM FIELDS
  // ============================================================
  const [name, setName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");

  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [medicalAid, setMedicalAid] = useState("");
  const [notes, setNotes] = useState("");

  // STATES
  const [saving, setSaving] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // ============================================================
  // OCR UPLOAD HANDLER
  // ============================================================
  async function handleIDUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/ocr-id", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!json.success) {
        setError("Could not extract ID details. Try another photo.");
        setOcrLoading(false);
        return;
      }

      const data = json.data;

      // Auto-populate form
      setName(data.name || "");
      setIdNumber(data.idNumber || "");
      setDob(data.dob || "");
      setGender(data.gender || "");
      setAge(data.age || "");
    } catch (err) {
      setError("Failed to scan ID.");
      console.error(err);
    } finally {
      setOcrLoading(false);
    }
  }

  // ============================================================
  // SAVE NEW PATIENT → REDIRECT TO CONSULT START
  // ============================================================
  async function savePatient() {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          idNumber,
          dob,
          gender,
          age,
          phone,
          address,
          medicalAid,
          notes,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error || "Failed to save patient.");
        setSaving(false);
        return;
      }

      const newId = json.id; // patient ID from API
      setSuccess(true);

      // RESET FORM
      setName("");
      setIdNumber("");
      setDob("");
      setGender("");
      setAge("");
      setPhone("");
      setAddress("");
      setMedicalAid("");
      setNotes("");

      // AUTO-REDIRECT TO CONSULT
      router.push(`/patients/${newId}?consult=start`);
    } catch (err) {
      console.error(err);
      setError("Something went wrong while saving.");
    } finally {
      setSaving(false);
    }
  }

  // ============================================================
  // UI
  // ============================================================
  return (
    <Card className="p-6 space-y-6 shadow-md max-w-2xl mx-auto mt-6">
      <h1 className="text-2xl font-bold text-teal-700">Register New Patient</h1>

      {/* OCR UPLOAD */}
      <div className="space-y-2">
        <p className="text-sm text-gray-600">
          Upload South African ID / Passport / Driver’s License
        </p>

        <label className="flex items-center justify-center p-4 border rounded-md bg-gray-50 cursor-pointer hover:bg-gray-100">
          <Upload className="w-5 h-5 text-teal-700 mr-2" />
          <span className="text-teal-700 font-medium">
            {ocrLoading ? "Scanning…" : "Click to Scan ID"}
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleIDUpload}
          />
        </label>

        {ocrLoading && (
          <div className="flex items-center gap-2 text-teal-700">
            <Loader2 className="w-4 h-4 animate-spin" /> Processing ID…
          </div>
        )}
      </div>

      {/* FORM FIELDS */}
      <div className="space-y-3">
        <Input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="ID Number" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
        <Input placeholder="Date of Birth (YYYY-MM-DD)" value={dob} onChange={(e) => setDob(e.target.value)} />
        <Input placeholder="Gender" value={gender} onChange={(e) => setGender(e.target.value)} />
        <Input placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} />

        <Input placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
        <Input placeholder="Medical Aid Number" value={medicalAid} onChange={(e) => setMedicalAid(e.target.value)} />

        <Textarea
          rows={3}
          placeholder="Clinical Notes (Optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* ERROR */}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* SUCCESS */}
      {success && (
        <p className="text-sm text-green-600">Patient created successfully!</p>
      )}

      {/* SAVE BUTTON */}
      <Button
        className="w-full bg-teal-600 hover:bg-teal-700"
        disabled={saving || !name || !idNumber}
        onClick={savePatient}
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Patient"}
      </Button>
    </Card>
  );
}
