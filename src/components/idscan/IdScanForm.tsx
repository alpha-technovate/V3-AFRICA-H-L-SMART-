"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type ParsedIdData = {
  idNumber: string;
  dob: string;
  age: number;
  gender: string;
};

export default function IdScanForm() {
  const router = useRouter();

  const [idText, setIdText] = useState("");
  const [parsed, setParsed] = useState<ParsedIdData | null>(null);
  const [fullName, setFullName] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [loadingExtract, setLoadingExtract] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExtract() {
    try {
      setError(null);
      setLoadingExtract(true);
      setParsed(null);

      const res = await fetch("/api/id-ocr", {
        method: "POST",
        body: JSON.stringify({ idText }),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error || "Failed to parse ID");
        return;
      }

      setParsed(json.data);
    } catch (e: any) {
      console.error("EXTRACT ERROR:", e);
      setError(e.message || "Unexpected error while parsing ID");
    } finally {
      setLoadingExtract(false);
    }
  }

  async function handleCreatePatient() {
    if (!parsed) {
      setError("Please extract ID details first.");
      return;
    }
    if (!fullName.trim()) {
      setError("Please enter the patient's full name.");
      return;
    }

    try {
      setError(null);
      setCreating(true);

      const res = await fetch("/api/patients", {
        method: "POST",
        body: JSON.stringify({
          name: fullName.trim(),
          age: parsed.age,
          idNumber: parsed.idNumber,
          diagnosis: diagnosis || "New consult",
        }),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error || "Failed to create patient");
        return;
      }

      const newId = json.id || json.patientId || json.docId;
      if (!newId) {
        setError("Patient created but no ID returned from API.");
        return;
      }

      // Navigate straight into consult
      router.push(`/patients/${newId}`);
    } catch (e: any) {
      console.error("CREATE PATIENT ERROR:", e);
      setError(e.message || "Unexpected error while creating patient");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-teal-700">
          New Patient via ID Scan
        </h1>
        <p className="text-gray-600">
          For now, paste the text read from the ID (or the 13-digit ID number).
          Later this will be fed directly from camera/OCR.
        </p>

        <div className="space-y-2">
          <label className="font-medium">Scanned ID Text / Number</label>
          <Textarea
            value={idText}
            onChange={(e) => setIdText(e.target.value)}
            placeholder="Paste the ID scan text here (must contain a 13-digit SA ID number)..."
            rows={4}
          />
        </div>

        <Button onClick={handleExtract} disabled={loadingExtract || !idText.trim()}>
          {loadingExtract ? "Extracting..." : "Extract from ID"}
        </Button>

        {error && (
          <p className="text-red-600 text-sm mt-2">
            {error}
          </p>
        )}
      </Card>

      {parsed && (
        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold text-teal-700">
            Confirm Patient Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="font-medium">Full Name</label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Johnathan Bernard"
              />
            </div>

            <div className="space-y-2">
              <label className="font-medium">ID Number</label>
              <Input value={parsed.idNumber} disabled />
            </div>

            <div className="space-y-2">
              <label className="font-medium">Date of Birth</label>
              <Input value={parsed.dob} disabled />
            </div>

            <div className="space-y-2">
              <label className="font-medium">Age</label>
              <Input value={parsed.age.toString()} disabled />
            </div>

            <div className="space-y-2">
              <label className="font-medium">Gender</label>
              <Input value={parsed.gender} disabled />
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-medium">Initial Diagnosis / Reason</label>
            <Input
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="e.g. Chest pain, rule out ACS"
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleCreatePatient} disabled={creating}>
              {creating ? "Creating & starting consult..." : "Create Patient & Start Consult"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
