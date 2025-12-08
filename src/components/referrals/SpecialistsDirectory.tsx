"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { Specialist } from "@/types/Specialist";

interface Props {
  onSelect: (s: Specialist) => void;
}

export default function SpecialistsDirectory({ onSelect }: Props) {
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [query, setQuery] = useState("");

  // Load specialists from Firestore API
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/specialists");
        const json = await res.json();
        if (json.success) setSpecialists(json.specialists);
      } catch (err) {
        console.error("Failed to load specialists:", err);
      }
    }
    load();
  }, []);

  // Filter by name or role
  const filtered = specialists.filter((s) => {
    const q = query.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-3">
      <h3 className="text-md font-semibold text-teal-700">
        Specialist Directory
      </h3>

      <Input
        placeholder="Search specialist or role..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map((s) => (
          <Card
            key={s.id}
            className="p-3 cursor-pointer hover:bg-gray-50 transition"
            onClick={() => onSelect(s)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{s.name}</p>
                <p className="text-xs text-gray-600">{s.role}</p>
                {s.contact && (
                  <p className="text-xs text-gray-700 mt-1">
                    📞 {s.contact}
                  </p>
                )}
              </div>

              <Badge className="bg-teal-600 text-white text-[10px]">
                Select
              </Badge>
            </div>
          </Card>
        ))}

        {filtered.length === 0 && (
          <p className="text-xs text-gray-500">No matching specialists.</p>
        )}
      </div>
    </div>
  );
}
