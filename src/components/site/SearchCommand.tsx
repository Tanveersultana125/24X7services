"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, X, Zap, Siren, Navigation,
  LayoutDashboard, LogIn, Wrench, Sparkles, FileText,
} from "lucide-react";
import { SERVICES } from "@/lib/services";
import { BRANDS } from "@/lib/data";
import { cn } from "@/lib/utils";

interface Item {
  group: string;
  label: string;
  hint?: string;
  href: string;
  icon: React.ElementType;
  keywords?: string;
}

const ACTIONS: Item[] = [
  { group: "Actions", label: "Book a service", hint: "Start a new booking", href: "/book", icon: Zap, keywords: "new order repair" },
  { group: "Actions", label: "Emergency repair", hint: "Priority dispatch", href: "/book?emergency=1", icon: Siren, keywords: "urgent 24x7 fast" },
  { group: "Actions", label: "Track technician", hint: "Live location & ETA", href: "/track", icon: Navigation, keywords: "map location status" },
  { group: "Actions", label: "My dashboard", hint: "Bookings & invoices", href: "/dashboard", icon: LayoutDashboard, keywords: "account history warranty" },
  { group: "Actions", label: "Log in", hint: "Access your account", href: "/login", icon: LogIn, keywords: "sign in google otp" },
];

const PAGES: Item[] = [
  { group: "Pages", label: "Services", href: "/services", icon: FileText },
  { group: "Pages", label: "Brands", href: "/brands", icon: FileText },
  { group: "Pages", label: "Process", href: "/process", icon: FileText },
  { group: "Pages", label: "Plans", href: "/plans", icon: FileText },
  { group: "Pages", label: "Reviews", href: "/reviews", icon: FileText },
];

const SERVICE_ITEMS: Item[] = SERVICES.map((s) => ({
  group: "Services",
  label: s.title,
  hint: s.price,
  href: s.appliance ? `/book?appliance=${s.appliance}` : "/book",
  icon: s.kind === "repair" ? Wrench : Sparkles,
  keywords: s.tags.join(" "),
}));

const BRAND_ITEMS: Item[] = BRANDS.map((b) => ({
  group: "Brands",
  label: `${b.name} service`,
  hint: b.tagline,
  href: `/book?brand=${b.id}`,
  icon: Sparkles,
  keywords: b.name,
}));

const ALL = [...ACTIONS, ...SERVICE_ITEMS, ...BRAND_ITEMS, ...PAGES];
const GROUP_ORDER = ["Actions", "Services", "Brands", "Pages"];

export function SearchTrigger({ variant = "pill" }: { variant?: "pill" | "icon" }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {variant === "pill" ? (
        <button
          onClick={() => setOpen(true)}
          className="group hidden items-center gap-2 rounded-full border border-border-strong/60 bg-surface/50 px-4 py-2 text-sm text-muted transition-colors hover:border-ink/30 hover:text-ink xl:inline-flex"
          aria-label="Search"
        >
          <Search className="size-4" />
          <span className="pr-2">Search services…</span>
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          aria-label="Search"
          className="grid size-10 place-items-center rounded-full glass text-ink xl:hidden"
        >
          <Search className="size-4" />
        </button>
      )}
      <SearchModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL;
    return ALL.filter((i) =>
      `${i.label} ${i.hint ?? ""} ${i.keywords ?? ""} ${i.group}`.toLowerCase().includes(q)
    );
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<string, Item[]>();
    for (const g of GROUP_ORDER) map.set(g, []);
    results.forEach((i) => map.get(i.group)?.push(i));
    return [...map.entries()].filter(([, items]) => items.length);
  }, [results]);

  // reset on the way out rather than in an open effect, so no setState during render
  const close = () => {
    setQuery("");
    setActive(0);
    onClose();
  };

  // the arrow keys move `active` past the fold, so pull the row into view
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const go = (href: string) => {
    close();
    router.push(href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (results[active]) go(results[active].href); }
    else if (e.key === "Escape") { close(); }
  };

  let flatIndex = -1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[12vh]"
          onKeyDown={onKeyDown}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={close} />

          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[38rem] overflow-hidden rounded-[1.75rem] border border-border bg-surface shadow-premium-xl ring-1 ring-black/5"
          >
            <div className="flex items-center gap-3 px-5">
              <Search className="size-5 shrink-0 text-muted" />
              <input
                ref={inputRef}
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                placeholder="Search services, brands, actions…"
                style={{ outline: "none", boxShadow: "none" }}
                className="w-full bg-transparent py-[1.15rem] text-[0.95rem] outline-none focus:outline-none focus-visible:outline-none placeholder:text-muted-2"
              />
              <button
                type="button"
                onClick={close}
                aria-label="Close search"
                className="grid size-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="h-px bg-hairline" />

            {/* Lenis owns the wheel — let this list keep its own scrolling */}
            <div ref={listRef} data-lenis-prevent className="max-h-[54vh] overflow-y-auto p-2.5">
              {grouped.length === 0 ? (
                <p className="px-4 py-16 text-center text-sm text-muted">
                  No matches for &ldquo;<span className="font-medium text-ink">{query}</span>&rdquo;
                </p>
              ) : (
                grouped.map(([group, items]) => (
                  <div key={group} className="mb-1.5 last:mb-0">
                    <p className="px-3 pb-1.5 pt-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-muted-2">
                      {group}
                    </p>
                    {items.map((it) => {
                      flatIndex += 1;
                      const idx = flatIndex;
                      const isActive = idx === active;
                      return (
                        <button
                          key={it.href + it.label}
                          data-idx={idx}
                          onMouseEnter={() => setActive(idx)}
                          onClick={() => go(it.href)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-2xl px-2.5 py-2 text-left transition-colors duration-150",
                            isActive ? "bg-surface-2" : "hover:bg-surface-2/50"
                          )}
                        >
                          <span className={cn(
                            "grid size-9 shrink-0 place-items-center rounded-xl transition-colors duration-150",
                            isActive ? "bg-royal-bright text-white shadow-[0_4px_12px_-4px_rgba(37,71,208,0.6)]" : "bg-surface-2 text-muted"
                          )}>
                            <it.icon className="size-[18px]" strokeWidth={1.8} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{it.label}</span>
                            {it.hint && <span className="block truncate text-xs text-muted">{it.hint}</span>}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
