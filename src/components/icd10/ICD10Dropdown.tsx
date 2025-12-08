// src/components/icd10/ICD10Dropdown.tsx
"use client";

import { useMemo, useState } from "react";
import { searchICD10, ICD10Entry } from "@/lib/icd10";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ICD10DropdownProps {
  label?: string;
  value?: string; // current ICD-10 code
  onChange: (code: string, entry: ICD10Entry | null) => void;
  helperText?: string;
}

export default function ICD10Dropdown({
  label = "ICD-10 Code",
  value,
  onChange,
  helperText,
}: ICD10DropdownProps) {
  const [query, setQuery] = useState("");

  const options = useMemo(
    () => searchICD10(query, 50),
    [query]
  );

  const selectedEntry = useMemo(
    () =>
      options.find((o) => o.code === value) ?? null,
    [options, value]
  );

  return (
    <Card className="p-3.5 md:p-4 space-y-2 border-teal-100 bg-teal-50/40">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Label className="text-xs md:text-sm font-medium text-slate-800">
            {label}
          </Label>
          {helperText && (
            <p className="text-[10px] md:text-[11px] text-slate-500">
              {helperText}
            </p>
          )}
        </div>
        {value && (
          <span className="text-[11px] md:text-xs text-teal-700 font-semibold">
            {value}
          </span>
        )}
      </div>

      {/* Search box */}
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by code or diagnosis e.g. I10, hypertension…"
        className="h-8 text-xs md:text-sm"
      />

      {/* Results list */}
      <div className="border rounded-md bg-white mt-2">
        <ScrollArea className="max-h-52">
          <ul className="divide-y divide-slate-100 text-xs md:text-sm">
            {options.length === 0 && (
              <li className="px-3 py-2 text-slate-400">
                No matches found.
              </li>
            )}

            {options.map((opt) => (
              <li
                key={opt.code + opt.description}
                className={cn(
                  "px-3 py-2 cursor-pointer flex items-start gap-2 hover:bg-teal-50",
                  value === opt.code && "bg-teal-50"
                )}
                onClick={() => onChange(opt.code, opt)}
              >
                <div className="mt-[2px]">
                  {value === opt.code ? (
                    <Check className="w-3.5 h-3.5 text-teal-700" />
                  ) : (
                    <span className="inline-block w-3.5" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">
                    {opt.code}
                  </p>
                  <p className="text-[11px] md:text-xs text-slate-600">
                    {opt.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </div>
    </Card>
  );
}
