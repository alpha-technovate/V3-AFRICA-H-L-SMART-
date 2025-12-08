"use client";

import { Plus } from "lucide-react";

export function AddPatientButton() {
  return (
    <button className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl shadow">
      <Plus size={18} />
      Add Patient
    </button>
  );
}
