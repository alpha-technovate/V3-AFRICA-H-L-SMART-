"use client";

import { useEffect, useState } from "react";

export function usePatients() {
  const [patients, setPatients] = useState<any[]>([]);

  useEffect(() => {
    async function fetchPatients() {
      try {
        const res = await fetch("/api/patients");
        const data = await res.json();

        // API returns: { success: true, patients: [...] }
        if (data && Array.isArray(data.patients)) {
          setPatients(data.patients);
        } else {
          console.warn("API returned unexpected shape:", data);
          setPatients([]);
        }
      } catch (err) {
        console.error("Failed to load patients:", err);
        setPatients([]);
      }
    }

    fetchPatients();
  }, []);

  return { patients };
}
