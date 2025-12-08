"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Loader2, Clock } from "lucide-react";

interface Activity {
  id: string;
  message: string;
  timestamp: string;
}

export default function RecentActivityCard({ patientId }: { patientId: string }) {
  const [list, setList] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await fetch(`/api/activity?patientId=${patientId}`);
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        setList(json.data);
      } else {
        setList([]);
      }
    } catch (err) {
      console.error("ACTIVITY FETCH ERROR:", err);
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (patientId) load();
  }, [patientId]);

  return (
    <Card className="rounded-2xl border bg-white p-4 sm:p-5 shadow-sm space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-teal-600" />
          <h2 className="text-sm font-semibold text-slate-900">
            Recent Activity
          </h2>
        </div>

        <span className="text-[11px] font-medium rounded-full bg-teal-50 border border-teal-100 text-teal-700 px-2 py-0.5">
          {list.length === 0 ? "No items" : `${list.length}`}
        </span>
      </div>

      {/* LOADING */}
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading activity…
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-600">
          No activity recorded.
        </div>
      ) : (
        <div
          className="max-h-64 overflow-y-auto space-y-2 pr-1
            [scrollbar-width:thin]
            [&::-webkit-scrollbar]:w-1
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:bg-slate-300
            [&::-webkit-scrollbar-thumb]:rounded-full"
        >
          {list.map((a) => (
            <Card
              key={a.id}
              className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 shadow-sm hover:shadow-md transition text-xs"
            >
              <p className="text-slate-900 text-[13px] font-medium">
                {a.message}
              </p>

              <p className="text-[11px] text-slate-500 mt-1">
                {new Date(a.timestamp).toLocaleString()}
              </p>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
}
