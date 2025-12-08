"use client";

import { usePatients } from "@/hooks/usePatients";
import { PatientCard } from "@/components/PatientCard";
import { SearchBar } from "@/components/SearchBar";
import { AddPatientButton } from "@/components/buttons/AddPatientButton";

import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { patients } = usePatients();
  const isArray = Array.isArray(patients);

  // ----------------------------------------
  // 🔵 REFERRALS (NEW — does NOT affect your patients logic)
  // ----------------------------------------
  const [referrals, setReferrals] = useState([]);
  const [loadingReferrals, setLoadingReferrals] = useState(true);
  const [referralsError, setReferralsError] = useState(null);

  useEffect(() => {
    async function loadReferrals() {
      try {
        const res = await fetch("/api/referrals?doctorId=DOC123");

        if (!res.ok) {
          const text = await res.text();
          console.error("Referrals error:", text);
          setReferralsError("Failed to load referrals.");
          return;
        }

        const json = await res.json();

        if (!json.success) {
          setReferralsError(json.error || "Failed to load referrals.");
          return;
        }

        setReferrals(json.referrals || []);
      } catch (e) {
        console.error("Referrals fetch error:", e);
        setReferralsError("Error connecting to referrals API.");
      } finally {
        setLoadingReferrals(false);
      }
    }

    loadReferrals();
  }, []);
  // ----------------------------------------

  return (
    <div className="space-y-8">

      {/* Top Row */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <AddPatientButton />
      </div>

      {/* Search */}
      <SearchBar />

      {/* Patient Section */}
      <div className="bg-white shadow rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-4">Patients</h2>

        {!isArray && (
          <div className="text-gray-500">API returned unexpected format.</div>
        )}

        {isArray && patients.length === 0 && (
          <div className="text-gray-400">No patients found.</div>
        )}

        {isArray && patients.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {patients.map((p: any) => (
              <PatientCard key={p.id} patient={p} />
            ))}
          </div>
        )}
      </div>

      {/* ---------------------------------------- */}
      {/* 🔵 REFERRALS SECTION (ADDED BELOW)      */}
      {/* ---------------------------------------- */}

      <div className="bg-white shadow rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-4">Referrals</h2>

        {loadingReferrals && (
          <div className="text-gray-500">Loading referrals…</div>
        )}

        {referralsError && (
          <div className="text-red-500 text-sm">{referralsError}</div>
        )}

        {!loadingReferrals && !referralsError && referrals.length === 0 && (
          <div className="text-gray-400">No referrals found.</div>
        )}

        {!loadingReferrals && !referralsError && referrals.length > 0 && (
          <div className="space-y-3">
            {referrals.map((ref: any) => (
              <div
                key={ref.id}
                className="border border-gray-100 rounded-xl p-4"
              >
                <div className="font-semibold text-gray-800">
                  {ref.reason || "Referral"}
                </div>
                <div className="text-sm text-gray-500">
                  Patient: {ref.patientId || "N/A"}
                </div>
                <div className="text-sm text-gray-500">
                  Status: {ref.status || "pending"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
