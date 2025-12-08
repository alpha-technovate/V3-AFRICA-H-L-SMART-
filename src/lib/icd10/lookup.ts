// src/lib/icd10/lookup.ts

// Mini ICD-10 lookup for common chronic diseases
// You can expand this later or connect a real ICD-10 API.

const map: Record<string, string> = {
  diabetes: "E11",
  "diabetes mellitus type 2": "E11",
  "type 1 diabetes": "E10",
  hypertension: "I10",
  "high blood pressure": "I10",
  "heart failure": "I50",
  asthma: "J45",
  copd: "J44",
  "chronic kidney disease": "N18",
  "ckd stage 3": "N18.3",
  hiv: "B20",
  epilepsy: "G40",
  hypothyroidism: "E03",
  hyperthyroidism: "E05",
};

export function lookupICD10(diagnosis: string): string | null {
  const key = diagnosis.toLowerCase().trim();

  for (const term in map) {
    if (key.includes(term)) {
      return map[term];
    }
  }

  return null;
}
