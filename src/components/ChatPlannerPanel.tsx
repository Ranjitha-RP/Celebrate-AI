import React, { useState } from "react";
import { Send } from "lucide-react";
import { HydratedEvent } from "../shared/schemas";
import { formatInr } from "../lib/format";

interface ChatPlannerPanelProps {
  event: HydratedEvent;
  onSendMessage: (message: string) => Promise<void>;
  isSending: boolean;
}

const QUICK_PROMPTS = [
  "Reduce total budget by 20% and rebalance",
  "Swap entertainment to a lively DJ & bilingual emcee",
  "Add live kesar badam kulfi cart to the catering menu",
  "Increase budget by 15% and upgrade venue & decor",
];

export const ChatPlannerPanel: React.FC<ChatPlannerPanelProps> = ({
  event,
  onSendMessage,
  isSending,
}) => {
  const [input, setInput] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = input.trim();
    if (!msg || isSending) return;
    setInput("");
    await onSendMessage(msg);
  };

  return (
    <div className="bg-white border border-stone-200/90 rounded-xl flex flex-col h-[640px]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-stone-900">
            Conversational Plan Co-Architect
          </h2>
          <p className="text-xs text-stone-500">
            Ask for budget cuts, vendor swaps, or menu tweaks—returns a
            validated JSON PlanPatch and highlights live changes.
          </p>
        </div>
        <span className="text-xs font-mono tabular-nums text-stone-600">
          Current Ceiling: {formatInr(event.input.totalBudget)}
        </span>
      </div>

      {/* Quick Prompts */}
      <div className="px-6 py-3 bg-stone-50 border-b border-stone-200/80 flex flex-wrap items-center gap-2">
        <span className="text-xs text-stone-500 mr-1">Try saying:</span>
        {QUICK_PROMPTS.map((q) => (
          <button
            key={q}
            type="button"
            disabled={isSending}
            onClick={() => onSendMessage(q)}
            className="px-3 py-1.5 text-xs font-medium bg-white border border-stone-200 text-stone-700 hover:border-rose-600 hover:text-rose-800 rounded-md transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {event.chatHistory.map((m) => (
          <div
            key={m.id}
            className={`flex ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xl rounded-xl px-4 py-3 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-stone-900 text-white"
                  : "bg-stone-100 text-stone-800 border border-stone-200/80"
              }`}
            >
              <p>{m.content}</p>
              {m.changedSections && m.changedSections.length > 0 && (
                <p className="text-[11px] font-mono text-amber-800 mt-2 pt-2 border-t border-stone-200">
                  Patched sections: {m.changedSections.join(" · ")}
                </p>
              )}
            </div>
          </div>
        ))}

        {isSending && (
          <div className="flex justify-start">
            <div className="bg-stone-100 border border-stone-200 rounded-xl px-4 py-3 text-xs text-stone-600 animate-pulse">
              Retrieving matching {event.input.city} vendors, computing KKT
              budget rebalance &amp; validating PlanPatch JSON...
            </div>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-stone-200 flex items-center gap-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g., Reduce budget by 20%, add a live Carnatic band, or make decor cheaper..."
          className="flex-1 px-4 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
        />
        <button
          type="submit"
          disabled={isSending || !input.trim()}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          Apply Patch
        </button>
      </form>
    </div>
  );
};
