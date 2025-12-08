"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SpecialistsDirectory from "@/components/referrals/SpecialistsDirectory";
import { Badge } from "@/components/ui/badge";

import { Specialist } from "@/types/Specialist";

export default function ReferralForm({ patient }: { patient: any }) {
  const [toName, setToName] = useState("");
  const [toRole, setToRole] = useState("");
  const [toContact, setToContact] = useState("");
  const [reason, setReason] = useState("");
  const [urgency, setUrgency] = useState("routine");
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [suggestions, setSuggestions] = useState<Specialist[]>([]);

  // -----------------------------
  // AUTO-FILL FROM VOICE MATCHING
  // -----------------------------
  useEffect(() => {
    function handleAutoSelect() {
      const data = localStorage.getItem("autoSelectSpecialist");
      if (!data) return;

      try {
        const specialist = JSON.parse(data) as Specialist;

        setToName(specialist.name);
        setToRole(specialist.role);
        if (specialist.contact) setToContact(specialist.contact);

        setStatusMsg(`Auto-selected specialist: ${specialist.name}`);

        // Clear so it doesn't re-trigger
        localStorage.removeItem("autoSelectSpecialist");
      } catch (err) {
        console.error("Failed to parse autoSelectSpecialist", err);
      }
    }

    // Listen for broadcast event
    window.addEventListener("storage", handleAutoSelect);

    return () => {
      window.removeEventListener("storage", handleAutoSelect);
    };
  }, []);

  // -----------------------------
  // LOAD SPECIALISTS FOR AUTOSUGGEST
  // -----------------------------
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/specialists");
        const json = await res.json();
        if (json.success) setSpecialists(json.specialists);
      } catch (err) {
        console.error("Specialist load failed:", err);
      }
    }
    load();
  }, []);

  // -----------------------------
  // AUTO-SUGGEST HANDLER
  // -----------------------------
  useEffect(() => {
    const q = toName.toLowerCase().trim();
    if (!q) {
      setSuggestions([]);
      return;
    }

    const matches = specialists.filter((s) => {
      return (
        s.name.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q)
      );
    });

    setSuggestions(matches.slice(0, 5));
  }, [toName, specialists]);

  function handleSelect(s: Specialist) {
    setToName(s.name);
    setToRole(s.role);
    setToContact(s.contact || "");
    setSuggestions([]);
    setStatusMsg(`Referral specialist selected: ${s.name}`);
  }

  // -----------------------------
  // SUBMIT REFERRAL
  // -----------------------------
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    try {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient.id,
          patientName: patient.name,
          specialistName: toName,
          specialistRole: toRole,
          specialistContact: toContact || null,
          reason,
          urgency,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setStatusMsg("Referral sent successfully!");
        setReason("");
      } else {
        setStatusMsg(json.error || "Referral failed.");
      }
    } catch (err) {
      console.error("Referral error:", err);
      setStatusMsg("Failed to submit referral.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-teal-700">
              Specialist Referral
            </h2>
            <p className="text-xs text-gray-500">
              Patient: {patient.name} ({patient.idNumber})
            </p>
          </div>
          <Badge variant="outline" className="text-[11px]">
            {urgency === "urgent" ? "Urgent" : "Routine"}
          </Badge>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Specialist search */}
            <div className="relative">
              <label className="text-xs font-semibold">Specialist</label>
              <Input
                value={toName}
                onChange={(e) => setToName(e.target.value)}
                placeholder="Type name or specialty…"
              />

              {suggestions.length > 0 && (
                <Card className="absolute w-full mt-1 z-20 border shadow-lg">
                  {suggestions.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => handleSelect(s)}
                      className="p-2 text-sm hover:bg-gray-100 cursor-pointer"
                    >
                      <span className="font-semibold">{s.name}</span>{" "}
                      <span className="text-gray-600">— {s.role}</span>
                    </div>
                  ))}
                </Card>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="text-xs font-semibold">Specialty</label>
              <Input
                value={toRole}
                onChange={(e) => setToRole(e.target.value)}
                placeholder="e.g., Cardiologist"
              />
            </div>

            {/* Contact */}
            <div>
              <label className="text-xs font-semibold">Contact</label>
              <Input
                value={toContact}
                onChange={(e) => setToContact(e.target.value)}
                placeholder="0xx xxx xxxx"
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="text-xs font-semibold">Reason</label>
            <Textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Clinical presentation, findings, questions…"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-2 text-xs">
              <Button
                type="button"
                variant={urgency === "routine" ? "default" : "outline"}
                size="sm"
                onClick={() => setUrgency("routine")}
              >
                Routine
              </Button>
              <Button
                type="button"
                variant={urgency === "urgent" ? "default" : "outline"}
                size="sm"
                onClick={() => setUrgency("urgent")}
              >
                Urgent
              </Button>
            </div>

            <Button type="submit" disabled={saving || !toName || !reason}>
              {saving ? "Sending…" : "Send referral"}
            </Button>
          </div>

          {statusMsg && (
            <p className="text-xs text-gray-700 pt-1">{statusMsg}</p>
          )}
        </form>
      </Card>

      <Card className="p-4">
        <SpecialistsDirectory onSelect={handleSelect} />
      </Card>
    </div>
  );
}
