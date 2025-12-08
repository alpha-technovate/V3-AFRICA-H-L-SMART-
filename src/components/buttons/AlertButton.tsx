"use client";

import { AlertTriangle } from "lucide-react";

export function AlertButton() {
  return (
    <button className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200">
      <AlertTriangle size={18} />
    </button>
  );
}
