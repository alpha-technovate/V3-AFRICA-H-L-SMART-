// src/lib/firestoreValidator.ts

// Firestore NEVER allows: undefined, null (sometimes), empty strings, or invalid IDs.
// This wrapper sanitizes all data before it touches Firestore.

export function cleanData(obj: any): any {
  if (obj === undefined) return null;

  if (Array.isArray(obj)) {
    return obj.map((v) => cleanData(v));
  }

  if (obj !== null && typeof obj === "object") {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      const value = obj[key];

      if (value === undefined || value === "") {
        // Remove empty fields — Firestore hates undefined/empty strings
        continue;
      }

      cleaned[key] = cleanData(value);
    }
    return cleaned;
  }

  return obj;
}

// Ensure the ID is always safe
export function safeId(id: any): string {
  if (!id || typeof id !== "string") {
    return `AUTO_${Date.now()}_${Math.floor(Math.random() * 999999)}`;
  }

  // Firestore-safe characters only
  return id.replace(/[^a-zA-Z0-9_-]/g, "") || `AUTO_${Date.now()}`;
}
