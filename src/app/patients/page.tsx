"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, ArrowRight, XCircle } from "lucide-react";

// --- Types ---
interface PatientListItem {
  id: string;
  firstName: string;
  lastName: string;
  idNumber: string;
  dateOfBirth: string; // ISO format or YYYY-MM-DD
  gender: string;
  contactNumber: string;
  address: string;
  medicalAid: string;
  notes: string;
  isArchived: boolean;
  createdAt?: { seconds: number; nanoseconds: number };
  updatedAt?: { seconds: number; nanoseconds: number };
}

// --- Component ---
export default function PatientsListPage() {
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/patients");
      
      if (!res.ok) {
        // Attempt to read the error message from the API response
        let errorMessage = `API fetch failed with status: ${res.status}`;
        try {
          const errorJson = await res.json();
          if (errorJson.error) {
            errorMessage = errorJson.error;
          }
        } catch {} // Ignore parsing error if response is not JSON
        throw new Error(errorMessage);
      }
      
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        const sorted = json.data.sort((a, b) =>
          (a.lastName || "").localeCompare(b.lastName || "")
        );
        setPatients(sorted);
      } else {
        // Handle successful API call but unsuccessful data payload
        console.error("API Payload Error:", json.error || "Data array missing.");
        setFetchError(json.error || "Received invalid data structure from API.");
        setPatients([]);
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
      setFetchError(err.message || "Could not connect to the patient API.");
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 md:p-8 space-y-6 fade-up">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-teal-700">
            Patient Directory ✨
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Open existing charts or add a new patient using ID scan.
          </p>
        </div>

        {/* Add Patient Button - FIX: Removed passHref and legacyBehavior */}
        <Link href="/id-ocr" className="w-full sm:w-auto"> 
          <Button 
            className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Patient (Scan ID)
          </Button>
        </Link>
      </div>

      {/* MAIN CARD */}
      <Card className="w-full p-0 shadow-md border border-slate-100 fade-up">
        
        {/* LOADING STATE */}
        {loading && (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" aria-label="Loading patient list" />
          </div>
        )}

        {/* ERROR STATE */}
        {fetchError && !loading && (
            <div className="p-8 text-center text-red-600 bg-red-50 border border-red-200 rounded-lg space-y-2">
              <XCircle className="w-6 h-6 mx-auto" />
              <p className="font-semibold text-sm">Failed to Load Patients</p>
              <p className="text-xs">{fetchError}</p>
              <Button onClick={fetchPatients} variant="outline" size="sm" className="mt-3 text-xs text-red-700 border-red-300 hover:bg-red-100">
                Retry Load
              </Button>
            </div>
        )}
        
        {/* NO PATIENTS FOUND STATE */}
        {!loading && !fetchError && patients.length === 0 && (
          <p className="text-center text-gray-500 p-8">
            No patients found in the system.
          </p>
        )}
        
        {/* PATIENT LISTS (TABLE/MOBILE) */}
        {!loading && !fetchError && patients.length > 0 && (
          <>
            {/* MOBILE LIST */}
            <div className="sm:hidden p-4 space-y-3">
              {patients.map((p) => (
                // FIX: Removed passHref and legacyBehavior. Link now wraps the div.
                <Link key={p.id} href={`/patients/${p.id}`} 
                    className="block border border-slate-200 p-4 rounded-lg bg-white hover:bg-teal-50 transition shadow-sm cursor-pointer"
                    aria-label={`View chart for ${p.firstName} ${p.lastName}`}
                >
                    
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900 text-base">
                        {p.firstName} {p.lastName}
                      </p>
                      <ArrowRight className="w-4 h-4 text-teal-600" />
                    </div>

                    <p className="text-xs text-slate-500 mt-1">
                      ID:{" "}
                      <span className="font-mono text-gray-700">
                        {p.idNumber}
                      </span>
                    </p>

                    <p className="text-xs text-slate-500">
                      DOB: {p.dateOfBirth} • {p.gender}
                    </p>

                    {p.medicalAid && (
                      <p className="text-xs text-teal-700 font-medium mt-1">
                        {p.medicalAid}
                      </p>
                    )}
                </Link>
              ))}
            </div>

            {/* DESKTOP TABLE */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gender / DOB</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {patients.map((p) => (
                    <tr key={p.id} className="hover:bg-teal-50 transition cursor-pointer">
                      {/* Wrap content in Link to make the row clickable */}
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                        <Link href={`/patients/${p.id}`} className="block">
                          {p.firstName} {p.lastName}
                        </Link>
                      </td>

                      <td className="px-6 py-4 text-gray-600 font-mono text-xs whitespace-nowrap">
                        <Link href={`/patients/${p.id}`} className="block">
                            {p.idNumber}
                        </Link>
                      </td>

                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                        <Link href={`/patients/${p.id}`} className="block">
                          {p.gender || "—"} / {p.dateOfBirth}
                        </Link>
                      </td>

                      {/* Action Cell (already using Link correctly, just wrap in td) */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <Link
                          href={`/patients/${p.id}`}
                          className="text-teal-600 hover:text-teal-800 font-medium"
                          aria-label={`View chart for ${p.firstName} ${p.lastName}`}
                        >
                          View Chart
                        </Link>
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          </>
        )}

      </Card>
    </div>
  );
}