"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Check } from "lucide-react";

export type ScriptWithRefinement = {
  id: string;
  content: string;
  lifecycleStatus?: string;
  refinementCount?: number;
  chatHistory?: Array<{ role: string; content: string }>;
};

type Props = {
  script: ScriptWithRefinement;
  onUpdate: (updated: ScriptWithRefinement) => void;
  onFinalize: (data: { creditsRemaining: number }) => void;
};

export default function ScriptRefinementChat({ script, onUpdate, onFinalize }: Props) {
  const [messages, setMessages] = useState<Array<{ id: number; role: string; content: string }>>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const history = script.chatHistory;
    if (history && history.length > 0) {
      const formatted = history.map((msg, idx) => ({
        id: idx,
        role: msg.role,
        content: msg.role === "assistant" ? "🧞‍♂️ **Genie has worked its magic!** ✨\n\nYour script has been refined. Check the preview to see the changes!" : msg.content,
      }));
      setMessages(formatted);
    } else {
      setMessages([
        {
          id: 0,
          role: "assistant",
          content:
            "🧞‍♂️ Hi! I'm **Genie**, your magical script assistant! ✨\n\nJust tell me what you'd like to change and I'll make it perfect!\n\n**Try saying:**\n- \"Make the hook more dramatic\"\n- \"Add more urgency to the CTA\"\n- \"Make it funnier\"\n- \"Improve the middle part\"",
        },
      ]);
    }
  }, [script.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isRefining) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setIsRefining(true);

    const newUserMessage = { id: messages.length, role: "user", content: userMessage };
    setMessages((prev) => [...prev, newUserMessage]);

    try {
      const res = await fetch("/api/scripts/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          scriptId: script.id,
          userMessage,
          currentScript: script.content,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const aiMessage = {
          id: messages.length + 1,
          role: "assistant",
          content: "🧞‍♂️ **Genie has worked its magic!** ✨\n\nYour script has been refined. Check the preview to see the changes!",
        };
        setMessages((prev) => [...prev, aiMessage]);
        onUpdate(data.script);

        if (typeof window !== "undefined") {
          localStorage.setItem("dashboard-refresh", Date.now().toString());
          window.dispatchEvent(new CustomEvent("dashboard-refresh"));
        }
      } else {
        if (data.code === "genie_limit_reached") {
          throw new Error("No Genie edits remaining. Upgrade your plan for more script refinements!");
        }
        throw new Error(data.error ?? data.message ?? "Failed to refine");
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Could not refine script";
      setMessages((prev) => [
        ...prev,
        { id: messages.length + 1, role: "assistant", content: `🧞‍♂️ ${errMsg}` },
      ]);
    } finally {
      setIsRefining(false);
    }
  };

  const handleFinalize = async () => {
    if (isFinalizing) return;
    if (!confirm("Finalize this script? This will charge 1 credit and lock the script for editing.")) return;

    setIsFinalizing(true);
    try {
      const res = await fetch("/api/scripts/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ scriptId: script.id }),
      });

      const data = await res.json();

      if (data.success) {
        if (typeof window !== "undefined") {
          localStorage.setItem("dashboard-refresh", Date.now().toString());
          window.dispatchEvent(new CustomEvent("dashboard-refresh"));
        }
        onFinalize(data);
      } else {
        alert("❌ " + (data.error ?? "Failed to finalize"));
      }
    } catch {
      alert("Failed to finalize script");
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isDraft = script.lifecycleStatus !== "finalized";
  const refinementCount = script.refinementCount ?? 0;

  return (
    <div className="flex h-full flex-col rounded-2xl border-2 border-gray-200 bg-white overflow-hidden shadow-sm">
      <div className="flex flex-none items-center justify-between gap-4 border-b-2 border-gray-100 bg-gray-50/80 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-2xl">
            🧞‍♂️
          </div>
          <div>
            <h3 className="font-bold text-gray-900">✨ Genie - Your Script Assistant</h3>
            <p className="text-xs text-gray-500">
              {refinementCount} wishes granted ✨ • {isDraft ? "📝 Draft" : "✅ Finalized"}
            </p>
          </div>
        </div>
        {isDraft && (
          <button
            type="button"
            onClick={handleFinalize}
            disabled={isFinalizing}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60"
          >
            <Check className="h-4 w-4" />
            {isFinalizing ? "✨ Making it official…" : "Lock it in (1 credit)"}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
              msg.role === "user" ? "flex-row-reverse" : ""
            }`}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-base">
              {msg.role === "user" ? "👤" : "🧞‍♂️"}
            </div>
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              <span className="whitespace-pre-wrap">{msg.content}</span>
            </div>
          </div>
        ))}
        {isRefining && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200">🧞‍♂️</div>
            <div className="flex max-w-[85%] flex-col gap-2 rounded-xl bg-gray-100 px-3 py-2.5">
              <div className="text-[13px] font-semibold text-gray-500">✨ Genie is working on your script...</div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-500 [animation-delay:0ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-500 [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-500 [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {isDraft && (
        <div className="flex flex-none gap-2 border-t-2 border-gray-100 bg-gray-50/80 p-4">
          <textarea
            className="min-h-[80px] flex-1 resize-none rounded-xl border-2 border-gray-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            placeholder="✨ Tell Genie what to improve... (e.g., 'Make the hook more dramatic')"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            disabled={isRefining}
          />
          <button
            type="button"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isRefining}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      )}

      {!isDraft && (
        <div className="flex-none border-t-2 border-gray-100 bg-emerald-50/80 px-4 py-3 text-center text-sm font-semibold text-emerald-700">
          ✅ This script is locked in! Genie can't change finalized scripts. Create a new draft to work with Genie again! 🧞‍♂️
        </div>
      )}
    </div>
  );
}
