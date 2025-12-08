"use client";

import React, { useEffect, useRef, useState, FormEvent } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";

type ChatRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

// 👇 Directory specialist shape (from /api/specialists)
interface Specialist {
  id: string;
  name: string;
  role: string;
  contact: string;
  imageUrl?: string;
  description?: string;
}

type AssistantAction =
  | { type: "CALL_SPECIALIST"; specialist: Specialist }
  | { type: "NONE" };

// 🔍 Helper: does the assistant text say "call Dr X" / "phone Dr X"?
function findSpecialistMention(
  message: string,
  specialists: Specialist[]
): Specialist | null {
  const lower = message.toLowerCase();

  // Only bother if it even mentions "call" or "phone"
  if (!lower.includes("call") && !lower.includes("phone")) return null;

  for (const sp of specialists) {
    const nameLower = sp.name.toLowerCase();          // e.g. "dr sanjay maharaj"
    const noTitle = nameLower.replace(/^dr\.?\s+/, ""); // e.g. "sanjay maharaj"

    if (lower.includes(nameLower) || lower.includes(noTitle)) {
      return sp;
    }
  }

  return null;
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content:
        "Hi, I’m the SmartBridge AI assistant.\n\nHere you can:\n• Ask clinical questions\n• Get guideline-style answers\n• Draft referral letters and discharge summaries\n• Interpret vitals, labs or echo reports (text that you paste)\n\nFor in-app actions (like finding a patient, adding vitals or meds), you can also use the floating assistant bottom-right.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // 👇 Directory state (specialists) + detected action
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [pendingAction, setPendingAction] = useState<AssistantAction | null>(
    null
  );

  // Auto-scroll chat
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🔹 Load specialists directory once (from your API)
  useEffect(() => {
    async function loadSpecialists() {
      try {
        const res = await fetch("/api/specialists");
        const json = await res.json();

        if (json.success && Array.isArray(json.specialists)) {
          setSpecialists(json.specialists);
        } else if (Array.isArray(json.data)) {
          // fallback if old API shape
          setSpecialists(json.data);
        } else {
          console.warn("Unexpected /api/specialists response:", json);
        }
      } catch (err) {
        console.error("Failed loading specialists directory:", err);
      }
    }

    loadSpecialists();
  }, []);

  // 🔹 Watch last assistant message → detect "call Dr X"
  useEffect(() => {
    if (!messages.length || !specialists.length) {
      setPendingAction(null);
      return;
    }

    const last = messages[messages.length - 1];
    if (last.role !== "assistant") {
      setPendingAction(null);
      return;
    }

    const content = last.content.trim();
    if (!content) {
      setPendingAction(null);
      return;
    }

    const match = findSpecialistMention(content, specialists);

    if (match) {
      setPendingAction({ type: "CALL_SPECIALIST", specialist: match });
    } else {
      setPendingAction(null);
    }
  }, [messages, specialists]);

  function pushMessage(role: ChatRole, content: string) {
    setMessages((m) => [
      ...m,
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        role,
        content,
      },
    ]);
  }

  async function handleSend(e?: FormEvent) {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");
    setError(null);

    // 1) Show user message
    pushMessage("user", userText);

    // 2) Reserve an assistant bubble
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setMessages((prev) => [
      ...prev,
      { id, role: "assistant", content: "" },
    ]);

    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: userText,
          // general brain context
          patientId: null,
          context: "/ai-assistant",
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "AI failed. Please try again.");
        setMessages((prev) =>
          prev.map((m) =>
            m.id === id
              ? {
                  ...m,
                  content:
                    "Sorry, I couldn’t process that. Please try again.",
                }
              : m
          )
        );
        setLoading(false);
        return;
      }

      if (data.type === "chat") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === id ? { ...m, content: data.reply } : m
          )
        );
      }

      if (data.type === "command") {
        const explanation =
          data.llmMessage ||
          "I’ve interpreted this as an action. Use the floating assistant to execute it inside the EMR.";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === id ? { ...m, content: explanation } : m
          )
        );
      }
    } catch (err) {
      console.error("AI CHAT ERROR:", err);
      setError("Connection to the assistant failed.");
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id
            ? {
                ...m,
                content:
                  "The assistant is unavailable right now. Please try again shortly.",
              }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full w-full flex-col p-6 gap-4">
      <div>
        <h1 className="text-2xl font-bold text-teal-700">
          SmartBridge AI Assistant
        </h1>
        <p className="text-sm text-gray-600">
          Clinical Q&amp;A, summaries, and drafting help. For live EMR actions,
          use the floating assistant.
        </p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        {/* CHAT SCROLL AREA */}
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-teal-600 text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-900 rounded-bl-sm"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl bg-gray-100 px-3 py-2 text-sm text-gray-700">
                <Loader2 className="w-4 h-4 animate-spin" />
                Thinking…
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* 🔔 ACTION BAR: e.g. "Call Dr Sanjay Maharaj" */}
        {pendingAction?.type === "CALL_SPECIALIST" && (
          <div className="border-t border-emerald-100 px-4 py-3 bg-emerald-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <p className="text-sm text-emerald-900">
                Assistant suggests calling{" "}
                <span className="font-semibold">
                  {pendingAction.specialist.name}
                </span>
                .
              </p>
              <p className="text-xs text-emerald-800">
                {pendingAction.specialist.role} ·{" "}
                {pendingAction.specialist.contact}
              </p>
            </div>

            {pendingAction.specialist.contact !== "N/A" && (
              <a
                href={`tel:${pendingAction.specialist.contact}`}
                className="inline-flex items-center justify-center rounded-full px-3 py-1 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Call now
              </a>
            )}
          </div>
        )}

        {error && (
          <div className="px-4 pb-1 text-xs text-red-600">{error}</div>
        )}

        {/* INPUT FORM */}
        <form
          onSubmit={handleSend}
          className="border-t px-4 py-3 flex items-end gap-2 bg-white"
        >
          <Textarea
            rows={1}
            className="resize-none text-sm"
            placeholder="Ask any clinical question, or paste a consult to summarise…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />

          <Button
            type="submit"
            className="flex items-center gap-1 bg-teal-600 hover:bg-teal-700"
            disabled={loading || !input.trim()}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Send</span>
          </Button>
        </form>
      </Card>
    </div>
  );
}
