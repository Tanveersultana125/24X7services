"use client";

import { useState } from "react";
import { Check, ChevronDown, Loader2, Plus, X } from "lucide-react";
import {
  bandFor,
  brandsFor,
  slugify,
  type CatalogueService,
  type ServiceProblem,
} from "@/lib/catalogue-shared";
import type { Brand, BrandId } from "@/lib/types";
import { NumberField } from "./NumberField";
import { cn } from "@/lib/utils";

/**
 * One manufacturer's page: everything we service for them, and what each
 * costs on their appliances.
 *
 * The all-services page is where a service is built. This is where a
 * manufacturer's prices are set side by side, which is how they are actually
 * decided — you compare Samsung against Samsung, not a fridge against a
 * washing machine.
 */
export function BrandPricing({ brand, services }: { brand: Brand; services: CatalogueService[] }) {
  const [rows, setRows] = useState(services);
  const [busy, setBusy] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const covered = rows.filter((s) => brandsFor(s).includes(brand.id));
  const notCovered = rows.filter((s) => !brandsFor(s).includes(brand.id));

  const patch = (id: string, fields: Partial<CatalogueService>) =>
    setRows((prev) => prev.map((s) => (s.id === id ? { ...s, ...fields } : s)));

  const save = async (s: CatalogueService) => {
    setBusy(s.id);
    setError(null);
    try {
      const res = await fetch("/api/admin/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: s.id,
          brands: brandsFor(s),
          brandPrices: s.brandPrices ?? {},
          brandProblemPrices: s.brandProblemPrices ?? {},
          brandProblems: s.brandProblems ?? {},
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(
          res.status === 401
            ? "Your admin session expired — sign in again at /admin/login."
            : data?.detail
              ? `That didn't save. ${data.detail}`
              : "That didn't save. Please try again.",
        );
        return;
      }
      setSaved(s.id);
      window.setTimeout(() => setSaved((cur) => (cur === s.id ? null : cur)), 1800);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  };

  const setCovered = (s: CatalogueService, on: boolean) =>
    patch(s.id, {
      brands: on ? [...brandsFor(s), brand.id] : brandsFor(s).filter((id) => id !== brand.id),
    });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3 sm:mb-8">
        <span
          className="grid size-11 shrink-0 place-items-center rounded-xl text-sm font-bold text-white"
          style={{ background: brand.accent }}
        >
          {brand.name.slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-2xl tracking-[-0.02em] sm:text-3xl">{brand.name}</h1>
          <p className="mt-0.5 text-sm text-muted">{brand.tagline}</p>
        </div>
      </div>

      {error && <p className="mb-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}

      <p className="mb-4 text-sm text-muted">
        What we service for {brand.name}, and what it starts at. A price left empty charges the
        service&apos;s own — so only fill in what actually differs for this make.
      </p>

      <div className="space-y-3">
        {covered.map((s) => (
          <Row
            key={s.id}
            service={s}
            brandId={brand.id}
            busy={busy === s.id}
            saved={saved === s.id}
            onPrice={(value) => {
              const next = { ...(s.brandPrices ?? {}) };
              if (value === null) delete next[brand.id];
              else next[brand.id] = value;
              patch(s.id, { brandPrices: next });
            }}
            onBand={(problemId, band) => {
              const all = { ...(s.brandProblemPrices ?? {}) };
              const mine = { ...(all[brand.id] ?? {}) };
              if (band === null) delete mine[problemId];
              else mine[problemId] = band;
              all[brand.id] = mine;
              patch(s.id, { brandProblemPrices: all });
            }}
            onOwn={(list) => {
              const all = { ...(s.brandProblems ?? {}) };
              all[brand.id] = list;
              patch(s.id, { brandProblems: all });
            }}
            onRemove={() => setCovered(s, false)}
            onSave={() => save(s)}
          />
        ))}
      </div>

      {notCovered.length > 0 && (
        <div className="mt-8 border-t border-border pt-6">
          <p className="text-sm font-medium">Not serviced for {brand.name}</p>
          <p className="mt-1 text-xs text-muted">
            These are off {brand.name}&apos;s booking list. Add one back and it starts at the
            service&apos;s own price until you set one here.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {notCovered.map((s) => (
              <button
                key={s.id}
                onClick={async () => {
                  setCovered(s, true);
                  await save({ ...s, brands: [...brandsFor(s), brand.id] });
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted hover:text-ink"
              >
                + {s.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  service: s,
  brandId,
  busy,
  saved,
  onPrice,
  onBand,
  onOwn,
  onRemove,
  onSave,
}: {
  service: CatalogueService;
  brandId: BrandId;
  busy: boolean;
  saved: boolean;
  onPrice: (value: number | null) => void;
  onBand: (problemId: string, band: [number, number] | null) => void;
  onOwn: (list: ServiceProblem[]) => void;
  onRemove: () => void;
  onSave: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ownPrice = s.brandPrices?.[brandId];
  const priced = Object.keys(s.brandProblemPrices?.[brandId] ?? {}).length;
  const own = s.brandProblems?.[brandId] ?? [];

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-premium-sm">
      <div className="flex flex-wrap items-center gap-3 p-4">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="min-w-0 flex-1 text-left"
        >
          <p className="flex items-center gap-1.5 truncate font-medium">
            <ChevronDown className={cn("size-4 shrink-0 text-muted transition-transform", open && "rotate-180")} />
            {s.name}
          </p>
          <p className="mt-0.5 truncate pl-5 text-xs text-muted">
            {s.problems.length + own.length} repairs · {s.serviceTime}
            {priced > 0 && ` · ${priced} priced for this make`}
            {!s.active && " · hidden from the site"}
          </p>
        </button>

        <label className="flex shrink-0 items-center gap-2">
          <span className="text-xs text-muted">Starts at ₹</span>
          <input
            type="number"
            value={ownPrice ?? ""}
            placeholder={String(s.startingPrice)}
            onChange={(e) => {
              const n = Number(e.target.value);
              onPrice(e.target.value === "" || !Number.isFinite(n) || n <= 0 ? null : Math.round(n));
            }}
            aria-label={`${s.name} starting price for this brand`}
            className="w-24 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-sm outline-none focus:border-royal-bright"
          />
        </label>

        <button
          onClick={onSave}
          disabled={busy}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-ink px-3.5 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          {saved ? "Saved" : "Save"}
        </button>

        <button
          onClick={onRemove}
          className="shrink-0 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted hover:text-ink"
        >
          Not serviced
        </button>
      </div>

      {/* Every repair this product can be booked for, priced for this make.
          A part for one manufacturer says nothing about another. */}
      {open && (
        <div className="border-t border-border px-4 py-3">
          {s.problems.length === 0 && own.length === 0 ? (
            <p className="py-3 text-center text-xs text-muted">
              No repairs listed — add them on the All services page, or add one just for this make
              below.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-[1fr_5.5rem_5.5rem] items-end gap-2 pb-2">
                <span className="text-[0.62rem] font-medium uppercase tracking-[0.08em] text-muted-2">Repair</span>
                <span className="text-[0.62rem] font-medium uppercase tracking-[0.08em] text-muted-2">From ₹</span>
                <span className="text-[0.62rem] font-medium uppercase tracking-[0.08em] text-muted-2">Up to ₹</span>
              </div>
              <div className="space-y-1.5">
                {s.problems.map((p) => (
                  <RepairRow
                    key={p.id}
                    problem={p}
                    service={s}
                    brandId={brandId}
                    onBand={(band) => onBand(p.id, band)}
                  />
                ))}
              </div>

              {/* A repair this make has and the others don't — an inverter
                  board on one manufacturer's fridge isn't something every
                  fridge can be booked for. */}
              {own.length > 0 && (
                <div className="mt-3 space-y-1.5 border-t border-border pt-3">
                  {own.map((p, i) => (
                    <OwnRepairRow
                      key={i}
                      problem={p}
                      onChange={(fields) =>
                        onOwn(own.map((row, n) => (n === i ? { ...row, ...fields } : row)))
                      }
                      onRemove={() => onOwn(own.filter((_, n) => n !== i))}
                    />
                  ))}
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[0.68rem] text-muted-2">
                  Left empty, a repair is charged at the band on the All services page.
                </p>
                <button
                  onClick={() =>
                    onOwn([
                      ...own,
                      { id: `custom-${own.length + 1}`, label: "", price: [499, 1499], eta: "60 min" },
                    ])
                  }
                  className="inline-flex items-center gap-1 text-xs font-medium text-royal-bright hover:underline"
                >
                  <Plus className="size-3.5" /> Custom repair
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function RepairRow({
  problem: p,
  service: s,
  brandId,
  onBand,
}: {
  problem: ServiceProblem;
  service: CatalogueService;
  brandId: BrandId;
  onBand: (band: [number, number] | null) => void;
}) {
  const own = s.brandProblemPrices?.[brandId]?.[p.id];
  const shown = bandFor(s, p, brandId);

  const set = (i: 0 | 1, raw: string) => {
    const n = Number(raw);
    if (raw === "" && i === 0) return onBand(null);
    const next: [number, number] = [shown[0], shown[1]];
    next[i] = Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
    if (next[0] <= 0) return onBand(null);
    onBand([next[0], Math.max(next[0], next[1])]);
  };

  return (
    <div className="grid grid-cols-[1fr_5.5rem_5.5rem] items-center gap-2">
      <span className="truncate text-xs">
        {p.label}
        {own && <span className="ml-1.5 text-[0.62rem] font-medium text-royal-bright">set</span>}
      </span>
      <input
        type="number"
        value={own?.[0] ?? ""}
        placeholder={String(p.price[0])}
        onChange={(e) => set(0, e.target.value)}
        aria-label={`${p.label} lowest price`}
        className="w-full rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-xs outline-none focus:border-royal-bright"
      />
      <input
        type="number"
        value={own?.[1] ?? ""}
        placeholder={String(p.price[1])}
        onChange={(e) => set(1, e.target.value)}
        aria-label={`${p.label} highest price`}
        className="w-full rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-xs outline-none focus:border-royal-bright"
      />
    </div>
  );
}

/**
 * A repair that belongs to this make alone — so unlike the shared ones, its
 * name and time are edited here too, not on the All services page.
 */
function OwnRepairRow({
  problem: p,
  onChange,
  onRemove,
}: {
  problem: ServiceProblem;
  onChange: (fields: Partial<ServiceProblem>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_5.5rem_5.5rem_auto] items-center gap-2">
      <input
        value={p.label}
        onChange={(e) => onChange({ label: e.target.value, id: slugify(e.target.value) || p.id })}
        placeholder="Inverter board"
        aria-label="Repair"
        className="w-full rounded-lg border border-royal-bright/40 bg-surface px-2 py-1.5 text-xs outline-none focus:border-royal-bright"
      />
      <NumberField
        value={p.price[0]}
        onValue={(low) => onChange({ price: [low, p.price[1]] })}
        min="0"
        aria-label={`${p.label || "Repair"} lowest price`}
        className="w-full rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-xs outline-none focus:border-royal-bright"
      />
      <NumberField
        value={p.price[1]}
        onValue={(high) => onChange({ price: [p.price[0], high] })}
        min="0"
        aria-label={`${p.label || "Repair"} highest price`}
        className="w-full rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-xs outline-none focus:border-royal-bright"
      />
      <button
        onClick={onRemove}
        aria-label={`Remove ${p.label || "repair"}`}
        className="rounded-lg p-1.5 text-danger hover:bg-danger/10"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
