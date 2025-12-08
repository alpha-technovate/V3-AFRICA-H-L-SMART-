// src/app/.../PatientDetailPage.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
  User,
  FileText,
  Book,
  Stethoscope,
  Pill,
  Paperclip,
  Calendar,
  Share2,
  Bell,
  Bot,
  Mic,
  Square,
  HeartPulse,
  Loader2,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import GlobalAISearch from "@/components/GlobalAISearch";
import PatientAISummaryCard from "@/components/ai/PatientAISummaryCard";
import GeneratePDFButton from "@/components/buttons/GeneratePDFButton";
import GenerateMotivationalLetterButton from "@/components/buttons/GenerateMotivationalLetterButton";

import VitalsSection from "@/components/vitals/VitalsSection";
import TreatmentNotesSection from "@/components/treatment/TreatmentNotesSection";
import HistorySection from "@/components/history/HistorySection";
import InvestigationsSection from "@/components/investigations/InvestigationsSection";
import ScansSection from "@/components/scans/ScansSection";
import VisitsSection from "@/components/visits/VisitsSection";
import ReferralForm from "@/components/referrals/ReferralForm";
import PatientReferralsList from "@/components/referrals/PatientReferralsList";

import AllergiesCard from "@/components/right/AllergiesCard";
import ChronicCard from "@/components/right/ChronicCard";
import CareTeamCard from "@/components/right/CareTeamCard";
import LevelOfCareCard from "@/components/right/LevelOfCareCard";
import RecentActivityCard from "@/components/right/RecentActivityCard";

// ---------- AI intake types ----------

type AIIntake = {
  problems?: Array<{
    name: string;
    status?: "Active" | "Resolved" | "Monitoring" | string;
    onsetDate?: string | null;
    notes?: string | null;
    icd10Code?: string | null;
    icd10Description?: string | null;
  }>;
  chronicConditions?: Array<{
    name: string;
    severity?: "Mild" | "Moderate" | "Severe" | string;
    status?: "Active" | "Controlled" | "Remission" | "Inactive" | string;
    notes?: string | null;
    icd10Code?: string | null;
    icd10Description?: string | null;
  }>;
  medications?: Array<{
    name: string;
    dose?: string | null;
    route?: string | null;
    frequency?: string | null;
    status?: "Active" | "Stopped" | string;
    class?: string | null;
    notes?: string | null;
  }>;
  allergies?: Array<{
    allergen: string;
    type?: "Drug" | "Food" | "Environmental" | "Other" | string;
    severity?: "Mild" | "Moderate" | "Severe" | "Life-Threatening" | string;
    reaction?: string | null;
    notes?: string | null;
  }>;
  notes?: {
    soapNote?: string;
  };
};

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  idNumber?: string;
  diagnosis?: string;
  contactNumber?: string;
  address?: string;
  medicalAid?: string;
  medicalAidNumber?: string;
  medicalAidPlan?: string;
  medicalAidMainMember?: string;
  medicalAidContactNumber?: string;
  nextOfKinName?: string;
  nextOfKinRelationship?: string;
  nextOfKinPhone?: string;
  altContactName?: string;
  altContactPhone?: string;
  notes?: string;
  age?: number | string;
  source?: string;
  photoUrl?: string;
  initialConsultTranscript?: string | null;
  aiIntake?: AIIntake | null;
}

// ---------- SPECIALIST DROPDOWN ----------

type Specialist = {
  id: string;
  name: string;
  specialty?: string;
};

const mockSpecialists: Specialist[] = [
  { id: "pillay", name: "Dr Jehron Pillay", specialty: "Cardiothoracic Surgeon" },
  { id: "chen", name: "Dr James Chen", specialty: "Cardiologist" },
  { id: "maharaj", name: "Dr Sanjay Maharaj", specialty: "Physician" },
];

function ShareReferralDropdown({
  patientId,
  patientName,
}: {
  patientId: string;
  patientName: string;
}) {
  const [open, setOpen] = useState(false);
  const [specialistId, setSpecialistId] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSend() {
    if (!specialistId) return;

    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          specialistId,
          note,
        }),
      });

      if (!res.ok) {
        setError("Referral API not wired yet. Create /api/referrals.");
        return;
      }

      const json = await res.json().catch(() => null);
      if (!json || json.success === false) {
        setError(json?.error || "Failed to send referral.");
        return;
      }

      setSuccess("Referral sent to specialist.");
      setNote("");
    } catch (err) {
      console.error("Referral error:", err);
      setError("Network error sending referral.");
    } finally {
      setSending(false);
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-4 text-sm font-medium border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
        >
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 p-4 space-y-4 border-slate-200 bg-white shadow-lg"
      >
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-900">
            Refer {patientName}
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">
            Choose a specialist and add a short note. This will create a referral
            for their inbox.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700">
            Specialist
          </label>
          <select
            className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1 transition-shadow"
            value={specialistId}
            onChange={(e) => setSpecialistId(e.target.value)}
          >
            <option value="">Select specialist…</option>
            {mockSpecialists.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.name} {doc.specialty ? `— ${doc.specialty}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700">
            Note to specialist (optional)
          </label>
          <Textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="text-sm rounded-lg resize-none"
            placeholder="Reason for referral, urgency, key findings…"
          />
        </div>

        {error && (
          <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        {success && (
          <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            {success}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => setOpen(false)}
          >
            Close
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-9 bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
            disabled={!specialistId || sending}
            onClick={handleSend}
          >
            {sending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                Sending…
              </>
            ) : (
              "Send referral"
            )}
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---------- MAIN PAGE ----------

export default function PatientDetailPage() {
  const { id } = useParams();
  const patientId = Array.isArray(id) ? id[0] : id;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  const [personalEditing, setPersonalEditing] = useState(false);
  const [personalSaving, setPersonalSaving] = useState(false);
  const [personalError, setPersonalError] = useState<string | null>(null);
  const [personalSavedAt, setPersonalSavedAt] = useState<string | null>(null);

  const [personalForm, setPersonalForm] = useState({
    idNumber: "",
    dateOfBirth: "",
    gender: "",
    contactNumber: "",
    address: "",
    medicalAid: "",
    medicalAidNumber: "",
    medicalAidPlan: "",
    medicalAidMainMember: "",
    medicalAidContactNumber: "",
    nextOfKinName: "",
    nextOfKinRelationship: "",
    nextOfKinPhone: "",
    altContactName: "",
    altContactPhone: "",
    notes: "",
  });

  const [personalListening, setPersonalListening] = useState(false);
  const personalRecRef = useRef<any | null>(null);

  const [showIntakeReview, setShowIntakeReview] = useState(false);

  // --------------------------------------------------
  // LOAD PATIENT
  // --------------------------------------------------
  useEffect(() => {
    async function load() {
      if (!patientId) return;

      try {
        const res = await fetch(`/api/patients?id=${patientId}`);
        const json = await res.json();

        if (json.success && json.data) {
          const raw = json.data;

          const p: Patient = {
            ...raw,
            firstName: raw.firstName ?? "Unknown",
            lastName: raw.lastName ?? "",
            contactNumber: raw.contactNumber ?? raw.phone,
            dateOfBirth: raw.dateOfBirth ?? raw.dob,
            aiIntake: raw.aiIntake ?? null,
            initialConsultTranscript: raw.initialConsultTranscript ?? null,
          };

          setPatient(p);

          setPersonalForm({
            idNumber: p.idNumber ?? "",
            dateOfBirth: p.dateOfBirth ?? "",
            gender: p.gender ?? "",
            contactNumber: p.contactNumber ?? "",
            address: p.address ?? "",
            medicalAid: p.medicalAid ?? "",
            medicalAidNumber: p.medicalAidNumber ?? "",
            medicalAidPlan: p.medicalAidPlan ?? "",
            medicalAidMainMember: p.medicalAidMainMember ?? "",
            medicalAidContactNumber: p.medicalAidContactNumber ?? "",
            nextOfKinName: p.nextOfKinName ?? "",
            nextOfKinRelationship: p.nextOfKinRelationship ?? "",
            nextOfKinPhone: p.nextOfKinPhone ?? "",
            altContactName: p.altContactName ?? "",
            altContactPhone: p.altContactPhone ?? "",
            notes: p.notes ?? "",
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [patientId]);

  useEffect(() => {
    return () => {
      if (personalRecRef.current) {
        try {
          personalRecRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-cyan-50">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto" />
          <p className="text-sm text-slate-600">Loading patient…</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-cyan-50">
        <div className="text-center space-y-2">
          <p className="text-red-600 font-medium">Patient not found</p>
          <p className="text-sm text-slate-600">Please check the patient ID and try again.</p>
        </div>
      </div>
    );
  }

  const name = `${patient.firstName} ${patient.lastName}`.trim();
  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "PT";

  const aiIntake: AIIntake | null | undefined = patient.aiIntake;
  const hasIntake =
    aiIntake &&
    (aiIntake.problems?.length ||
      aiIntake.chronicConditions?.length ||
      aiIntake.medications?.length ||
      aiIntake.allergies?.length ||
      aiIntake.notes?.soapNote);

  const intakeCounts = {
    problems: aiIntake?.problems?.length ?? 0,
    chronic: aiIntake?.chronicConditions?.length ?? 0,
    meds: aiIntake?.medications?.length ?? 0,
    allergies: aiIntake?.allergies?.length ?? 0,
  };

  // --------------------------------------------------
  // PERSONAL HANDLERS
  // --------------------------------------------------
  const handlePersonalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPersonalForm((prev) => ({ ...prev, [name]: value }));
  };

  const savePersonal = async () => {
    if (!patient) return;
    setPersonalSaving(true);
    setPersonalError(null);

    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: patient.id,
          ...personalForm,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save personal details.");
      }

      setPatient((prev) =>
        prev
          ? ({
              ...prev,
              ...personalForm,
            } as Patient)
          : prev
      );

      setPersonalEditing(false);
      setPersonalSavedAt(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch (err: any) {
      console.error("Save personal details error:", err);
      setPersonalError(err.message || "Failed to save personal details.");
    } finally {
      setPersonalSaving(false);
    }
  };

  const cancelPersonalEdit = () => {
    if (!patient) return;
    setPersonalForm({
      idNumber: patient.idNumber ?? "",
      dateOfBirth: patient.dateOfBirth ?? "",
      gender: patient.gender ?? "",
      contactNumber: patient.contactNumber ?? "",
      address: patient.address ?? "",
      medicalAid: patient.medicalAid ?? "",
      medicalAidNumber: patient.medicalAidNumber ?? "",
      medicalAidPlan: patient.medicalAidPlan ?? "",
      medicalAidMainMember: patient.medicalAidMainMember ?? "",
      medicalAidContactNumber: patient.medicalAidContactNumber ?? "",
      nextOfKinName: patient.nextOfKinName ?? "",
      nextOfKinRelationship: patient.nextOfKinRelationship ?? "",
      nextOfKinPhone: patient.nextOfKinPhone ?? "",
      altContactName: patient.altContactName ?? "",
      altContactPhone: patient.altContactPhone ?? "",
      notes: patient.notes ?? "",
    });
    setPersonalEditing(false);
    setPersonalError(null);
  };

  const startPersonalVoice = () => {
    if (typeof window === "undefined") return;
    const Speech =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;

    if (!Speech) {
      setPersonalError("This browser does not support voice input.");
      return;
    }

    const rec = new Speech();
    rec.lang = "en-US";
    rec.interimResults = false;

    personalRecRef.current = rec;
    setPersonalListening(true);
    setPersonalError(null);

    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setPersonalForm((prev) => ({
        ...prev,
        notes: prev.notes ? `${prev.notes}\n${transcript}` : transcript,
      }));
      setPersonalListening(false);
    };

    rec.onerror = (event: any) => {
      console.error("Personal details voice error:", event.error);
      setPersonalError("Voice input failed. Please try again.");
      setPersonalListening(false);
    };

    rec.onend = () => {
      setPersonalListening(false);
    };

    rec.start();
  };

  const stopPersonalVoice = () => {
    if (personalRecRef.current) {
      try {
        personalRecRef.current.stop();
      } catch {
        // ignore
      }
      personalRecRef.current = null;
    }
    setPersonalListening(false);
  };

  // --------------------------------------------------
  // RENDER - REFINED CLASSES
  // --------------------------------------------------
  return (
    // ✅ 5. Ensure NO horizontal scroll (on body div)
    <div className="bg-slate-50 min-h-screen pt-4 pb-20 overflow-x-hidden">
      {/* HEADER BANNER - Container setup is clean */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* ✅ 4. The header card is too big — reduce shadow + radius */}
        <Card className="w-full rounded-2xl border border-slate-100 bg-white shadow-md">
          {/* ✅ 2. Reduce padding inside CardContent */}
          <CardContent className="p-3 sm:p-5">
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {/* 🎯 PRO TIP: Reduce Avatar size on mobile */}
                <Avatar className="h-12 w-12 sm:h-20 sm:w-20 md:h-24 md:w-24 border-4 border-teal-50 shadow-md ring-2 ring-white">
                  <AvatarImage src={patient.photoUrl || ""} alt={name} />
                  <AvatarFallback className="text-xl sm:text-2xl md:text-3xl bg-gradient-to-br from-teal-100 to-cyan-100 text-teal-700 font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Name + demographics */}
              <div className="flex-1 min-w-0 space-y-2.5 sm:space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                    {name}
                  </h1>
                  <Badge className="bg-blue-100 text-blue-700 border-0 text-[10px] sm:text-xs font-semibold px-2 py-0.5">
                    AHLI Sync
                  </Badge>
                  <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] sm:text-xs font-semibold px-2 py-0.5">
                    Stable
                  </Badge>
                  {patient.source === "idScan" && (
                    <Badge className="bg-teal-100 text-teal-700 border-0 text-[10px] sm:text-xs font-semibold px-2 py-0.5">
                      ID Scan
                    </Badge>
                  )}
                </div>

                <div className="text-xs sm:text-sm text-slate-600 space-y-1">
                  <p className="flex flex-wrap gap-x-3 gap-y-1">
                    <span className="font-medium">
                      DOB: {patient.dateOfBirth ?? "Unknown"}
                      {patient.age && ` (${patient.age})`}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span>{patient.gender ?? "Unknown"}</span>
                    <span className="text-slate-400">•</span>
                    <span className="font-mono text-xs">{patient.idNumber ?? "No ID"}</span>
                  </p>
                </div>

                <div className="text-xs sm:text-sm">
                  <span className="font-semibold text-teal-700">Primary diagnosis: </span>
                  <span className="text-slate-700">{patient.diagnosis ?? "Not yet captured"}</span>
                </div>
              </div>

              {/* Header action */}
              <div className="w-full sm:w-auto sm:self-start">
                <ShareReferralDropdown patientId={patient.id} patientName={name} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MAIN GRID */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8 grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6">
        {/* LEFT COLUMN */}
        {/* ✅ 3. Reduce spacing BETWEEN cards (gap-3 sm:gap-5) */}
        <div className="flex flex-col gap-3 sm:gap-5">
          {/* AI tools row - REWRITTEN BLOCK */}
          <Card className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm sm:shadow-md w-full overflow-hidden">
            <CardContent className="p-3 sm:p-5 flex flex-col gap-3">
              {/* Global AI Search - Full width */}
              <div className="w-full">
                <GlobalAISearch />
              </div>

              {/* Buttons - Stacked on mobile (flex-col) and centered (gap-3) */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Generate PDF Button - Full width on mobile, responsive width on larger screens */}
                <div className="w-full sm:w-1/2">
                  <GeneratePDFButton patient={patient} className="w-full" />
                </div>

                {/* Generate Motivational Letter Button - Full width on mobile, responsive width on larger screens */}
                <div className="w-full sm:w-1/2">
                  <GenerateMotivationalLetterButton patientId={patient.id} className="w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
          {/* END AI tools row */}

          {/* Primary diagnosis card */}
          {/* ✅ 1. Make all cards use mobile-friendly padding + radius */}
          <Card className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm sm:shadow-md w-full overflow-hidden">
            <CardHeader className="pb-3 space-y-1">
              <CardTitle className="text-base sm:text-lg font-semibold text-slate-900">
                Primary Diagnosis
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-slate-600">
                Quick clinical snapshot for this patient
              </CardDescription>
            </CardHeader>
            {/* ✅ 2. Reduce padding inside CardContent (removed default padding and used custom spacing instead for this section) */}
            <CardContent className="px-3 sm:px-5 pb-3 sm:pb-5 space-y-2">
              <p className="text-sm sm:text-base font-medium text-slate-800">
                {patient.diagnosis ?? "Diagnosis not yet captured."}
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                This can later be auto-filled from AI consult notes and the problem list.
              </p>
            </CardContent>
          </Card>

          {/* TABS / RECORD AREA */}
          {/* ✅ 1. Make all cards use mobile-friendly padding + radius */}
          <Card className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm sm:shadow-md w-full overflow-hidden">
            <CardHeader className="pb-3 space-y-1">
              <CardTitle className="text-base sm:text-lg font-semibold text-slate-900">
                Patient Record
              </CardTitle>
              <CardDescription className="text-xs text-slate-600">
                Navigate between summary, history, investigations, and more
              </CardDescription>
            </CardHeader>
            {/* ✅ 2. Reduce padding inside CardContent */}
            <CardContent className="pt-0 p-3 sm:p-5">
              <Tabs defaultValue="summary" className="w-full">
                {/* TABS BAR */}
                <div className="w-full overflow-x-auto pb-2">
                  <TabsList className="inline-flex min-w-full justify-start gap-1 rounded-xl bg-slate-50 p-1.5">
                    <TabsTrigger
                      value="summary"
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                    >
                      <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span>Summary</span>
                    </TabsTrigger>

                    <TabsTrigger
                      value="personal"
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                    >
                      <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span>Personal</span>
                    </TabsTrigger>

                    <TabsTrigger
                      value="clinical"
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                    >
                      <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span>Clinical</span>
                    </TabsTrigger>

                    <TabsTrigger
                      value="history"
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                    >
                      <Book className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span>History</span>
                    </TabsTrigger>

                    <TabsTrigger
                      value="investigations"
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                    >
                      <Stethoscope className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Investigations</span>
                      <span className="sm:hidden">Invest.</span>
                    </TabsTrigger>

                    <TabsTrigger
                      value="treatment"
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                    >
                      <Pill className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span>Treatment</span>
                    </TabsTrigger>

                    <TabsTrigger
                      value="scans"
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                    >
                      <Paperclip className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span>Scans</span>
                    </TabsTrigger>

                    <TabsTrigger
                      value="visits"
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                    >
                      <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span>Visits</span>
                    </TabsTrigger>

                    <TabsTrigger
                      value="referral"
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                    >
                      <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span>Referral</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* SUMMARY TAB */}
                <TabsContent value="summary" className="mt-6 space-y-5">
                  {/* AI CONSULT INTAKE */}
                  {/* ✅ 1. Make all cards use mobile-friendly padding + radius (note: special case gradient card) */}
                  <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-100 shadow-sm rounded-xl sm:rounded-2xl overflow-hidden">
                    <CardHeader className="pb-3 space-y-2 px-4 pt-4 sm:px-6 sm:pt-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="space-y-1">
                          <CardTitle className="text-sm sm:text-base text-teal-800 flex items-center gap-2">
                            <Stethoscope className="h-4 w-4 sm:h-5 sm:w-5" />
                            AI Consult Intake (ID Scan)
                          </CardTitle>
                          <CardDescription className="text-xs text-teal-700/80 leading-relaxed">
                            Structured intake from the first voice consult
                          </CardDescription>
                        </div>

                        {hasIntake && (
                          <div className="flex flex-wrap gap-1.5 text-[10px] sm:text-xs">
                            <Badge className="bg-white/80 text-slate-700 border-0 shadow-sm">
                              Problems: <span className="font-bold ml-1">{intakeCounts.problems}</span>
                            </Badge>
                            <Badge className="bg-white/80 text-slate-700 border-0 shadow-sm">
                              Chronic: <span className="font-bold ml-1">{intakeCounts.chronic}</span>
                            </Badge>
                            <Badge className="bg-white/80 text-slate-700 border-0 shadow-sm">
                              Meds: <span className="font-bold ml-1">{intakeCounts.meds}</span>
                            </Badge>
                            <Badge className="bg-white/80 text-slate-700 border-0 shadow-sm">
                              Allergies: <span className="font-bold ml-1">{intakeCounts.allergies}</span>
                            </Badge>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    {/* ✅ 2. Reduce padding inside CardContent (manually adjusted to match p-3 sm:p-5 aesthetic) */}
                    <CardContent className="p-4 sm:p-6 space-y-3">
                      {hasIntake ? (
                        <>
                          {aiIntake?.notes?.soapNote && (
                            <div className="rounded-xl border-0 bg-white/80 backdrop-blur-sm px-4 py-3 shadow-sm">
                              <p className="text-xs font-semibold text-teal-800 mb-2">
                                AI SOAP Note (draft)
                              </p>
                              <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                                {aiIntake.notes.soapNote}
                              </p>
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                            <p className="text-xs text-teal-700/90 leading-relaxed">
                              Review intake details below. In the next phase you'll be able to push items directly into your patient record.
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-xs border-teal-200 bg-white/50 text-teal-700 hover:bg-white hover:border-teal-300 font-medium transition-colors whitespace-nowrap"
                              onClick={() => setShowIntakeReview((prev) => !prev)}
                            >
                              {showIntakeReview ? "Hide details" : "Review details"}
                            </Button>
                          </div>

                          {showIntakeReview && (
                            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                              {/* Problems */}
                              <div className="space-y-2">
                                <p className="font-semibold text-slate-800 flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-teal-600" />
                                  Problems
                                </p>
                                {aiIntake?.problems && aiIntake.problems.length > 0 ? (
                                  <ul className="space-y-2">
                                    {aiIntake.problems.map((p, idx) => (
                                      <li key={idx} className="rounded-xl bg-white/80 backdrop-blur-sm px-3 py-2.5 shadow-sm">
                                        <div className="font-medium text-slate-900">{p.name}</div>
                                        {p.status && (
                                          <span className="text-[10px] uppercase tracking-wide text-slate-500 mt-0.5">
                                            {p.status}
                                          </span>
                                        )}
                                        {p.icd10Code && (
                                          <div className="text-[10px] text-slate-600 mt-1">
                                            ICD-10: <span className="font-mono">{p.icd10Code}</span>
                                            {p.icd10Description && ` — ${p.icd10Description}`}
                                          </div>
                                        )}
                                        {p.notes && (
                                          <div className="text-xs text-slate-600 mt-1 leading-relaxed">
                                            {p.notes}
                                          </div>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-xs text-slate-500 italic">
                                    No explicit problems identified
                                  </p>
                                )}
                              </div>

                              {/* Chronic / Meds / Allergies */}
                              <div className="space-y-4">
                                {/* Chronic */}
                                <div className="space-y-2">
                                  <p className="font-semibold text-slate-800 flex items-center gap-2">
                                    <HeartPulse className="h-4 w-4 text-rose-500" />
                                    Chronic Conditions
                                  </p>
                                  {aiIntake?.chronicConditions && aiIntake.chronicConditions.length > 0 ? (
                                    <ul className="space-y-2">
                                      {aiIntake.chronicConditions.map((c, idx) => (
                                        <li key={idx} className="rounded-xl bg-white/80 backdrop-blur-sm px-3 py-2.5 shadow-sm">
                                          <div className="font-medium text-slate-900">{c.name}</div>
                                          {c.status && (
                                            <span className="text-[10px] uppercase tracking-wide text-slate-500 mt-0.5">
                                              {c.status}
                                            </span>
                                          )}
                                          {c.icd10Code && (
                                            <div className="text-[10px] text-slate-600 mt-1">
                                              ICD-10: <span className="font-mono">{c.icd10Code}</span>
                                              {c.icd10Description && ` — ${c.icd10Description}`}
                                            </div>
                                          )}
                                          {c.notes && (
                                            <div className="text-xs text-slate-600 mt-1 leading-relaxed">
                                              {c.notes}
                                            </div>
                                          )}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-xs text-slate-500 italic">
                                      No chronic conditions inferred
                                    </p>
                                  )}
                                </div>

                                {/* Meds */}
                                <div className="space-y-2">
                                  <p className="font-semibold text-slate-800 flex items-center gap-2">
                                    <Pill className="h-4 w-4 text-emerald-600" />
                                    Medications
                                  </p>
                                  {aiIntake?.medications && aiIntake.medications.length > 0 ? (
                                    <ul className="space-y-2">
                                      {aiIntake.medications.map((m, idx) => (
                                        <li key={idx} className="rounded-xl bg-white/80 backdrop-blur-sm px-3 py-2.5 shadow-sm">
                                          <div className="font-medium text-slate-900">{m.name}</div>
                                          {m.status && (
                                            <span className="text-[10px] uppercase tracking-wide text-slate-500 mt-0.5">
                                              {m.status}
                                            </span>
                                          )}
                                          <div className="text-xs text-slate-600 mt-1">
                                            {[m.dose, m.route, m.frequency].filter(Boolean).join(" · ")}
                                          </div>
                                          {m.class && (
                                            <div className="text-[10px] text-slate-500 mt-1">
                                              Class: {m.class}
                                            </div>
                                          )}
                                          {m.notes && (
                                            <div className="text-xs text-slate-600 mt-1 leading-relaxed">
                                              {m.notes}
                                            </div>
                                          )}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-xs text-slate-500 italic">
                                      No medication list extracted
                                    </p>
                                  )}
                                </div>

                                {/* Allergies */}
                                <div className="space-y-2">
                                  <p className="font-semibold text-slate-800 flex items-center gap-2">
                                    <Pill className="h-4 w-4 text-red-500" />
                                    Allergies
                                  </p>
                                  {aiIntake?.allergies && aiIntake.allergies.length > 0 ? (
                                    <ul className="space-y-2">
                                      {aiIntake.allergies.map((a, idx) => (
                                        <li key={idx} className="rounded-xl bg-white/80 backdrop-blur-sm px-3 py-2.5 shadow-sm">
                                          <div className="font-medium text-slate-900">{a.allergen}</div>
                                          {a.severity && (
                                            <span className="text-[10px] uppercase tracking-wide text-slate-500 mt-0.5">
                                              {a.severity}
                                            </span>
                                          )}
                                          <div className="text-xs text-slate-600 mt-1">
                                            {a.type && `${a.type} allergy`}
                                            {a.reaction && ` · Reaction: ${a.reaction}`}
                                          </div>
                                          {a.notes && (
                                            <div className="text-xs text-slate-600 mt-1 leading-relaxed">
                                              {a.notes}
                                            </div>
                                          )}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-xs text-slate-500 italic">
                                      No allergies mentioned in intake
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-teal-700/80 leading-relaxed">
                          No AI consult intake found yet. When you create a patient via ID scan + voice consult, the structured intake will appear here.
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* AI Summary card */}
                  {/* ✅ 1. Make all cards use mobile-friendly padding + radius */}
                  <Card className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm sm:shadow-md w-full overflow-hidden">
                    <CardHeader className="pb-3 space-y-1 p-3 sm:p-5">
                      <CardTitle className="text-sm sm:text-base text-teal-700 flex items-center gap-2">
                        <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
                        AI Summary Assistant
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-600">
                        Generate a concise, risk-focused summary from the record
                      </CardDescription>
                    </CardHeader>
                    {/* ✅ 2. Reduce padding inside CardContent */}
                    <CardContent className="p-3 sm:p-5 pt-0">
                      <PatientAISummaryCard patientId={patient.id} />
                    </CardContent>
                  </Card>

                  <VitalsSection patientId={patient.id} />
                </TabsContent>

                {/* PERSONAL TAB */}
                <TabsContent value="personal" className="mt-6">
                  {/* ✅ 1. Make all cards use mobile-friendly padding + radius */}
                  <Card className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm sm:shadow-md w-full overflow-hidden p-4 sm:p-6 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                          Personal Details
                        </h2>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Demographics, contact info, medical aid, and next of kin
                        </p>
                      </div>

                      <div className="flex flex-col items-start sm:items-end gap-2">
                        {personalSavedAt && !personalSaving && !personalError && (
                          <span className="text-xs text-emerald-600 font-medium">
                            Saved at {personalSavedAt}
                          </span>
                        )}
                        {personalError && (
                          <span className="text-xs text-red-600">{personalError}</span>
                        )}
                        <div className="flex gap-2">
                          {personalEditing && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-9 text-xs"
                              onClick={cancelPersonalEdit}
                              disabled={personalSaving}
                            >
                              Cancel
                            </Button>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            className="h-9 text-xs bg-teal-600 hover:bg-teal-700 text-white font-medium"
                            onClick={personalEditing ? savePersonal : () => setPersonalEditing(true)}
                            disabled={personalSaving}
                          >
                            {personalSaving ? "Saving…" : personalEditing ? "Save" : "Edit"}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Basic info */}
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-slate-700">
                            ID / Passport number
                          </label>
                          <Input
                            name="idNumber"
                            value={personalForm.idNumber}
                            onChange={handlePersonalChange}
                            disabled={!personalEditing || personalSaving}
                            className="text-sm h-10 rounded-lg"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-slate-700">
                            Date of birth
                          </label>
                          <Input
                            type="date"
                            name="dateOfBirth"
                            value={personalForm.dateOfBirth}
                            onChange={handlePersonalChange}
                            disabled={!personalEditing || personalSaving}
                            className="text-sm h-10 rounded-lg"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-slate-700">
                            Gender
                          </label>
                          <Input
                            name="gender"
                            value={personalForm.gender}
                            onChange={handlePersonalChange}
                            disabled={!personalEditing || personalSaving}
                            className="text-sm h-10 rounded-lg"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-slate-700">
                            Primary contact number
                          </label>
                          <Input
                            name="contactNumber"
                            value={personalForm.contactNumber}
                            onChange={handlePersonalChange}
                            disabled={!personalEditing || personalSaving}
                            className="text-sm h-10 rounded-lg"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-slate-700">
                            Home address
                          </label>
                          <Textarea
                            name="address"
                            rows={3}
                            value={personalForm.address}
                            onChange={handlePersonalChange}
                            disabled={!personalEditing || personalSaving}
                            className="text-sm rounded-lg resize-none"
                            placeholder="Full address"
                          />
                        </div>
                      </div>

                      {/* Medical aid + contacts */}
                      <div className="space-y-5">
                        <div className="space-y-3">
                          <p className="text-sm font-semibold text-slate-800">Medical Aid</p>
                          <div className="space-y-3">
                            <div className="space-y-1.5">
                              <label className="text-xs text-slate-600">Scheme name</label>
                              <Input
                                name="medicalAid"
                                value={personalForm.medicalAid}
                                onChange={handlePersonalChange}
                                disabled={!personalEditing || personalSaving}
                                className="text-sm h-10 rounded-lg"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs text-slate-600">Membership number</label>
                              <Input
                                name="medicalAidNumber"
                                value={personalForm.medicalAidNumber}
                                onChange={handlePersonalChange}
                                disabled={!personalEditing || personalSaving}
                                className="text-sm h-10 rounded-lg"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs text-slate-600">Plan / option</label>
                              <Input
                                name="medicalAidPlan"
                                value={personalForm.medicalAidPlan}
                                onChange={handlePersonalChange}
                                disabled={!personalEditing || personalSaving}
                                className="text-sm h-10 rounded-lg"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs text-slate-600">Main member</label>
                              <Input
                                name="medicalAidMainMember"
                                value={personalForm.medicalAidMainMember}
                                onChange={handlePersonalChange}
                                disabled={!personalEditing || personalSaving}
                                className="text-sm h-10 rounded-lg"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs text-slate-600">Call centre number</label>
                              <Input
                                name="medicalAidContactNumber"
                                value={personalForm.medicalAidContactNumber}
                                onChange={handlePersonalChange}
                                disabled={!personalEditing || personalSaving}
                                className="text-sm h-10 rounded-lg"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-slate-100 pt-5 space-y-3">
                          <p className="text-sm font-semibold text-slate-800">Emergency Contacts</p>
                          <div className="space-y-3">
                            <div className="space-y-1.5">
                              <label className="text-xs text-slate-600">Next of kin name</label>
                              <Input
                                name="nextOfKinName"
                                value={personalForm.nextOfKinName}
                                onChange={handlePersonalChange}
                                disabled={!personalEditing || personalSaving}
                                className="text-sm h-10 rounded-lg"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs text-slate-600">Relationship</label>
                              <Input
                                name="nextOfKinRelationship"
                                value={personalForm.nextOfKinRelationship}
                                onChange={handlePersonalChange}
                                disabled={!personalEditing || personalSaving}
                                className="text-sm h-10 rounded-lg"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs text-slate-600">Phone</label>
                              <Input
                                name="nextOfKinPhone"
                                value={personalForm.nextOfKinPhone}
                                onChange={handlePersonalChange}
                                disabled={!personalEditing || personalSaving}
                                className="text-sm h-10 rounded-lg"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs text-slate-600">Alternate contact (name)</label>
                              <Input
                                name="altContactName"
                                value={personalForm.altContactName}
                                onChange={handlePersonalChange}
                                disabled={!personalEditing || personalSaving}
                                placeholder="Name"
                                className="text-sm h-10 rounded-lg"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs text-slate-600">Alternate contact (phone)</label>
                              <Input
                                name="altContactPhone"
                                value={personalForm.altContactPhone}
                                onChange={handlePersonalChange}
                                disabled={!personalEditing || personalSaving}
                                placeholder="Phone"
                                className="text-sm h-10 rounded-lg"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Notes + voice */}
                    <div className="pt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-slate-800">
                          Notes / Social context
                        </label>
                        <button
                          type="button"
                          onClick={personalListening ? stopPersonalVoice : startPersonalVoice}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                            personalListening
                              ? "bg-red-100 text-red-700 hover:bg-red-200"
                              : "bg-teal-100 text-teal-700 hover:bg-teal-200"
                          }`}
                          disabled={personalSaving || !personalEditing}
                        >
                          {personalListening ? (
                            <>
                              <Square className="h-3 w-3" />
                              Stop
                            </>
                          ) : (
                            <>
                              <Mic className="h-3 w-3" />
                              Voice
                            </>
                          )}
                        </button>
                      </div>
                      <Textarea
                        name="notes"
                        rows={4}
                        value={personalForm.notes}
                        onChange={handlePersonalChange}
                        disabled={!personalEditing || personalSaving}
                        className="text-sm rounded-lg resize-none"
                        placeholder="Family support, living situation, key risks. You can dictate this."
                      />
                    </div>
                  </Card>
                </TabsContent>

                {/* CLINICAL TAB */}
                <TabsContent value="clinical" className="mt-6">
                  {/* ✅ 1. Make all cards use mobile-friendly padding + radius */}
                  <Card className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm sm:shadow-md w-full overflow-hidden p-4 sm:p-6">
                    <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                      Clinical Details
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                      This section can be auto-populated from AI consult notes, problem lists, and medication reconciliation.
                    </p>
                  </Card>
                </TabsContent>

                {/* OTHER TABS */}
                <TabsContent value="history" className="mt-6">
                  <HistorySection patientId={patient.id} />
                </TabsContent>

                <TabsContent value="investigations" className="mt-6">
                  <InvestigationsSection patientId={patient.id} />
                </TabsContent>

                <TabsContent value="treatment" className="mt-6">
                  <TreatmentNotesSection patientId={patient.id} />
                </TabsContent>

                <TabsContent value="scans" className="mt-6">
                  <ScansSection patientId={patient.id} />
                </TabsContent>

                <TabsContent value="visits" className="mt-6">
                  <VisitsSection patientId={patient.id} />
                </TabsContent>

                <TabsContent value="referral" className="mt-6 space-y-6">
                  <ReferralForm patient={patient} />
                  <PatientReferralsList patientId={patient.id} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT SIDEBAR */}
        {/* ✅ 5. Ensure NO horizontal scroll (on aside) */}
        <aside className="space-y-4 w-full xl:w-auto overflow-x-hidden xl:sticky xl:top-6 self-start">

          {/* AI Assistant */}
          {/* ✅ 1. Make all cards use mobile-friendly padding + radius */}
          <Card className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm sm:shadow-md w-full overflow-hidden">
            <CardHeader className="p-3 pb-2 space-y-1 sm:p-4 sm:pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900">
                <Bot className="h-4 w-4 text-teal-600" />
                AI Assistant
              </CardTitle>
              <CardDescription className="text-xs text-slate-600">
                Use the floating button for voice or chat
              </CardDescription>
            </CardHeader>
            {/* ✅ 2. Reduce padding inside CardContent */}
            <CardContent className="p-3 sm:p-4 pt-0">
              <Button className="w-full h-10 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium">
                <Stethoscope className="mr-2 h-4 w-4" />
                Start Voice Note
              </Button>
            </CardContent>
          </Card>

          {/* Level of care */}
          {/* ✅ 1. Make all cards use mobile-friendly padding + radius */}
          <Card className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm sm:shadow-md w-full overflow-hidden p-3 sm:p-4">
            <LevelOfCareCard patientId={patient.id} />
          </Card>

          {/* Allergies */}
          <AllergiesCard patientId={patient.id} />

          {/* Chronic conditions */}
          <ChronicCard patientId={patient.id} />

          {/* Care team */}
          {/* ✅ 1. Make all cards use mobile-friendly padding + radius */}
          <Card className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm sm:shadow-md w-full overflow-hidden p-3 sm:p-4">
            <CareTeamCard patientId={patient.id} />
          </Card>

          {/* Recent activity */}
          {/* ✅ 1. Make all cards use mobile-friendly padding + radius */}
          <Card className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm sm:shadow-md w-full overflow-hidden p-3 sm:p-4">
            <RecentActivityCard patientId={patient.id} />
          </Card>
        </aside>
      </div>
    </div>
  );
}