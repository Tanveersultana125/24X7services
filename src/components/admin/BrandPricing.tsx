"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { brandsFor, type CatalogueService } from "@/lib/catalogue-shared";
import type { Brand, BrandId } from "@/lib/types";
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
  onRemove,
  onSave,
}: {
  service: CatalogueService;
  brandId: BrandId;
  busy: boolean;
  saved: boolean;
  onPrice: (value: number | null) => void;
  onRemove: () => void;
  onSave: () => void;
}) {
  const own = s.brandPrices?.[brandId];
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-premium-sm">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{s.name}</p>
        <p className="mt-0.5 truncate text-xs text-muted">
          {s.problems.length} problems · {s.serviceTime}
          {!s.active && " · hidden from the site"}
        </p>
      </div>

      <label className="flex shrink-0 items-center gap-2">
        <span className="text-xs text-muted">Starts at ₹</span>
        <input
          type="number"
          value={own ?? ""}
          placeholder={String(s.startingPrice)}
          onChange={(e) => {
            const n = Number(e.target.value);
            onPrice(e.target.value === "" || !Number.isFinite(n) || n <= 0 ? null : Math.round(n));
          }}
          aria-label={`${s.name} price for this brand`}
          className="w-24 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-sm outline-none focus:border-royal-bright"
        />
      </label>

      <button
        onClick={onSave}
        disabled={busy}
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-ink px-3.5 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50",
        )}
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
  );
}
