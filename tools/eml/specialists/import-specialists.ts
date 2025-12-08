/**
 * SmartBridge 2.0 — Specialist Directory Importer (CommonJS Compatible)
 */

import fs from "fs";
import path from "path";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, doc, setDoc } from "firebase/firestore";

import { firebaseNodeConfig } from "../firebase-node";

function getDb() {
  const app =
    getApps().length > 0 ? getApps()[0] : initializeApp(firebaseNodeConfig);
  return getFirestore(app);
}

async function importSpecialists() {
  console.log("\n🚀 SmartBridge Specialist Importer\n");

  const db = getDb();

  // Read JSON file
  const filePath = path.join(
    process.cwd(),
    "tools",
    "eml",
    "specialists",
    "specialists.json"
  );

  let list: any[] = [];

  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    list = JSON.parse(raw);
  } catch (error) {
    console.error("❌ Could not load specialists.json");
    console.error(error);
    process.exit(1);
  }

  console.log(`📦 Found ${list.length} specialists.\n`);

  let imported = 0;

  for (const s of list) {
    const id = s.name.toLowerCase().replace(/[^a-z0-9]/g, "_");

    const ref = doc(collection(db, "specialists"), id);

    const payload = {
      name: s.name,
      role: s.role,
      description: s.description || "",
      contact: s.contact || null,
      photoUrl: s.photoUrl || null,
      keywords: [
        s.name.toLowerCase(),
        s.role.toLowerCase(),
        ...(s.description ? s.description.toLowerCase().split(" ") : []),
      ],
      createdAt: Date.now(),
    };

    try {
      await setDoc(ref, payload);
      imported++;
      console.log(`✔ Imported: ${s.name}`);
    } catch (err) {
      console.error(`❌ Failed to import: ${s.name}`);
      console.error(err);
    }
  }

  console.log(`\n🎉 Done — ${imported} specialists added.\n`);
  process.exit(0);
}

importSpecialists().catch((err) => {
  console.error("❌ UNCAUGHT ERROR:", err);
  process.exit(1);
});
