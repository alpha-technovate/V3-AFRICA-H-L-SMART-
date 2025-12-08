/**
 * SmartBridge National Essential Medicines List Importer
 */

import { readFileSync } from "fs";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc
} from "firebase/firestore";

import { firebaseConfig } from "../../src/lib/firebaseConfig";

// Init Firebase (Web SDK — Admin SDK not allowed)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function importEML() {
  console.log("🔥 Loading SA Essential Medicines List...");

  const raw = readFileSync("./tools/eml/sa_eml.json", "utf-8");
  const list = JSON.parse(raw);

  console.log(`📦 Found ${list.length} medicines.`);

  let total = 0;

  for (const med of list) {
    const id = med.name.toLowerCase().replace(/[^a-z0-9]/g, "_");

    await setDoc(doc(collection(db, "drug_database"), id), {
      ...med,
      search_terms: [
        med.name.toLowerCase(),
        med.class?.toLowerCase() || "",
        med.atc?.toLowerCase() || ""
      ],
      createdAt: Date.now()
    });

    total++;
    console.log(`✔ Imported: ${med.name}`);
  }

  console.log(`\n🎉 DONE — ${total} medicines imported successfully.`);
}

importEML()
  .then(() => {
    console.log("🌍 Import complete.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Import failed:", err);
    process.exit(1);
  });
