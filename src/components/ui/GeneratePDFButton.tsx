// src/components/ui/GeneratePDFButton.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, FileText } from "lucide-react";

// Assuming the patient object contains a unique 'id' field
interface PatientData {
    id: string;
    // e.g., firstName?: string;
}

export default function GeneratePDFButton({ patient }: { patient: PatientData }) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handlePDF() {
        if (isLoading || !patient.id) return;

        setIsLoading(true);
        setError(null);
        
        try {
            // ✅ FIX APPLIED: Changed the URL to target the correct, comprehensive route handler.
            const res = await fetch(`/api/pdf-full-summary?patientId=${patient.id}`, { 
                method: "GET", 
            });

            if (!res.ok) {
                // If the API returns a 4xx or 5xx status, attempt to read the error message
                const errorText = res.headers.get("Content-Type")?.includes("application/json") 
                    ? (await res.json()).error || `Server responded with status ${res.status}`
                    : `Server responded with status ${res.status}`;
                
                // Throwing the error here ensures it goes into the catch block for handling
                throw new Error(errorText);
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            
            // Extract filename from Content-Disposition header if available
            const contentDisposition = res.headers.get('Content-Disposition');
            let filename = `SmartBridge-Summary-${patient.id}.pdf`;

            if (contentDisposition) {
                const matches = /filename="?([^"]*)"?/.exec(contentDisposition);
                if (matches && matches[1]) {
                    // Sanitizing the filename just in case
                    filename = matches[1].replace(/[^a-zA-Z0-9-._]/g, '_'); 
                }
            }

            // Trigger the download
            const a = document.createElement("a");
            a.href = url;
            a.download = filename; 
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a); // Clean up the temporary element

            URL.revokeObjectURL(url);

        } catch (e: any) {
            console.error("PDF generation failed:", e);
            // Display the detailed error message extracted above
            setError(e.message || "Failed to download summary PDF.");
        } finally {
            // Ensure loading state is reset in all cases (success or failure)
            setIsLoading(false);
        }
    }

    return (
        <div className="flex flex-col items-start space-y-1">
            <Button 
                onClick={handlePDF} 
                className="bg-teal-600 text-white hover:bg-teal-700"
                disabled={isLoading || !patient.id}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                    </>
                ) : (
                    <>
                        <FileText className="h-4 w-4 mr-2" />
                        Download Summary PDF
                    </>
                )}
            </Button>
            {error && (
                <p className="text-[10px] text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                    {error}
                </p>
            )}
        </div>
    );
}