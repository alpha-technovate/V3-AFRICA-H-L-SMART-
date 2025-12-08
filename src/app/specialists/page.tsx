"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

interface Specialist {
  id: string;
  name: string;
  role: string;
  contact: string;
  description?: string;
  imageUrl?: string;
}

// helper to decide which records are support agents / liaisons
function isSupportRole(role: string) {
  const r = role.toLowerCase();
  return r.includes("support") || r.includes("liaison");
}

export default function SpecialistsPage() {
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [filtered, setFiltered] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(collection(db, "specialists"));

        const list: Specialist[] = snap.docs.map((doc) => {
          const data = doc.data() as any;

          return {
            id: doc.id,
            name: data.name ?? "",
            role: data.role ?? "",
            contact: data.contact ?? "N/A",
            description: data.description ?? "",
            imageUrl: data.photoUrl ?? data.imageUrl ?? undefined,
          };
        });

        console.log("Loaded specialists from Firestore:", list.length);

        setSpecialists(list);
        setFiltered(list);
      } catch (err) {
        console.error("Failed loading specialists:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // Search filter
  useEffect(() => {
    const s = search.toLowerCase();
    const result = specialists.filter((sp) => {
      const haystack = [
        sp.name,
        sp.role,
        sp.contact || "",
        sp.description || "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(s);
    });

    setFiltered(result);
  }, [search, specialists]);

  if (loading) {
    return (
      <div className="p-6 text-gray-500 text-lg text-center">
        Loading specialists…
      </div>
    );
  }

  // split into specialists vs support based on role
  const specialistsOnly = filtered.filter((sp) => !isSupportRole(sp.role));
  const supportOnly = filtered.filter((sp) => isSupportRole(sp.role));

  const renderCard = (sp: Specialist) => (
    <Card
      key={sp.id}
      className="p-4 shadow-sm border flex gap-4 items-start hover:shadow-md transition cursor-pointer"
    >
      {/* Image circle */}
      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
        {sp.imageUrl ? (
          <img
            src={sp.imageUrl}
            alt={sp.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-gray-400 text-sm">No image</span>
        )}
      </div>

      {/* Details */}
      <div className="flex-1">
        <h2 className="text-lg font-semibold text-teal-700">{sp.name}</h2>
        <p className="text-sm text-gray-700">{sp.role}</p>

        {sp.description && (
          <p className="text-sm text-gray-600 mt-2">{sp.description}</p>
        )}

        <p className="text-sm mt-2">
          <span className="font-semibold">Contact:</span>{" "}
          {sp.contact !== "N/A" ? (
            <a href={`tel:${sp.contact}`} className="text-teal-700 underline">
              {sp.contact}
            </a>
          ) : (
            "N/A"
          )}
        </p>
      </div>
    </Card>
  );

  return (
    <div className="p-6 space-y-6 w-full">
      {/* HEADER */}
      <h1 className="text-3xl font-semibold text-teal-700">
        Specialist Directory
      </h1>

      <p className="text-gray-600">
        Search for cardiologists, pulmonologists, nephrologists, surgeons and
        support agents.
      </p>

      {/* SEARCH BAR */}
      <div className="max-w-md">
        <Input
          placeholder="Search specialist name, role, or contact…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* SPECIALISTS SECTION */}
      {specialistsOnly.length > 0 && (
        <>
          <h2 className="text-xl font-semibold text-teal-800 mt-4">
            Specialists
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-2">
            {specialistsOnly.map(renderCard)}
          </div>
        </>
      )}

      {/* SUPPORT SECTION */}
      {supportOnly.length > 0 && (
        <>
          <h2 className="text-xl font-semibold text-teal-800 mt-8">
            Support & Liaison Team
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-2">
            {supportOnly.map(renderCard)}
          </div>
        </>
      )}

      {filtered.length === 0 && (
        <p className="text-gray-500 text-center">
          No specialists match your search.
        </p>
      )}
    </div>
  );
}
