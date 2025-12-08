"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Users,
  ArrowRight,
  User,
  ClipboardList,
} from "lucide-react";

interface Referral {
  id: string;
  patientId: string;
  patientName: string;
  referringDoctorId: string;
  referringDoctorName: string;
  specialistId: string;
  reason: string;
  clinicalSummary?: string;
  urgency?: string;
  sentAt?: any;
  isReadBySpecialist?: boolean;
}

const CURRENT_DOCTOR_ID = "DOC123";

export default function ReferralsInboxPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await fetch(
        `/api/referrals?doctorId=${encodeURIComponent(CURRENT_DOCTOR_ID)}`
      );

      // Robust JSON guard
      const text = await res.text();
      if (!text) throw new Error("Empty response from server.");
      const json = JSON.parse(text);

      if (json.success && Array.isArray(json.referrals)) {
        setReferrals(json.referrals);
      } else {
        setReferrals([]);
      }

    } catch (e) {
      console.error("REFERRALS INBOX LOAD ERROR:", e);
      setReferrals([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function formatDate(ts?: any) {
    if (!ts?.seconds) return "Just now";
    return new Date(ts.seconds * 1000).toLocaleString("en-ZA", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  return (
    <div className="bg-slate-50 min-h-screen px-4 sm:px-6 lg:px-8 py-8 overflow-x-hidden">
      <div className="mx-auto max-w-5xl space-y-6">
        
        {/* ------------------------------- */}
        {/* HEADER */}
        {/* ------------------------------- */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-teal-700" />
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Referral Inbox
            </h1>
          </div>

          <Badge
            variant="outline"
            className="px-3 py-1.5 text-sm border-teal-200 text-teal-700 bg-teal-50"
          >
            {referrals.length} {referrals.length === 1 ? "Referral" : "Referrals"}
          </Badge>
        </div>

        <p className="text-sm text-slate-600">
          Referrals assigned to you as the receiving specialist.
        </p>

        {/* ------------------------------- */}
        {/* LOADING */}
        {/* ------------------------------- */}
        {loading && (
          <div className="flex items-center gap-2 text-slate-500 pt-4">
            <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
            Loading referrals…
          </div>
        )}

        {/* ------------------------------- */}
        {/* EMPTY STATE */}
        {/* ------------------------------- */}
        {!loading && referrals.length === 0 && (
          <Card className="p-10 text-center bg-white border border-slate-100 shadow-sm rounded-xl">
            <ClipboardList className="w-14 h-14 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">
              No referrals have been assigned to you yet.
            </p>
          </Card>
        )}

        {/* ------------------------------- */}
        {/* REFERRAL LIST */}
        {/* ------------------------------- */}
        <div className="space-y-5">
          {referrals.map((ref) => (
            <Card
              key={ref.id}
              className="p-5 sm:p-6 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              {/* STATUS + DATE */}
              <div className="flex items-center justify-between mb-4">
                <Badge
                  className={`px-2 py-1 text-xs text-white ${
                    ref.isReadBySpecialist ? "bg-gray-500" : "bg-teal-600"
                  }`}
                >
                  {ref.isReadBySpecialist ? "Seen" : "New"}
                </Badge>

                <span className="text-xs text-slate-400">
                  {formatDate(ref.sentAt)}
                </span>
              </div>

              {/* PATIENT + BUTTON */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-semibold text-teal-700 text-lg">
                    {ref.patientName || "Unnamed patient"}
                  </span>
                  <span className="text-xs text-slate-500">
                    Referred by Dr. {ref.referringDoctorName || "Unknown"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (ref.patientId) {
                      window.location.href = `/patients/${ref.patientId}`;
                    }
                  }}
                  className="flex items-center gap-1 text-sm text-teal-700 hover:underline"
                >
                  Open
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* REASON */}
              <p className="mt-4 text-sm text-slate-800 leading-6">
                <span className="font-medium">Reason:</span> {ref.reason}
              </p>

              {/* CLINICAL SUMMARY */}
              {ref.clinicalSummary && (
                <p className="mt-3 text-xs whitespace-pre-line text-slate-600 border-l-2 pl-3 leading-5 border-teal-200">
                  {ref.clinicalSummary}
                </p>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
