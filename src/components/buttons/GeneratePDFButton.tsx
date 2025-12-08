// src/components/ui/GeneratePDFButton.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, FileText } from "lucide-react";

// 1. IMPORT the correct type for Button props (assuming Shadcn Button)
import type { ButtonProps } from "@/components/ui/button";

// Assuming the patient object contains a unique 'id' field
interface PatientData {
    id: string;
    // Add other fields if needed, but the ID is sufficient for the API call
    // e.g., firstName?: string;
}

// 2. EXTEND the functional component's props with ButtonProps
interface GeneratePDFButtonProps extends ButtonProps {
    patient: PatientData;
    // className (and other standard button props) are inherited from ButtonProps
}

// 3. Destructure 'className' from props
export default function GeneratePDFButton({ patient, className }: GeneratePDFButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handlePDF() {
        if (isLoading || !patient.id) return;

        setIsLoading(true);
        setError(null);
        
        try {
            // 🛠️ 1. SWITCH TO GET and pass ID via Query Parameter (Standard for downloads)
            const res = await fetch(`/api/pdf-summary?patientId=${patient.id}`, {
                method: "GET", // Changed from POST
            });

            if (!res.ok) {
                // If the API returns a 4xx or 5xx status, attempt to read the error message
                const errorText = res.headers.get("Content-Type")?.includes("application/json") 
                    ? (await res.json()).error || `Server responded with status ${res.status}`
                    : `Server responded with status ${res.status}`;
                
                throw new Error(errorText);
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            
            // Extract filename from Content-Disposition header if available, otherwise use a default
            const contentDisposition = res.headers.get('Content-Disposition');
            let filename = `SmartBridge-Summary-${patient.id}.pdf`;

            if (contentDisposition) {
                const matches = /filename="?([^"]*)"?/.exec(contentDisposition);
                if (matches && matches[1]) {
                    filename = matches[1];
                }
            }

            // Trigger the download
            const a = document.createElement("a");
            a.href = url;
            a.download = filename; // Use dynamic filename if available
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            URL.revokeObjectURL(url);

        } catch (e: any) {
            console.error("PDF generation failed:", e);
            setError(e.message || "Failed to download summary PDF.");
        } finally {
            // 🛠️ 2. Ensure loading state is reset in all cases
            setIsLoading(false);
        }
    }

    return (
        <div className="flex flex-col items-start space-y-1">
            <Button 
                onClick={handlePDF} 
                // 4. APPLY the className prop here.
                className={`bg-teal-600 text-white hover:bg-teal-700 ${className}`}
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