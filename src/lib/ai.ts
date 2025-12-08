// /src/lib/ai.ts
// Updated streaming helper for Aqua UI + Gemini

// --- Type Definition for Structured Command Output ---
export type VoiceCommandResult = {
  action: string; // e.g., 'ADD_VITALS', 'GO_TO_TAB', 'ADD_ALLERGY'
  payload: Record<string, any>; // The data required for the action
};
// --- End Type Definition ---

export async function streamAI(
  prompt: string,
  onToken: (token: string) => void
): Promise<void> {
  try {
    const response = await fetch("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: prompt }),
    });

    const data = await response.json();

    if (!data?.success) {
      onToken("Sorry, I couldn’t process that. Please try again.");
      return;
    }

    let text = "";

    // SAFEST extraction (future-proof)
    if (typeof data.reply === "string") {
      text = data.reply.trim();
    } else if (typeof data.reply?.text === "function") {
      text = data.reply.text()?.trim() ?? "";
    } else if (typeof data.reply?.text === "string") {
      text = data.reply.text.trim();
    }

    if (!text) {
      onToken("I didn’t receive a valid reply. Try again.");
      return;
    }

    // Word-by-word streaming
    const words = text.split(" ");
    for (const w of words) {
      onToken(w + " ");
      await delay(8); // Faster, smoother
    }
  } catch (error) {
    console.error("streamAI ERROR:", error);
    onToken("The assistant is unavailable right now. Please try again.");
  }
}


/**
 * Non-streaming function to parse voice transcripts into a structured action/payload object.
 * Fetches from a dedicated API endpoint that uses Gemini's structured output capability.
 * @param transcript The raw voice input string (e.g., "add blood pressure one twenty over eighty and heart rate ninety").
 * @returns A promise that resolves to a structured VoiceCommandResult object.
 */
export async function parseVoiceCommand(
  transcript: string, 
  patientId: string
): Promise<VoiceCommandResult> {
    try {
        const response = await fetch("/api/ai/command-parser", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                transcript: transcript,
                patientId: patientId 
            }),
        });

        const json = await response.json();
        
        if (json.success && json.data?.action) {
            return json.data as VoiceCommandResult;
        }

        console.error("Command parsing failed:", json.error);
        throw new Error(json.error || "AI failed to generate a structured command.");

    } catch (error) {
        console.error("parseVoiceCommand ERROR:", error);
        // Return a default, non-database action on failure
        return {
            action: 'REPLY_FAILURE',
            payload: { message: "I could not understand that command. Please try again." }
        };
    }
}


function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}