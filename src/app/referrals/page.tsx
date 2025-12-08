"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, ArrowRight } from "lucide-react";

// -----------------------------
// TYPES
// -----------------------------
interface Referral {
  id: string;
  patientId: string;
  patientName: string;
  fromDoctorId: string;
  fromDoctorName: string;
  targetDoctorId: string;
  targetDoctorName: string;
  reason: string;
  notes: string;
  createdAt?: any;
  seen?: boolean;
}

const CURRENT_DOCTOR_ID = "DOC123";

// -----------------------------
// COMPONENT
// -----------------------------
export default function ReferralsInboxPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/referrals?doctorId=${encodeURIComponent(CURRENT_DOCTOR_ID)}`
        );
        const json = await res.json();

        if (json.success && Array.isArray(json.referrals)) {
          setReferrals(json.referrals);
        } else {
          setReferrals([]);
        }
      } catch (err) {
        console.error("INBOX REFERRALS ERROR:", err);
        setReferrals([]);
      } finally {
        setLoading(false);
      }
    }

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
    <div className="mx-auto max-w-4xl pt-4 pb-10 px-4 sm:px-6 space-y-6">

      {/* HEADER ----------------------------- */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-7 h-7 text-teal-700" />
            <h1 className="text-2xl sm:text-3xl font-semibold text-teal-700">
              Referral Inbox
            </h1>
          </div>

          <Badge
            variant="outline"
            className="px-3 py-1 text-xs sm:text-sm border-slate-300 text-slate-700"
          >
            {referrals.length} {referrals.length === 1 ? "Referral" : "Referrals"}
          </Badge>
        </div>

        <p className="text-slate-600 text-xs sm:text-sm">
          These are referrals addressed to you as the receiving specialist.
        </p>
      </div>

      {/* LOADING ----------------------------- */}
      {loading && (
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading referrals…
        </div>
      )}

      {/* EMPTY ----------------------------- */}
      {!loading && referrals.length === 0 && (
        <Card className="p-8 sm:p-10 flex flex-col items-center text-center bg-white border border-slate-200 shadow-sm rounded-2xl">
          <Users className="w-12 h-12 text-slate-400 mb-3" />
          <p className="text-sm text-slate-600">
            No referrals have been assigned to you yet.
          </p>
        </Card>
      )}

      {/* LIST ----------------------------- */}
      <div className="space-y-4 sm:space-y-5">
        {referrals.map((ref) => (
          <Card
            key={ref.id}
            className="
              p-4 sm:p-5 
              bg-white 
              rounded-xl sm:rounded-2xl 
              border border-slate-200 
              shadow-sm hover:shadow-md 
              transition-all
              space-y-4
            "
          >
            {/* Status + Date */}
            <div className="flex items-center justify-between">
              <Badge
                className={
                  "px-3 py-1 text-[10px] font-semibold rounded-full " +
                  (ref.seen
                    ? "bg-slate-200 text-slate-700"
                    : "bg-teal-600 text-white")
                }
              >
                {ref.seen ? "Seen" : "New"}
              </Badge>

              <span className="text-xs text-slate-400">
                {formatDate(ref.createdAt)}
              </span>
            </div>

            {/* Patient row */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm sm:text-base font-semibold text-slate-900">
                  {ref.patientName || "Unnamed patient"}
                </p>
                <p className="text-xs text-slate-500">
                  From Dr {ref.fromDoctorName || "Unknown"}
                </p>
              </div>

              <button
                type="button"
                className="flex items-center gap-1 text-xs sm:text-sm text-teal-700 hover:underline"
                onClick={() => {
                  if (ref.patientId) {
                    window.location.href = `/patients/${ref.patientId}`;
                  }
                }}
              >
                Open
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Reason */}
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
              <span className="font-medium">Reason: </span>
              {ref.reason}
            </p>

            {/* Notes */}
            {ref.notes && (
              <p className="text-xs text-slate-600 whitespace-pre-line border-l-2 border-slate-200 pl-3 leading-relaxed">
                {ref.notes}
              </p>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
