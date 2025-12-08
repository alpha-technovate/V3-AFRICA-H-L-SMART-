"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight, Users } from "lucide-react";

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
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-7 h-7 text-teal-700" />
          <h1 className="text-3xl font-semibold text-teal-700">
            Referral Inbox
          </h1>
        </div>

        <Badge variant="outline" className="px-3 py-1 text-sm">
          {referrals.length}{" "}
          {referrals.length === 1 ? "Referral" : "Referrals"}
        </Badge>
      </div>

      <p className="text-gray-600 text-sm">
        These are referrals addressed to you as the receiving specialist.
      </p>

      {/* LOADING */}
      {loading && (
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading referrals…
        </div>
      )}

      {/* EMPTY */}
      {!loading && referrals.length === 0 && (
        <Card className="p-10 flex flex-col items-center text-center text-gray-500 shadow-sm border">
          <Users className="w-12 h-12 text-gray-400 mb-3" />
          <p className="text-sm">No referrals have been assigned to you yet.</p>
        </Card>
      )}

      {/* LIST */}
      <div className="space-y-5">
        {referrals.map((ref) => (
          <Card
            key={ref.id}
            className="p-6 space-y-4 border shadow-sm bg-white hover:shadow-md transition-shadow"
          >
            {/* STATUS + DATE */}
            <div className="flex items-center justify-between">
              <Badge
                className={
                  "text-white px-3 py-1 " +
                  (ref.seen ? "bg-gray-500" : "bg-teal-600")
                }
              >
                {ref.seen ? "Seen" : "New"}
              </Badge>

              <span className="text-xs text-gray-400">
                {formatDate(ref.createdAt)}
              </span>
            </div>

            {/* PATIENT INFO */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-semibold text-teal-700 text-lg">
                  {ref.patientName || "Unnamed patient"}
                </span>
                <span className="text-xs text-gray-500">
                  From Dr. {ref.fromDoctorName || "Unknown"}
                </span>
              </div>

              <button
                type="button"
                className="flex items-center gap-1 text-sm text-teal-700 hover:underline"
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

            {/* REASON */}
            <p className="text-sm text-gray-800 leading-6">
              <span className="font-medium">Reason: </span>
              {ref.reason}
            </p>

            {/* NOTES */}
            {ref.notes && (
              <p className="text-xs text-gray-600 whitespace-pre-line border-l-2 pl-3 leading-5">
                {ref.notes}
              </p>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
