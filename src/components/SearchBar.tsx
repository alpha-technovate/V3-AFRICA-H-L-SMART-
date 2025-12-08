"use client";

import { Search } from "lucide-react";

export function SearchBar() {
  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-3 text-gray-400" size={18} />
      <input
        type="text"
        placeholder="Search patients..."
        className="w-full pl-10 pr-4 py-2 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
      />
    </div>
  );
}
