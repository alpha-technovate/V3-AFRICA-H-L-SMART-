/**
 * SmartBridge 2.0 — Specialist Directory Importer
 * ------------------------------------------------
 * Loads hard-coded specialists into Firestore:
 * Collection: specialists/{id}
 *
 * Run using:
 *    node tools/eml/specialists/import-specialists.js
 */

require("dotenv").config({ path: ".env.local" });
const admin = require("firebase-admin");

// --------------------------------------------------
// 1. LOAD SERVICE ACCOUNT SAFELY FROM ENV
// --------------------------------------------------
let serviceAccount;

try {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is missing!");
  }

  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
} catch (err) {
  console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON");
  console.error(err);
  process.exit(1);
}

// --------------------------------------------------
// 2. INIT FIREBASE ADMIN SDK
// --------------------------------------------------
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} catch (err) {
  console.error("❌ Firebase Admin initialization failed!");
  console.error(err);
  process.exit(1);
}

const db = admin.firestore();

console.log("🚀 SmartBridge Specialist Importer");
console.log("==================================");

// --------------------------------------------------
// 3. SPECIALISTS DATA (INLINE)
// --------------------------------------------------
const specialists = [
  {
    name: "Dr Sanjay Maharaj",
    role: "Cardiologist",
    description: "Experienced cardiologist and KZN pioneer in coronary lithotripsy.",
    contact: "083 777 5536",
    photoUrl: null,
  },
  {
    name: "Dr J Pillay",
    role: "Cardiothoracic Surgeon",
    description:
      "Pioneering advanced heart care. Qualifications: MBBCh (WITS), MMEd CTS (UFS), FC (Cardio) SA (CMSA).",
    contact: "082 855 6278",
    photoUrl: null,
  },
  {
    name: "Dr J Chen",
    role: "Cardiothoracic Surgeon",
    description:
      "Leading cardiothoracic surgeon. Qualifications: MBChB (UKZN), MMed CTS (UKZN), FC (Cardio) SA (CMSA).",
    contact: "084 316 8288",
    photoUrl: null,
  },
  {
    name: "Dr T Gwila",
    role: "Cardiothoracic Surgeon",
    description:
      "Expert cardiothoracic surgeon. Qualifications: MBBCh (TUT), MMed CTS (UFS), FC (Cardio) SA.",
    contact: "079 306 3990",
    photoUrl: null,
  },
  {
    name: "Dr D Gounder",
    role: "Specialist Physician",
    description:
      "Expert care using the latest in the medical field. Qualifications: MBChB, UKZN FCP (SA), Colleges of Medicine.",
    contact: "084 455 6927",
    photoUrl: null,
  },
  {
    name: "Dr Y Ramkilawan",
    role: "Pulmonologist",
    description:
      "Specialist Physician and Pulmonologist at UKZN. Qualifications: Bachelor of Medicine; Specialist Physician & Pulmonologist at UKZN.",
    contact: "072 336 9706",
    photoUrl: null,
  },
  {
    name: "Dr O Nonkala",
    role: "Nephrologist",
    description:
      "Nephrologist with MBChB (UNITRA), FCP(SA), Cert. Nephrology, and MMed (UKZN).",
    contact: "060 543 8746",
    photoUrl: null,
  },
  {
    name: "Dr M Singh",
    role: "Nephrologist",
    description:
      "Nephrologist with MBChB, FCP (SA), MMed (UKZN), and a Certificate in Nephrology (SA).",
    contact: "072 566 5476",
    photoUrl: null,
  },
  {
    name: "Dr Abobaker Benamro",
    role: "General Surgeon",
    description: "Providing expert surgical care. Qualifications: MBChB in Medicine from Sabhia.",
    contact: "083 721 2922",
    photoUrl: null,
  },
  {
    name: "Prof Francis Smith",
    role: "Cardiothoracic Surgeon",
    description:
      "Renowned cardiothoracic surgeon. Qualifications: MB. Ch. B, M.Med (CTS), PhD, FC (Cardio) SA, FACC.",
    contact: "082 774 1087",
    photoUrl: null,
  },
  {
    name: "RN Deen Shaik",
    role: "Support Agent",
    description:
      "Your dedicated support agent – connecting you personally to expert care.",
    contact: "+27 81 241 4879",
    photoUrl: null,
  },
  {
    name: "Khanyisile Buthelezi",
    role: "Patient Liaison",
    description:
      "Your personal liaison to top specialists – expert care is just a call away.",
    contact: "+27 83 522 8335",
    photoUrl: null,
  },
];

console.log(`📦 Loaded ${specialists.length} specialists\n`);

// --------------------------------------------------
// 4. IMPORT EACH SPECIALIST TO FIRESTORE
// --------------------------------------------------
async function importSpecialists() {
  let count = 0;

  for (const s of specialists) {
    const id = s.name.toLowerCase().replace(/[^a-z0-9]/g, "_");

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
      await db.collection("specialists").doc(id).set(payload);
      console.log(`✔ Imported: ${s.name} (${s.role})`);
      count++;
    } catch (err) {
      console.error(`❌ Failed to write: ${s.name}`);
      console.error(err);
    }
  }

  console.log("\n==================================");
  console.log(`🎉 Import complete — ${count} specialists uploaded.`);
  console.log("==================================\n");

  process.exit(0);
}

importSpecialists();
