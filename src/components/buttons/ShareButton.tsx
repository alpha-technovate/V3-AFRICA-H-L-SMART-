"use client";

import { Share2 } from "lucide-react";

export function ShareButton() {
  return (
    <button className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl shadow">
      <Share2 size={18} />
      Share
    </button>
  );
}
