// src/components/buttons/GenerateMotivationalLetterButton.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Zap } from "lucide-react";

// 1. IMPORT the correct type for Button props (assuming Shadcn Button)
import type { ButtonProps } from "@/components/ui/button"; 

// 2. EXTEND the functional component's props with ButtonProps
interface GenerateMotivationalLetterButtonProps extends ButtonProps {
  patientId: string;
  // className (and other standard button props) are inherited from ButtonProps
}

// 3. Destructure 'className' from props
export default function GenerateMotivationalLetterButton({
  patientId,
  className, // <-- className is now accepted
}: GenerateMotivationalLetterButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);
    
    // Check for valid patient ID before fetching
    if (!patientId) {
      setError("Error: Missing patient ID.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/pdf-motivation?patientId=${patientId}`);

      if (!res.ok) {
        // Attempt to read error message from the response body if available
        const errorText = res.headers.get("Content-Type")?.includes("application/json") 
          ? (await res.json()).error || `HTTP Error ${res.status}`
          : `Server responded with status ${res.status}`;
        
        throw new Error(errorText);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      // Trigger the download
      const a = document.createElement("a");
      a.href = url;
      a.download = `SmartBridge-Motivational-Letter-${patientId}.pdf`;
      document.body.appendChild(a); // Append anchor element to body
      a.click();
      document.body.removeChild(a); // Clean up

      URL.revokeObjectURL(url);
      
    } catch (e: any) {
      console.error("PDF download failed:", e);
      setError(e.message || "Failed to generate motivational letter PDF.");
      
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start space-y-1">
      <Button 
        onClick={handleDownload} 
        // 4. APPLY the className prop here.
        className={`bg-purple-600 text-white hover:bg-purple-700 ${className}`} 
        disabled={isLoading || !patientId}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Zap className="h-4 w-4 mr-2" />
            Generate Motivational Letter
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