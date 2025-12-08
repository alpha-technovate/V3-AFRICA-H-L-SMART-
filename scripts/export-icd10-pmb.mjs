// scripts/export-icd10-pmb.mjs
import xlsx from "xlsx";
import fs from "fs";
import path from "path";

// 1. Input Excel (from data/PMB LEVEL OF CARE.xlsx)
const excelPath = path.join(process.cwd(), "data", "PMB LEVEL OF CARE.xlsx");

// 2. Output JSON – this is what icd10.ts imports
const outputPath = path.join(process.cwd(), "src", "lib", "icd10-pmb.json");

// Read workbook
const workbook = xlsx.readFile(excelPath);

// Use first sheet (your PMB list)
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Convert to JS rows
const rows = xlsx.utils.sheet_to_json(sheet, { defval: null });

// Build clean list: { code, description }
const icdList = [];

for (const row of rows) {
  // Adjust these two keys if needed after we inspect:
  // For now assume "ICD10" and "Description" style headers
  const code =
    row["ICD10"] ||
    row["ICD-10"] ||
    row["ICD-10 code"] ||
    row["ICD10 Code"] ||
    row["Code"] ||
    row["Unnamed: 4"];

  const desc =
    row["Description"] ||
    row["Long description"] ||
    row["Diagnosis"] ||
    row["Condition"] ||
    row["Unnamed: 5"];

  if (!code || !desc) continue;

  const codeStr = String(code).trim();
  const descStr = String(desc).trim();

  // Skip header-ish rows
  if (
    codeStr.toLowerCase().includes("icd") &&
    descStr.toLowerCase().includes("description")
  ) {
    continue;
  }

  icdList.push({
    code: codeStr,
    description: descStr,
  });
}

// De-duplicate by code
const seen = new Set();
const unique = [];
for (const entry of icdList) {
  if (seen.has(entry.code)) continue;
  seen.add(entry.code);
  unique.push(entry);
}

// Ensure folder exists
fs.mkdirSync(path.dirname(outputPath), { recursive: true });

// Write JSON
fs.writeFileSync(outputPath, JSON.stringify(unique, null, 2), "utf8");

console.log(`Exported ${unique.length} ICD-10 codes to ${outputPath}`);
