"use client";

export default function DocumentsPage() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold text-teal-700">Documents</h1>
      <p className="text-gray-600">Uploaded scans, PDFs and patient documents will be displayed here.</p>

      <div className="p-4 border rounded text-gray-500">
        No documents uploaded yet.
      </div>
    </div>
  );
}
