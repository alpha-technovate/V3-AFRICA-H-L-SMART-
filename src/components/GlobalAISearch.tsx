// src/components/GlobalAISearch.tsx
"use client";

import { useState } from "react";
import { Search, Loader2, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type SearchItem = {
  id: string;
  type: "patient" | "referral" | "specialist" | "investigation" | string;
  title: string;
  subtitle?: string;
  patientId?: string;
};

export default function GlobalAISearch() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [results, setResults] = useState<SearchItem[]>([]);
  const [aiSummary, setAiSummary] = useState("");
  const [error, setError] = useState<string | null>(null);

  // -------------------- SEARCH HANDLER --------------------
  async function handleSearch() {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const res = await fetch("/api/search?q=" + encodeURIComponent(query));
      const json = await res.json();
      if (json.success) {
        setResults(json.results || []);
      } else {
        setError(json.error || "Search failed.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAISummary() {
    if (!query.trim()) return;

    setAiLoading(true);
    setAiSummary("");
    setError(null);

    try {
      const res = await fetch("/api/search/ai?q=" + encodeURIComponent(query));
      const json = await res.json();
      if (json.success) {
        setAiSummary(json.summary || "");
      } else {
        setError(json.error || "AI summary failed.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAiLoading(false);
    }
  }

  function openItem(item: SearchItem) {
    if (item.type === "patient") {
      window.location.href = `/patients/${item.id}`;
    } else if (item.type === "referral") {
      window.location.href = `/referrals/${item.id}`;
    } else if (item.type === "investigation") {
      const pid = item.patientId || item.id;
      window.location.href = `/patients/${pid}#investigations`;
    }
  }

  // -------------------- UI --------------------
  return (
    <div className="w-full">
      {/* MAIN SEARCH CARD — MATCHES CHRONIC + ALLERGIES STYLE */}
      <Card className="
        p-4 sm:p-5 
        rounded-2xl 
        border border-slate-200 
        shadow-sm 
        bg-white 
        space-y-4 
        w-full
      ">
        {/* HEADER */}
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-teal-800 flex items-center gap-2">
            <Search className="h-4 w-4 text-teal-600" />
            Global AI Search
          </h2>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Search across patients, referrals, specialists & investigations.
          </p>
        </div>

        {/* INPUT + ACTIONS */}
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search anything…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="text-sm rounded-lg"
          />

          <Button
            onClick={handleSearch}
            className="h-9 bg-teal-600 hover:bg-teal-700 text-xs"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Go"}
          </Button>

          <Button
            onClick={handleAISummary}
            className="h-9 bg-purple-600 hover:bg-purple-700 text-white text-xs"
            disabled={aiLoading}
          >
            {aiLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
          </Button>
        </div>

        {error && <p className="text-[11px] text-red-600">{error}</p>}

        {/* AI SUMMARY */}
        {aiSummary && (
          <Card className="p-3 bg-purple-50 border border-purple-100 text-xs rounded-xl">
            <p className="font-semibold text-purple-800 flex items-center gap-1 mb-1">
              <Sparkles className="h-3 w-3" /> AI Summary
            </p>
            <p className="text-purple-900 whitespace-pre-line">{aiSummary}</p>
          </Card>
        )}
      </Card>

      {/* RESULTS LIST */}
      {results.length > 0 && (
        <Card className="mt-3 p-4 rounded-2xl border border-slate-200 shadow-sm bg-white">
          <h3 className="text-sm font-semibold text-slate-800 mb-2">
            Results ({results.length})
          </h3>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {results.map((item) => (
              <button
                key={item.id}
                onClick={() => openItem(item)}
                className="
                  w-full text-left p-2 
                  rounded-lg border border-slate-200 
                  bg-white hover:bg-teal-50 
                  text-xs transition
                "
              >
                <p className="font-semibold text-slate-900">{item.title}</p>
                {item.subtitle && (
                  <p className="text-[11px] text-slate-500">{item.subtitle}</p>
                )}
                <span className="inline-flex mt-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px]">
                  {item.type.toUpperCase()}
                </span>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
