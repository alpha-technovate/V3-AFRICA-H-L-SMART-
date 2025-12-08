"use client";

import { useState } from "react";
import { Dialog, DialogHeader, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ImageIcon } from "lucide-react";

export default function ExplainScanModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [fileBase64, setFileBase64] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  function handleFile(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setFileBase64(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function runExplain() {
    if (!fileBase64) return;
    setLoading(true);
    setResult("");

    try {
      const res = await fetch("/api/explain-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: fileBase64 }),
      });

      const json = await res.json();

      if (json.success) {
        setResult(json.explanation);
      } else {
        setResult("AI failed: " + json.error);
      }
    } catch (err: any) {
      setResult("Error: " + err.message);
    }

    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="space-y-4">
        <DialogHeader>Explain This Medical Image</DialogHeader>

        <input
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="text-sm"
        />

        {fileBase64 && (
          <img
            src={fileBase64}
            className="w-full rounded-md border shadow-sm mt-2"
          />
        )}

        <Button
          onClick={runExplain}
          disabled={!fileBase64 || loading}
          className="w-full bg-teal-600"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <ImageIcon className="w-4 h-4 mr-2" />
          )}
          Explain With AI
        </Button>

        {result && (
          <Textarea
            value={result}
            readOnly
            rows={8}
            className="mt-3 text-sm"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
