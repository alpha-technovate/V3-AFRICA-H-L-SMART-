"use client";

import { useEffect, useState } from "react";

export default function AIActivityLogPage() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/ai-activity-log");
        if (res.ok) {
          const json = await res.json();
          setLogs(json.logs || []);
        }
      } catch (e) {
        console.error("AI activity log error:", e);
      }
    }
    load();
  }, []);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold text-teal-700">AI Activity Log</h1>
      <p className="text-gray-600">All AI interactions and system-generated actions will be logged here.</p>

      <div className="space-y-4">
        {logs.map((log) => (
          <div key={log.id} className="border rounded p-4">
            <p className="font-semibold">{log.type}</p>
            <p className="text-gray-600 text-sm">{log.description}</p>
          </div>
        ))}
      </div>

      {logs.length === 0 && (
        <div className="text-gray-500 p-4 border rounded">No AI activity yet.</div>
      )}
    </div>
  );
}
