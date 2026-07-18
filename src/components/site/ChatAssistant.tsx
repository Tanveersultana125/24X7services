"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Action {
  label: string;
  href: string;
}
interface Message {
  id: number;
  role: "user" | "bot";
  text: string;
  actions?: Action[];
}

const GREETING: Message = {
  id: 0,
  role: "bot",
  text: "Hi, I'm the 24X7 assistant. Tell me what's wrong with your appliance and I'll diagnose it, estimate a price, or book a certified technician for you.",
};

const CHIPS = [
  "My fridge isn't cooling",
  "Repair cost?",
  "Book a service",
  "Track my technician",
];

/** Lightweight rule-based reply engine (front-end demo of the AI assistant). */
function getReply(raw: string): { text: string; actions?: Action[] } {
  const t = raw.toLowerCase();
  const has = (...w: string[]) => w.some((x) => t.includes(x));

  if (has("hi", "hello", "hey", "namaste"))
    return { text: "Hello! How can I help with your appliance today? You can describe a fault, ask for a price, or book a visit." };

  if (has("thank", "thanks", "shukriya"))
    return { text: "You're welcome! Anything else I can help you fix today?" };

  // Fault diagnosis — appliance + symptom aware
  if (has("not cooling", "cooling", "fridge", "refrigerator") && has("cool", "cooling", "cold", "not"))
    return {
      text: "Sounds like a cooling fault — usually a gas leak, thermostat, or compressor issue. Our technicians carry genuine spares. A diagnosis is free and repairs typically run ₹499–₹1,499.",
      actions: [{ label: "Book refrigerator repair", href: "/book?appliance=refrigerator&problem=not-cooling" }],
    };
  if (has("not heating", "microwave", "spark"))
    return {
      text: "For a microwave that won't heat or is sparking, it's often the magnetron or waveguide. Please stop using it for safety. Repairs are usually ₹399–₹1,699.",
      actions: [{ label: "Book microwave repair", href: "/book?appliance=microwave" }],
    };
  if (has("washing", "washer", "drum", "spin"))
    return {
      text: "Washing machine trouble is commonly the motor, drum bearing, or drain pump. Share the symptom (not starting, leaking, noisy?) and I'll narrow it down. Repairs run ₹399–₹3,499.",
      actions: [{ label: "Book washing machine repair", href: "/book?appliance=washing-machine" }],
    };
  if (has("oven", "thermostat", "baking"))
    return {
      text: "Oven issues are usually the heating element, thermostat, or fan. We calibrate and test before leaving. Repairs run ₹499–₹1,899.",
      actions: [{ label: "Book oven repair", href: "/book?appliance=oven" }],
    };
  if (has("leak", "leakage", "water"))
    return {
      text: "Water leaks are typically a worn seal, blocked drain, or loose hose — quick to fix, usually ₹399–₹999. I'd recommend booking a same-day visit.",
      actions: [{ label: "Book a service", href: "/book" }],
    };
  if (has("noise", "sound", "vibrat"))
    return {
      text: "Unusual noise or vibration often points to a loose part, bearing, or fan. It's best inspected early — repairs are usually ₹299–₹799.",
      actions: [{ label: "Book a service", href: "/book" }],
    };

  if (has("price", "cost", "charge", "kitna", "how much", "estimate"))
    return {
      text: "Diagnosis is always free. Typical ranges: Refrigerator ₹499–₹1,499 · Washing Machine ₹399–₹3,499 · Microwave ₹399–₹1,699 · Oven ₹499–₹1,899. You'll see an exact estimate before you confirm.",
      actions: [{ label: "Get my estimate", href: "/book" }],
    };

  if (has("book", "booking", "appointment", "schedule", "slot", "same day"))
    return {
      text: "I can set that up in under a minute — pick your brand, appliance, a time slot, and you're done. Same-day slots are available if you book by 2 PM.",
      actions: [{ label: "Start booking", href: "/book" }],
    };

  if (has("emergency", "urgent", "asap", "now"))
    return {
      text: "For emergencies we dispatch a certified specialist with priority — averaging under 90 minutes. A small express fee applies.",
      actions: [{ label: "Request emergency repair", href: "/book?emergency=1" }],
    };

  if (has("track", "where", "eta", "arriv", "technician"))
    return {
      text: "You can watch your technician live on the map with a real-time ETA, and call or chat with them directly.",
      actions: [{ label: "Open live tracking", href: "/track" }],
    };

  if (has("warranty", "guarantee"))
    return { text: "Every repair is covered by a 90-day warranty on parts and labour. If the same issue recurs, we fix it free — no questions asked." };

  if (has("amc", "plan", "maintenance", "annual", "subscription"))
    return {
      text: "Our AMC plans start at ₹1,499/year and include preventive visits, priority dispatch and genuine parts. The Premium plan usually pays for itself in one visit.",
      actions: [{ label: "View AMC plans", href: "/plans" }],
    };

  if (has("brand", "samsung", "lg", "ifb", "bosch"))
    return {
      text: "We're authorised for Samsung, LG, IFB and Bosch — brand-certified technicians and genuine spare parts for each.",
      actions: [{ label: "See brands", href: "/brands" }],
    };

  if (has("login", "account", "dashboard", "invoice"))
    return {
      text: "You can log in to view bookings, invoices, warranties and your AMC plan anytime.",
      actions: [{ label: "Log in", href: "/login" }],
    };

  return {
    text: "I can help with fault diagnosis, price estimates, booking, live tracking, warranty and AMC plans. Try describing the problem — for example, \"my washing machine won't spin\".",
    actions: [{ label: "Book a service", href: "/book" }],
  };
}

export function ChatAssistant() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const idRef = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing, open]);

  // The assistant is a customer-facing widget — never show it in the admin panel.
  const hidden = pathname?.startsWith("/admin") ?? false;

  const send = (text: string) => {
    const value = text.trim();
    if (!value || typing) return;
    setInput("");
    setMessages((m) => [...m, { id: idRef.current++, role: "user", text: value }]);
    setTyping(true);
    setTimeout(() => {
      const reply = getReply(value);
      setTyping(false);
      setMessages((m) => [...m, { id: idRef.current++, role: "bot", ...reply }]);
    }, 700 + Math.min(value.length * 12, 700));
  };

  if (hidden) return null;

  return (
    <>
      {/* Launcher */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open AI assistant"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 200, damping: 16 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-5 right-5 z-[70] grid size-14 place-items-center rounded-full bg-gradient-to-br from-royal-bright to-royal text-white shadow-royal sm:bottom-6 sm:right-6"
      >
        <span className="absolute inset-0 animate-pulse-ring rounded-full ring-2 ring-royal-bright/50" />
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? "close" : "open"}
            initial={{ rotate: -40, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 40, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {open ? <X className="size-6" /> : <Sparkles className="size-6" />}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-24 right-4 z-[70] flex h-[32rem] max-h-[calc(100dvh-8rem)] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[1.75rem] border border-border bg-surface shadow-premium-xl sm:right-6 sm:w-[24rem]"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-hairline bg-gradient-to-r from-royal to-royal-bright px-4 py-3.5 text-white">
              <div className="relative grid size-10 place-items-center rounded-xl bg-white/15 backdrop-blur">
                <Sparkles className="size-5" />
                <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-emerald-bright ring-2 ring-royal" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold leading-tight">24X7 Assistant</p>
                <p className="text-[0.7rem] text-white/70">AI-powered · online now</p>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close" className="grid size-8 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/15">
                <X className="size-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-background/40 px-4 py-4">
              {messages.map((m) => (
                <Bubble key={m.id} m={m} onAction={() => setOpen(false)} />
              ))}
              {typing && <Typing />}
            </div>

            {/* Quick chips */}
            {messages.length <= 1 && (
              <div className="flex flex-wrap gap-2 border-t border-hairline px-4 py-3">
                {CHIPS.map((c) => (
                  <button
                    key={c}
                    onClick={() => send(c)}
                    className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-royal-bright/50 hover:text-royal-bright"
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="flex items-center gap-2 border-t border-hairline bg-surface px-3 py-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything…"
                style={{ outline: "none" }}
                className="min-w-0 flex-1 rounded-full bg-surface-2 px-4 py-2.5 text-sm outline-none placeholder:text-muted-2"
              />
              <button
                type="submit"
                disabled={!input.trim() || typing}
                aria-label="Send"
                className="grid size-10 shrink-0 place-items-center rounded-full bg-royal-bright text-white transition-transform enabled:hover:scale-105 disabled:opacity-40"
              >
                <Send className="size-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Bubble({ m, onAction }: { m: Message; onAction: () => void }) {
  const isUser = m.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("flex", isUser ? "justify-end" : "justify-start")}
    >
      <div className={cn("max-w-[85%]", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
            isUser
              ? "rounded-br-md bg-royal-bright text-white"
              : "rounded-bl-md border border-border bg-surface text-ink"
          )}
        >
          {m.text}
        </div>
        {m.actions && m.actions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {m.actions.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                onClick={onAction}
                className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 text-xs font-medium text-background transition-transform hover:scale-[1.02]"
              >
                {a.label} <ArrowUpRight className="size-3.5" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function Typing() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-border bg-surface px-4 py-3.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-1.5 rounded-full bg-muted-2"
            animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}
