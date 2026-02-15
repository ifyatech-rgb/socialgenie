"use client";

import { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isDraft = script.lifecycleStatus !== "finalized";
  const refinementCount = script.refinementCount ?? 0;

  return (
    <div className="flex h-full min-h-0 flex-col rounded-2xl border-2 border-gray-200 bg-white overflow-hidden shadow-sm">
      {/* Genie header - compact and professional */}
      <div className="flex flex-none shrink-0 items-center gap-2 sm:gap-3 border-b-2 border-gray-100 bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/20 text-lg sm:h-10 sm:w-10 sm:text-xl">
          🧞‍♂️
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-white sm:text-base">Genie Assistant</h3>
          <p className="flex items-center gap-1.5 text-xs text-white/90 sm:gap-2">
            <span>{refinementCount} wishes granted</span>
            <span className="hidden text-white/60 sm:inline">•</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[11px] sm:text-xs">
              {isDraft ? "Draft" : "Finalized"}
            </span>
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-2 sm:space-y-3 overscroll-contain">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 sm:gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
              msg.role === "user" ? "flex-row-reverse" : ""
            }`}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm sm:h-8 sm:w-8 sm:text-base">
              {msg.role === "user" ? "👤" : "🧞‍♂️"}
            </div>
            <div
              className={`max-w-[85%] sm:max-w-[78%] rounded-xl px-3 py-2 text-sm leading-relaxed sm:px-3.5 sm:py-2.5 ${
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
          <div className="flex gap-2 sm:gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200 sm:h-8 sm:w-8">🧞‍♂️</div>
            <div className="flex max-w-[85%] sm:max-w-[78%] flex-col gap-2 rounded-xl bg-gray-100 px-3 py-2.5 sm:px-3.5">
              <div className="text-xs font-semibold text-gray-500 sm:text-[13px]">✨ Genie is working on your script...</div>
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-500 [animation-delay:0ms] sm:h-2 sm:w-2" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-500 [animation-delay:150ms] sm:h-2 sm:w-2" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-500 [animation-delay:300ms] sm:h-2 sm:w-2" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {isDraft && (
        <div className="flex flex-none shrink-0 gap-2 border-t-2 border-gray-100 bg-gray-50/80 p-3 sm:p-4">
          <textarea
            className="min-h-[72px] flex-1 resize-none rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 sm:min-h-[80px] sm:px-4 sm:py-3"
            placeholder="Tell Genie what to improve... (e.g., 'Make the hook more dramatic')"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            disabled={isRefining}
            style={{ fontSize: "16px" }}
          />
          <button
            type="button"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isRefining}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 touch-manipulation sm:h-12 sm:w-12"
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
