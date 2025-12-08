"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight } from "lucide-react";

interface PatientReferralsListProps {
  patientId: string;
}

interface Referral {
  id: string;
  patientId: string;

  fromDoctorId: string;
  fromDoctorName: string;

  targetDoctorId: string;
  targetDoctorName: string;

  reason: string;
  notes: string;
  createdAt?: any;
  seen?: boolean;
}

export default function PatientReferralsList({
  patientId,
}: PatientReferralsListProps) {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  // Load referrals
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/referrals?patientId=${patientId}`);
        const json = await res.json();

        if (json.success) {
          setReferrals(json.referrals);
        } else {
          setReferrals([]);
        }
      } catch (err) {
        console.error("REFERRAL LOAD ERROR:", err);
        setReferrals([]);
      } finally {
        setLoading(false);
      }
    }

    if (patientId) load();
  }, [patientId]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-teal-700">
        Referral History
      </h3>

      {loading && (
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading referrals...
        </div>
      )}

      {!loading && referrals.length === 0 && (
        <Card className="p-4 text-gray-500 text-sm">
          No referrals recorded for this patient.
        </Card>
      )}

      {referrals.map((ref) => (
        <Card key={ref.id} className="p-4 space-y-2 border shadow-sm">
          {/* Referral direction */}
          <div className="flex items-center gap-2">
            <Badge
              className={
                "text-white " +
                (ref.fromDoctorId === "DOC123"
                  ? "bg-blue-500"
                  : "bg-teal-600")
              }
            >
              {ref.fromDoctorId === "DOC123"
                ? "Outgoing Referral"
                : "Incoming Referral"}
            </Badge>
          </div>

          {/* Doctor → Doctor */}
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">{ref.fromDoctorName}</span>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <span className="font-semibold text-teal-700">
              {ref.targetDoctorName}
            </span>
          </div>

          {/* Reason */}
          <p className="text-sm text-gray-700">
            <span className="font-medium">Reason:</span> {ref.reason}
          </p>

          {/* Notes */}
          {ref.notes && (
            <p className="text-sm text-gray-600 whitespace-pre-line">
              <span className="font-medium">Notes:</span> {ref.notes}
            </p>
          )}

          {/* Timestamp */}
          <p className="text-xs text-gray-400">
            {ref.createdAt?.seconds
              ? new Date(ref.createdAt.seconds * 1000).toLocaleString()
              : "Just now"}
          </p>
        </Card>
      ))}
    </div>
  );
}
