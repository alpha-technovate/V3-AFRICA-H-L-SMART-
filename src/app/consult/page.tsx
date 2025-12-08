"use client";

import { useEffect, useMemo, useState } from "react";
import { Stethoscope, Search, Filter, PlusCircle } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

type Consultation = {
  id: string;
  patientId?: string;
  patientName?: string;
  createdAt?: string; // ISO string from API
  summary?: string;
  status?: string;
  specialty?: string;
};

export default function ConsultationsPage() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "final">(
    "all"
  );

  // Fetch consultations from your API
  useEffect(() => {
    async function load() {
      try {
        setError(null);
        const res = await fetch("/api/consultations");
        const json = await res.json();

        if (json.success && Array.isArray(json.consultations)) {
          setConsultations(json.consultations);
        } else {
          setConsultations([]);
        }
      } catch (err) {
        console.error("Failed to load consultations:", err);
        setError("Unable to load consultations right now.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const filteredConsults = useMemo(() => {
    return consultations.filter((c) => {
      const matchSearch =
        !search ||
        (c.patientName &&
          c.patientName.toLowerCase().includes(search.toLowerCase())) ||
        (c.summary &&
          c.summary.toLowerCase().includes(search.toLowerCase())) ||
        (c.id && c.id.toLowerCase().includes(search.toLowerCase()));

      const matchStatus =
        statusFilter === "all" ||
        (c.status || "draft").toLowerCase() === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [consultations, search, statusFilter]);

  function formatDate(value?: string) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  }

  function statusBadgeVariant(status?: string) {
    const s = (status || "draft").toLowerCase();
    if (s === "final") return "default";
    if (s === "in-progress") return "outline";
    return "secondary";
  }

  return (
    <div className="flex h-full w-full flex-col p-6 space-y-6">
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-teal-600" />
            <h1 className="text-2xl font-semibold text-slate-900">
              Consultations
            </h1>
          </div>
          <p className="text-sm text-slate-600">
            All AI-generated consultation notes and summaries for your patients.
          </p>
        </div>

        {/* Right-side controls: search + filter + button in ONE row */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              className="pl-8 w-60"
              placeholder="Search consultations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="relative">
            <select
              className="h-9 rounded-md border border-slate-200 bg-white px-8 pr-6 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | "draft" | "final")
              }
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="final">Final</option>
            </select>
            <Filter className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
          </div>

          <Button className="bg-teal-600 hover:bg-teal-700 flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            New consult
          </Button>
        </div>
      </div>

      {/* MAIN TABLE CARD */}
      <Card className="flex-1 overflow-hidden border-slate-200">
        <ScrollArea className="h-full">
          <div className="min-w-full p-4">
            {loading && (
              <div className="py-10 text-center text-sm text-slate-500">
                Loading consultations…
              </div>
            )}

            {!loading && error && (
              <div className="py-10 text-center text-sm text-red-600">
                {error}
              </div>
            )}

            {!loading && !error && filteredConsults.length === 0 && (
              <div className="py-10 text-center text-sm text-slate-500">
                No consultations found yet. Once you run AI consults, they’ll
                appear here.
              </div>
            )}

            {!loading && !error && filteredConsults.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[220px]">Patient</TableHead>
                    <TableHead className="w-[180px]">Date</TableHead>
                    <TableHead>AI Summary</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead className="w-[120px]">Specialty</TableHead>
                    <TableHead className="w-[80px] text-right">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConsults.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {c.patientName || "Unknown patient"}
                          </span>
                          <span className="text-xs text-slate-500">
                            ID: {c.patientId || "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {formatDate(c.createdAt)}
                      </TableCell>
                      <TableCell className="text-sm text-slate-700">
                        {c.summary || "No AI summary stored."}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(c.status)}>
                          {(c.status || "Draft").toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-700">
                        {c.specialty || "General"}
                      </TableCell>
                      <TableCell className="text-right">
                        {/* Later we can link this to /patients/[id] with a specific consult ID */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}
