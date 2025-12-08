// src/app/api/search/route.ts

import { NextResponse } from "next/server";
import {
  collection,
  getDocs,
  query,
  // Note: Firestore text search is limited. We avoid `where` for text fields 
  // here to perform a basic client-side check, but this is INEFFICIENT for large collections.
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// --- Types ---
type SearchResult = {
  type: string; // "patient" | "referral" | "specialist" | "activity" | ...
  id: string;
  title: string;
  subtitle?: string;
  linkId: string; // The Firestore document ID
  [key: string]: any;
};

// Helper for case-insensitive partial match (needed because Firestore lacks 'contains')
function matches(text: string | undefined, q: string) {
  if (!text) return false;
  return text.toLowerCase().includes(q);
}

// ======================================================
// GET — /api/search?q=query
// Performs a global, multi-collection search.
// ======================================================
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim().toLowerCase();

    // --- Strict Validation ---
    if (!q || q.length < 2) {
      return NextResponse.json(
        { success: false, data: null, error: "Query must be at least 2 characters long." },
        { status: 400 }
      );
    }

    const results: SearchResult[] = [];

    // ----------------------------------------------------------------------
    // PERFORMANCE WARNING: The following search blocks fetch entire collections.
    // In a production EMR, this must be replaced with a dedicated search solution 
    // (e.g., Algolia, ElasticSearch) or highly specific, indexed Firestore queries.
    // ----------------------------------------------------------------------

    // ============================
    // 1) PATIENTS
    // ============================
    try {
      const snap = await getDocs(collection(db, "patients")); // Modern SDK
      snap.forEach((docSnap) => {
        const d: any = docSnap.data();
        
        // Use stabilized patient fields
        const firstName = d.firstName || "";
        const lastName = d.lastName || "";
        const fullName = `${firstName} ${lastName}`;
        
        const idNumber = d.idNumber || "";
        const diagnosis = d.diagnosis || "";

        if (
          matches(fullName, q) ||
          matches(idNumber, q) ||
          matches(diagnosis, q)
        ) {
          results.push({
            type: "patient",
            id: docSnap.id,
            linkId: docSnap.id,
            title: fullName || "Unnamed patient",
            subtitle: `${idNumber || "No ID"} • ${diagnosis || "No diagnosis"}`,
          });
        }
      });
    } catch (err) {
      console.error("SEARCH PATIENTS ERROR:", err);
    }

    // ============================
    // 2) REFERRALS
    // ============================
    try {
      const snap = await getDocs(collection(db, "referrals")); // Modern SDK
      snap.forEach((docSnap) => {
        const d: any = docSnap.data();
        const patientName = d.patientName || ""; // Assuming patientName denormalization
        const specialistName = d.specialistName || "";
        const specialistRole = d.specialistRole || "";
        const reason = d.reason || "";

        if (
          matches(patientName, q) ||
          matches(specialistName, q) ||
          matches(specialistRole, q) ||
          matches(reason, q)
        ) {
          results.push({
            type: "referral",
            id: docSnap.id,
            linkId: docSnap.id,
            title: `${patientName || "Unknown patient"} → ${specialistName || "Unknown specialist"}`,
            subtitle: `${specialistRole || "Specialist"} • ${reason || "No reason recorded"}`,
          });
        }
      });
    } catch (err) {
      console.error("SEARCH REFERRALS ERROR:", err);
    }

    // ============================
    // 3) SPECIALISTS
    // ============================
    try {
      const snap = await getDocs(collection(db, "specialists")); // Modern SDK
      snap.forEach((docSnap) => {
        const d: any = docSnap.data();
        const name = d.name || "";
        const role = d.role || "";
        const contact = d.contact || "";

        if (matches(name, q) || matches(role, q)) {
          results.push({
            type: "specialist",
            id: docSnap.id,
            linkId: docSnap.id,
            title: name,
            subtitle: `${role}${contact ? " • " + contact : ""}`,
          });
        }
      });
    } catch (err) {
      console.error("SEARCH SPECIALISTS ERROR:", err);
    }

    // ============================
    // 4) ACTIVITY LOG
    // ============================
    // NOTE: Changed collection name from "activity" to "aiActivityLog" per project brief.
    try {
      const snap = await getDocs(collection(db, "aiActivityLog")); // Modern SDK
      snap.forEach((docSnap) => {
        const d: any = docSnap.data();
        const text = d.text || d.details || "";
        const type = d.type || "aiActivity";

        if (matches(text, q)) {
          results.push({
            type: "activity",
            id: docSnap.id,
            linkId: docSnap.id,
            title: text,
            subtitle: `Activity • ${type}`,
          });
        }
      });
    } catch (err) {
      console.error("SEARCH ACTIVITY ERROR:", err);
    }

    // Basic sort: push patients higher
    const sorted = results.sort((a, b) => {
      const priority = (t: string) => {
        if (t === "patient") return 1;
        if (t === "referral") return 2;
        if (t === "specialist") return 3;
        return 4;
      };
      return priority(a.type) - priority(b.type);
    });

    // --- Unified JSON Response Schema ---
    return NextResponse.json({
      success: true,
      data: sorted.slice(0, 30), // cap to 30 results (returned as 'data')
      error: null,
    });
  } catch (err: any) {
    console.error("GLOBAL SEARCH ERROR:", err);
    return NextResponse.json(
      { success: false, data: null, error: `Server Error: ${err.message || "Global Search failed."}` },
      { status: 500 }
    );
  }
}