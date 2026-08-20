"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Loader2, Sparkles, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Ask the panel a question, at the foot of every page in it.
 *
 * The figures are all already on these screens; what was missing was a way to
 * ask something that crosses two of them — how many air conditioners are
 * booked for tomorrow, what people keep adding and not booking. It answers
 * from a snapshot of the panel's own numbers, so it can be wrong about the
 * world but not about the business.
 *
 * A bar rather than a floating button: the question is part of the work, and a
 * bubble in the corner is something you have to remember exists. It opens
 * upward into the conversation and closes back down to one line.
 */

const PROMPTS = [
  "How many bookings came in today?",
  "Which appliance is booked most?",
  "What is sitting in baskets unbooked?",
  "How did this week compare with last?",
];

type Message = { id: number; role: "user" | "assistant"; text: string };

export function AdminAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [open, setOpen] = useState(false);
  const nextId = useRef(0);
  const thread = useRef<HTMLDivElement>(null);

  // A new answer lands at the bottom of the thread, which is where the eye
  // already is — so the thread follows it rather than the reader chasing it.
  useEffect(() => {
    thread.current?.scrollTo({ top: thread.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const ask = async (question: string) => {
    const value = question.trim();
    if (!value || thinking) return;
    setInput("");
    setOpen(true);

    const asked: Message = { id: nextId.current++, role: "user", text: value };
    const history = [...messages, asked];
    setMessages(history);
    setThinking(true);

    let reply: string;
    try {
      const res = await fetch("/api/admin/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.text })),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; text?: string; error?: string };
      // Each failure says what to do about it: an unconfigured key is the
      // owner's to fix, an expired session is a sign-in, the rest is a retry.
      reply = data.ok && data.text
        ? data.text
        : data.error === "not_configured"
          ? "The assistant isn't switched on yet — GROQ_API_KEY has to be set on the server."
          : data.error === "unauthenticated"
            ? "Your admin session has expired. Sign in again and ask me once more."
            : "I couldn't reach the assistant just now. Try again in a moment.";
    } catch {
      reply = "I couldn't reach the assistant just now. Try again in a moment.";
    }

    setMessages((m) => [...m, { id: nextId.current++, role: "assistant", text: reply }]);
    setThinking(false);
  };

  return (
    // Fixed to the window rather than to the page, so it is in reach at the
    // foot of a long table. It clears the sidebar from lg up, where the
    // sidebar is a column rather than a drawer.
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 lg:left-64">
      <div className="pointer-events-auto mx-auto max-w-3xl px-4 pb-4 sm:px-6">
        <AnimatePresence initial={false}>
          {open && messages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="mb-2 overflow-hidden rounded-2xl border border-border bg-surface shadow-premium-lg"
            >
              <div className="flex items-center justify-between border-b border-hairline px-4 py-2.5">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="size-4 text-primary" /> Panel assistant
                </span>
                <span className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setMessages([])}
                    aria-label="Clear this conversation"
                    className="grid size-8 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
                  >
                    <Trash2 className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Hide the conversation"
                    className="grid size-8 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
                  >
                    <X className="size-4" />
                  </button>
                </span>
              </div>

              <div ref={thread} className="max-h-[22rem] space-y-3 overflow-y-auto px-4 py-4">
                {messages.map((m) => (
                  <p
                    key={m.id}
                    className={cn(
                      "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                      m.role === "user"
                        ? "ml-auto bg-ink text-background"
                        : "bg-surface-2 text-ink",
                    )}
                  >
                    {m.text}
                  </p>
                ))}
                {thinking && (
                  <p className="flex items-center gap-2 text-sm text-muted">
                    <Loader2 className="size-4 animate-spin" /> Reading the panel…
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* The suggestions only stand in for an empty thread. Once there is a
            conversation they are in the way of it.

            One line that scrolls on a phone, where four wrapped chips made the
            dock tall enough to sit on the footer; wrapped from sm up, where
            there is width for two rows and no scrolling to discover. */}
        {messages.length === 0 && (
          <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto sm:flex-wrap sm:overflow-visible">
            {PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => ask(p)}
                className="shrink-0 whitespace-nowrap rounded-full border border-border bg-surface/90 px-3 py-1.5 text-xs text-muted shadow-premium-sm backdrop-blur transition-colors hover:border-border-strong hover:text-ink"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          className="flex items-center gap-2 rounded-full border border-border bg-surface/95 py-2 pl-4 pr-2 shadow-premium-lg backdrop-blur-xl"
        >
          <Sparkles className="size-4 shrink-0 text-primary" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => messages.length > 0 && setOpen(true)}
            placeholder="Ask about your bookings, baskets or activity…"
            aria-label="Ask the panel assistant"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-2"
          />
          <button
            type="submit"
            disabled={!input.trim() || thinking}
            aria-label="Ask"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
          >
            {thinking ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
          </button>
        </form>

        <p className="mt-2 text-center text-[0.7rem] text-muted-2">
          Answers come from this panel&apos;s own figures. No customer names, phone numbers or
          addresses are sent.
        </p>
      </div>
    </div>
  );
}
