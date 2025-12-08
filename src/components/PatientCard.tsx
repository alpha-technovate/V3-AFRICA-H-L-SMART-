"use client";

import Link from "next/link";
import { StatusBadge } from "./StatusBadge";
import { Share2 } from "lucide-react";

interface PatientCardProps {
  patient: {
    id: string;
    name: string;
    idNumber?: string;
    age?: number | string;
    diagnosis?: string;
    status?: string;
    sex?: string;
  };
}

export function PatientCard({ patient }: PatientCardProps) {
  const initials =
    patient.name
      ?.split(" ")
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "PT";

  return (
    <Link
      href={`/patients/${patient.id}`}
      className="
        group block rounded-2xl border border-slate-100
        bg-white/90 p-4 sm:p-5
        shadow-[0_8px_24px_rgba(15,23,42,0.04)]
        hover:shadow-[0_16px_40px_rgba(15,23,42,0.12)]
        hover:border-teal-300
        transition-all duration-200
      "
    >
      {/* Top row: avatar + name + share */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div
            className="
              flex h-10 w-10 items-center justify-center
              rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500
              text-xs font-semibold text-white shadow-sm
            "
          >
            {initials}
          </div>

          {/* Name + ID */}
          <div className="space-y-0.5">
            <h3 className="text-sm sm:text-base font-semibold text-slate-900">
              {patient.name || "Unnamed patient"}
            </h3>
            {patient.idNumber && (
              <p className="text-[11px] sm:text-xs text-slate-500">
                ID: <span className="font-mono">{patient.idNumber}</span>
              </p>
            )}
          </div>
        </div>

        {/* Share icon */}
        <button
          type="button"
          className="
            inline-flex h-8 w-8 items-center justify-center
            rounded-full border border-slate-100
            bg-white text-slate-400
            hover:text-teal-600 hover:border-teal-200
            transition-colors
          "
          onClick={(e) => {
            e.preventDefault();
            // placeholder share UX; you can wire clipboard / navigator.share here
          }}
        >
          <Share2 className="h-4 w-4" />
        </button>
      </div>

      {/* Middle: quick facts */}
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] sm:text-xs text-slate-600">
        {patient.age !== undefined && (
          <div>
            <span className="font-medium text-slate-700">Age:</span>{" "}
            <span>{patient.age}</span>
          </div>
        )}
        {patient.sex && (
          <div>
            <span className="font-medium text-slate-700">Sex:</span>{" "}
            <span>{patient.sex}</span>
          </div>
        )}
        {patient.diagnosis && (
          <div className="col-span-2">
            <span className="font-medium text-slate-700">Primary Dx:</span>{" "}
            <span className="text-slate-700">
              {patient.diagnosis.length > 60
                ? patient.diagnosis.substring(0, 60).trimEnd() + "…"
                : patient.diagnosis}
            </span>
          </div>
        )}
      </div>

      {/* Bottom: status & subtle CTA */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <StatusBadge status={patient.status} />

        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-700">
          <span className="hidden sm:inline">Open patient workspace</span>
          <span className="sm:hidden">Open</span>
          <span className="transition-transform group-hover:translate-x-0.5">
            ↗
          </span>
        </span>
      </div>
    </Link>
  );
}
