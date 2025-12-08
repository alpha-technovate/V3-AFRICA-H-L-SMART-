// src/components/SmartBridgeAssistant.tsx
"use client";

import React, {
  useEffect,
  useRef,
  useState,
  FormEvent,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { Bot, Mic, Loader2, Send } from "lucide-react";
import { streamAI } from "@/lib/ai";

// ----------------------------
// TYPES
// ----------------------------
type ChatRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

export default function SmartBridgeAssistant() {
  const router = useRouter();

  // --- HYDRATION FIX: ensure client-side only ---
  const [isClient, setIsClient] = useState(false);

  // ------------------------------------
  // UI State
  // ------------------------------------
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello doctor 👋\nI’m your SmartBridge Assistant.\n\nYou can:\n• Ask clinical questions\n• Say: “Find patient John Smith”\n• Say: “Add BP 130/80”\n• Say: “Prescribe amoxicillin 500mg”\n\nHow can I help you today?",
    },
  ]);

  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  // --------------------------------------------
  // Helper: Push message
  // --------------------------------------------
  const pushMessage = useCallback((role: ChatRole, content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString() + Math.random().toString().slice(2, 8),
        role,
        content,
      },
    ]);
  }, []);

  // --------------------------------------------
  // GET CURRENT PATIENT ID
  // --------------------------------------------
  const getCurrentPatientId = useCallback((): string | null => {
    if (typeof window === "undefined") return null;
    const match = window.location.pathname.match(/patients\/([^/]+)/);
    return match ? match[1] : null;
  }, []);

  // --------------------------------------------
  // SEND TEXT TO LLM (stream)
  // --------------------------------------------
  async function sendToLLM(userText: string) {
    setError(null);

    const id = Date.now().toString() + "-" + Math.random().toString(16);

    setMessages((prev) => [...prev, { id, role: "assistant", content: "" }]);

    setStreaming(true);

    try {
      await streamAI(userText, (token) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === id ? { ...m, content: m.content + token } : m
          )
        );
      });
    } catch (err) {
      console.error("STREAM ERROR:", err);
      setError("Connection lost. Please try again.");
    } finally {
      setStreaming(false);
    }
  }

  // --------------------------------------------
  // SEND TEXT MESSAGE
  // --------------------------------------------
  async function handleSend(e?: FormEvent) {
    if (e) e.preventDefault();
    if (!input.trim() || streaming) return;

    const text = input.trim();
    setInput("");

    pushMessage("user", text);

    const handled = await handleVoiceCommand(text);
    if (!handled) {
      await sendToLLM(text);
    }
  }

  // --------------------------------------------
  // START SPEECH-TO-TEXT
  // --------------------------------------------
  function startListening() {
    if (!isClient) return;

    const Speech =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;

    if (!Speech) {
      pushMessage(
        "assistant",
        "Your browser does not support speech recognition."
      );
      return;
    }

    const rec = new Speech();
    rec.lang = "en-US";
    rec.interimResults = false;

    setListening(true);
    recognitionRef.current = rec;

    rec.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setListening(false);

      pushMessage("user", transcript);

      const handled = await handleVoiceCommand(transcript);
      if (!handled) {
        sendToLLM(transcript);
      }
    };

    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);

    rec.start();
  }

  // -----------------------------------------------------------------------
  // CORE LOGIC: HANDLE VOICE ACTION & DISPATCH
  // -----------------------------------------------------------------------
  async function handleVoiceCommand(text: string): Promise<boolean> {
    setProcessing(true);
    setError(null);

    try {
      const res = await fetch("/api/voice/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text }),
      });

      const cmd = await res.json();

      if (!cmd.success || !cmd.action || cmd.action === "unknown") {
        setProcessing(false);
        return false;
      }

      const action: string = cmd.action;
      const payload: Record<string, any> = cmd.payload || {};
      const patientId = getCurrentPatientId();
      let commandExecuted = true;
      let apiResult: any = { success: false };

      // --- DATA WRITES ---
      if (
        action.startsWith("add_") ||
        action === "create_referral" ||
        action === "prescribe_medication" ||
        action === "update_history" ||
        action === "clear_history"
      ) {
        if (!patientId) {
          pushMessage(
            "assistant",
            `I need to know which patient you're referring to first. Try saying “Find patient [Name]”.`
          );
          return true;
        }

        const enrichedPayload: Record<string, any> = { ...payload };

        if (action === "clear_history" && !enrichedPayload.mode) {
          enrichedPayload.mode = "clear";
        }

        const body = {
          patientId,
          payload: enrichedPayload,
        };

        let targetRoute = "";

        switch (action) {
          case "add_vital_signs":
            targetRoute = "/api/voice/add-vitals";
            break;
          case "add_medication":
          case "prescribe_medication":
            targetRoute = "/api/voice/add-medication";
            break;
          case "add_allergy":
            targetRoute = "/api/voice/add-allergy";
            break;
          case "add_chronic_condition":
            targetRoute = "/api/voice/add-chronic";
            break;
          case "add_note":
          case "add_soap_note":
            targetRoute = "/api/voice/add-note";
            break;
          case "add_history":
          case "update_history":
          case "clear_history":
            targetRoute = "/api/voice/add-history";
            break;
          case "create_referral":
            targetRoute = "/api/voice/add-referral";
            break;
          default:
            commandExecuted = false;
        }

        if (targetRoute) {
          const writeRes = await fetch(targetRoute, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

          apiResult = await writeRes.json();

          if (apiResult.success) {
            const label =
              action === "clear_history"
                ? "History section cleared"
                : action
                    .replace(/_/g, " ")
                    .replace("add ", "")
                    .replace("create ", "New ")
                    .replace("update ", "Updated ");

            pushMessage("assistant", `${label} successfully.`);
          } else {
            pushMessage(
              "assistant",
              `Error recording data: ${
                apiResult.error || "Missing required data."
              }`
            );
          }
          return true;
        }
      }

      // --- NAVIGATION ---
      else if (action.startsWith("go_")) {
        const tab = action.replace("go_", "");

        if (tab === "dashboard" || tab === "patients") {
          router.push(tab === "dashboard" ? "/" : "/patients");
        } else if (patientId) {
          router.push(`/patients/${patientId}?tab=${tab}`);
        } else {
          pushMessage(
            "assistant",
            `To navigate to the ${tab} section, please select a patient first.`
          );
          return true;
        }

        pushMessage(
          "assistant",
          `Navigating to the ${
            tab.charAt(0).toUpperCase() + tab.slice(1)
          } section.`
        );
        return true;
      }

      // --- PATIENT FINDER ---
      else if (action === "find_patient") {
        const searchRes = await fetch("/api/patients/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: payload.name }),
        });

        const search = await searchRes.json();

        if (!search.success || !search.data?.length) {
          pushMessage(
            "assistant",
            `No patient found matching “${payload.name}”.`
          );
        } else if (search.data.length === 1) {
          router.push(`/patients/${search.data[0].id}`);
          pushMessage("assistant", `Opening patient ${search.data[0].name}.`);
        } else {
          pushMessage(
            "assistant",
            `Multiple matches found. Showing patient directory.`
          );
          router.push("/patients");
        }
        return true;
      }

      if (commandExecuted) return true;
      return false;
    } catch (err) {
      console.error("FATAL VOICE DISPATCH ERROR:", err);
      pushMessage(
        "assistant",
        "An unexpected error occurred during command processing. Check your network."
      );
      return true;
    } finally {
      setProcessing(false);
    }
  }

  // ------------------------------------------------
  // UI SECTION
  // ------------------------------------------------

  if (!isClient) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-[999] flex h-14 w-14 items-center justify-center rounded-full bg-teal-600 text-white shadow-lg shadow-teal-500/40 ring-2 ring-teal-200 transition-all hover:scale-110 hover:bg-teal-700 hover:shadow-xl hover:shadow-teal-500/60 active:scale-95"
      >
        {listening ? (
          <Loader2 className="w-7 h-7 animate-spin" />
        ) : (
          <Bot className="w-7 h-7" />
        )}
      </button>

      {/* Small “working” chip */}
      {processing && (
        <div className="fixed bottom-28 right-6 z-[999] rounded-full border border-teal-100 bg-white/95 px-3 py-1.5 text-xs shadow-sm flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-700" />
          <span className="text-slate-700">Processing command…</span>
        </div>
      )}

      {/* Assistant Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl h-[80vh] p-0 flex flex-col overflow-hidden rounded-2xl border border-teal-100 bg-gradient-to-b from-slate-50 to-white">
          {/* Hidden title for accessibility */}
          <DialogHeader className="px-6 pt-4 pb-0">
            <DialogTitle className="text-[0px] leading-none">
              SmartBridge Assistant
            </DialogTitle>
          </DialogHeader>

          {/* Visible header */}
          <div className="px-6 pt-3 pb-3 flex items-center gap-3 border-b border-teal-50/80 bg-white/70 backdrop-blur">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 border border-teal-200">
              <Bot className="h-5 w-5 text-teal-700" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm sm:text-base font-semibold text-slate-900">
                SmartBridge Assistant
              </h2>
              <p className="text-[11px] text-slate-500">
                Say “Find patient…”, “Add BP…”, “Prescribe…”, “Update history…”
              </p>
            </div>

            <button
              type="button"
              onClick={startListening}
              className={`ml-auto flex h-9 w-9 items-center justify-center rounded-full border text-xs transition ${
                listening
                  ? "border-red-200 bg-red-50 text-red-600"
                  : "border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100"
              }`}
            >
              {listening ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Optional error banner */}
          {error && (
            <div className="mx-4 mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700 flex items-center gap-2">
              <span className="font-semibold">Error:</span>
              <span className="line-clamp-2">{error}</span>
            </div>
          )}

          {/* CHAT BODY */}
          <Card className="flex-1 m-4 mt-3 mb-3 overflow-hidden flex flex-col border border-slate-100 bg-white/90 shadow-sm rounded-2xl">
            <div className="flex-1 overflow-auto px-4 py-3 space-y-3 bg-slate-50/70">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-xs sm:text-sm whitespace-pre-wrap shadow-sm ${
                      m.role === "user"
                        ? "bg-teal-600 text-white rounded-br-sm"
                        : "bg-white text-slate-900 rounded-bl-sm border border-slate-100"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {streaming && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl bg-white px-3.5 py-2 text-xs text-slate-700 border border-slate-100 shadow-sm">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                    <span>Thinking…</span>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* CHAT INPUT */}
            <form
              onSubmit={handleSend}
              className="border-t border-slate-100 p-3 flex gap-2 bg-white/95"
            >
              <Textarea
                rows={1}
                className="resize-none text-xs sm:text-sm rounded-xl border-slate-200 focus-visible:ring-teal-600"
                placeholder="Type your question or instruction…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={streaming}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />

              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={startListening}
                  disabled={streaming || listening}
                  className="h-9 w-9 rounded-full border-slate-200 text-slate-700 hover:bg-teal-50 hover:text-teal-700"
                >
                  <Mic className="w-4 h-4" />
                </Button>

                <Button
                  type="submit"
                  className="h-9 w-9 rounded-full bg-teal-600 hover:bg-teal-700 flex items-center justify-center"
                  disabled={!input.trim() || streaming}
                >
                  {streaming ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Send className="w-4 h-4 text-white" />
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </DialogContent>
      </Dialog>
    </>
  );
}
