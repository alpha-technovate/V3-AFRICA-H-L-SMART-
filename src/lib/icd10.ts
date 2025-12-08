// src/lib/icd10.ts

// Full PMB ICD-10 dataset generated from Excel
// File: src/lib/icd10-pmb.json  (see export script)
import rawData from "./icd10-pmb.json";

// ---------- Types ----------
export interface ICD10Entry {
  code: string;
  description: string;
}

// Export the list so UI can use it directly
export const ICD10_LIST: ICD10Entry[] = rawData as ICD10Entry[];

// ---------- Simple “smart” lookup for free-text diagnoses ----------

export function lookupICD10(diagnosis?: string | null): string | null {
  if (!diagnosis) return null;
  const key = diagnosis.toLowerCase().trim();

  // 1. Exact code match
  const direct = ICD10_LIST.find(
    (e) => e.code.toLowerCase() === key
  );
  if (direct) return direct.code;

  // 2. Description contains phrase
  const contains = ICD10_LIST.find((e) =>
    e.description.toLowerCase().includes(key)
  );
  if (contains) return contains.code;

  // 3. If user said e.g. “hypertension” only, try word-based
  const words = key.split(/\s+/).filter(Boolean);
  for (const entry of ICD10_LIST) {
    const desc = entry.description.toLowerCase();
    if (words.every((w) => desc.includes(w))) {
      return entry.code;
    }
  }

  return null;
}

// ---------- Helper for dropdown / search ----------

export function searchICD10(
  query: string,
  limit = 50
): ICD10Entry[] {
  const q = query.toLowerCase().trim();

  if (!q) {
    // Just show first chunk if empty
    return ICD10_LIST.slice(0, limit);
  }

  return ICD10_LIST
    .filter((e) => {
      const code = e.code.toLowerCase();
      const desc = e.description.toLowerCase();
      return code.includes(q) || desc.includes(q);
    })
    .slice(0, limit);
}

// Full list if you ever need it (e.g. for a server-side API)
export function getAllICD10(): ICD10Entry[] {
  return ICD10_LIST;
}
