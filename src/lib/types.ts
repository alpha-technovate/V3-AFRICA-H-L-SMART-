// src/lib/types.ts
import type { LucideIcon } from "lucide-react";
import { Timestamp } from "firebase/firestore"; // Firestore Timestamp

// -------------------------------------------------------------
// --- BASE TYPE FOR ALL PATIENT-SPECIFIC RESOURCES (SERVER) ---
// -------------------------------------------------------------

/**
 * Base type for all documents stored in top-level collections (Vitals, Notes, etc.)
 * Ensures patient context and audit trails are present.
 */
export type PatientResource = {
  id: string;            // Document ID (from Firestore)
  patientId: string;     // Link to the Patient
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

// -------------------------------------------------------------
// --- CLINICAL RESOURCE TYPES (Stored in separate collections)
// -------------------------------------------------------------

export type Vitals = PatientResource & {
  timestamp: Timestamp;      // When the vital was recorded (for ordering)
  systolic: number;          // BP Systolic (mmHg)
  diastolic: number;         // BP Diastolic (mmHg)
  heartRate: number | null;  // Beats per minute
  respiratoryRate: number | null; // Breaths per minute
  temperature: number | null;     // Celsius
  oxygenSaturation: number | null; // SpO2 (%)
  weight: number | null;     // kg
  notes: string | null;
};

export type Allergy = PatientResource & {
  allergen: string; // Substance (Penicillin, Peanuts, etc.)
  reaction: string; // Anaphylaxis, Hives, etc.
  severity: "Mild" | "Moderate" | "Severe" | "Life-Threatening";
  type: "Drug" | "Food" | "Environmental" | "Other";
  status: "Active" | "Resolved";
  onsetDate: Timestamp | null;
  notes: string | null;
};

export type Medication = PatientResource & {
  name: string;
  class:
    | "ACE Inhibitor"
    | "Antibiotic"
    | "Antidiabetic"
    | "Bronchodilator"
    | "NSAID"
    | string; // Expanded class options
  dose: string;
  route: "Oral" | "IV" | "IM" | "Topical" | "Inhalation" | string;
  frequency: string;
  startDate: string; // stored as date string in this model
  status: "Active" | "Stopped" | string;
  notes?: string;
};

export type Problem = PatientResource & {
  name: string;
  status: "Active" | "Resolved" | "Monitoring";
  onsetDate: string;
  notes: string;
  icd10Code: string;
  icd10Description: string;
  addedBy: string;
};

export type ChronicCondition = PatientResource & {
  name: string;
  severity: "Mild" | "Moderate" | "Severe";
  notes: string;
  icd10Code: string;
  icd10Description: string;
  addedBy: string;
};

// -------------------------------------------------------------
// --- LIGHTWEIGHT “EMBEDDED” TYPES FOR MOCK DATA (data.ts) ----
// -------------------------------------------------------------
// These are only for the sample patients in src/lib/data.ts.
// Real data still lives in separate collections via PatientResource.

export type ProblemSummary = {
  id: string;
  name: string;
  status?: "Active" | "Resolved" | "Monitoring" | string;
  onsetDate?: string;
  notes?: string;
  icd10Code?: string;
  icd10Description?: string;
  addedBy?: string;
};

export type MedicationSummary = {
  id: string;
  name: string;
  class?: string;
  dose?: string;
  route?: string;
  frequency?: string;
  startDate?: string;
  status?: "Active" | "Stopped" | string;
  notes?: string;
};

export type ChronicConditionSummary = {
  id: string;
  name: string;
  severity?: "Mild" | "Moderate" | "Severe" | string;
  notes?: string;
  icd10Code?: string;
  icd10Description?: string;
  addedBy?: string;
};

// -------------------------------------------------------------
// --- CORE APPLICATION TYPES ---
// -------------------------------------------------------------

export type Patient = {
  id: string;
  name: string;
  avatar: string;
  email: string;
  dob: string;
  gender: "Male" | "Female" | "Other";
  acuity: "Low" | "Medium" | "High" | "Critical";
  lastVisit: string;
  status: "Active" | "Inactive";

  // Embedded demo fields used ONLY in src/lib/data.ts mock data
  problems?: ProblemSummary[];
  medications?: MedicationSummary[];
  chronicConditions?: ChronicConditionSummary[];
};

export type Doctor = {
  id: string;
  name: string;
  avatar: string;
  specialty: string;
};

export type Consultation = {
  id: string;
  patient: Pick<Patient, "id" | "name" | "avatar">;
  doctor: Pick<Doctor, "id" | "name">;
  date: string;
  time: string;
  reason: string;
  status: "Completed" | "Upcoming" | "Cancelled";
};

export type Activity = {
  id: string;
  user: {
    id: string;
    name: string;
    avatar: string;
  }; // works for docs + AI Assistant
  action: string;
  target: string;
  timestamp: string;
  department: string;
  color: "teal" | "orange" | "grey";
};

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
};
