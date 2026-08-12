"use client";

import { useState } from "react";
import { Check, Loader2, Plus, RotateCcw, Trash2, X } from "lucide-react";
import {
  blankProblem,
  brandsFor,
  tierSaving,
  type CatalogueService,
  type ServiceProblem,
  type ServiceTier,
} from "@/lib/catalogue-shared";
import Link from "next/link";
import { BRANDS } from "@/lib/data";
import { NumberField } from "./NumberField";
import { ConfirmDialog } from "./ConfirmDialog";
import { cn } from "@/lib/utils";

/**
 * The service catalogue.
 *
 * Everything a service is, is here: its words, its price and timing, and the
 * faults a customer picks from when booking it. Built-in services can be
 * changed and hidden but not deleted — Reset puts one back to what the code
 * says. Services added here can be deleted outright.
 */
export function ServicesManager({ initial }: { initial: CatalogueService[] }) {
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  const patch = (id: string, fields: Partial<CatalogueService>) =>
    setRows((prev) => prev.map((s) => (s.id === id ? { ...s, ...fields } : s)));

  const send = async (method: "POST" | "PATCH" | "DELETE", body: unknown) => {
    const res = await fetch("/api/admin/services", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      if (res.status === 401) setError("Your admin session expired — sign in again at /admin/login.");
      else if (data?.error === "already_exists") setError("A service with that name already exists.");
      else setError(data?.detail ? `That didn't save. ${data.detail}` : "That didn't save. Please try again.");
      return null;
    }
    return data ?? {};
  };

  const save = async (s: CatalogueService) => {
    setBusy(s.id);
    setError(null);
    const ok = await send("PATCH", {
      id: s.id,
      name: s.name,
      blurb: s.blurb,
      startingPrice: s.startingPrice,
      serviceTime: s.serviceTime,
      rating: s.rating,
      bookings: s.bookings,
      active: s.active,
      brands: brandsFor(s),
      problems: s.problems,
      tiers: s.tiers ?? [],
      headline: s.headline ?? "",
      highlights: s.highlights ?? [],
    });
    setBusy(null);
    if (!ok) return;
    setSaved(s.id);
    window.setTimeout(() => setSaved((cur) => (cur === s.id ? null : cur)), 1800);
  };

  const remove = async (s: CatalogueService) => {
    setBusy(s.id);
    setError(null);
    const ok = await send("DELETE", { id: s.id });
    setBusy(null);
    if (!ok) return;
    // A built-in comes back as the code has it; an added one goes for good.
    if (s.custom) setRows((prev) => prev.filter((r) => r.id !== s.id));
    else window.location.reload();
  };

  const add = async () => {
    const name = newName.trim();
    if (!name) return;
    setBusy("new");
    setError(null);
    const res = await send("POST", { name, problems: [blankProblem()] });
    setBusy(null);
    if (!res?.id) return;
    setRows((prev) => [
      ...prev,
      {
        id: res.id as string,
        name,
        blurb: "",
        startingPrice: 0,
        serviceTime: "45–90 min",
        rating: 4.8,
        bookings: "New",
        problems: [blankProblem()],
        brands: BRANDS.map((b) => b.id),
        active: true,
        custom: true,
        createdAt: Date.now(),
      },
    ]);
    setNewName("");
    setAdding(false);
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-2xl tracking-[-0.02em] sm:text-3xl">Services &amp; prices</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            What the site offers, how long each takes, and the faults a customer picks from when
            booking. What each brand is charged lives on that brand&apos;s page. Saving publishes
            straight away.
          </p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-background hover:opacity-90 sm:py-2"
        >
          <Plus className="size-4" /> Add a service
        </button>
      </div>

      {error && <p className="mb-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}

      {adding && (
        <div className="mb-5 rounded-2xl border border-border bg-surface p-4 shadow-premium-sm sm:p-5">
          <p className="text-sm font-medium">What do you service?</p>
          <p className="mt-1 text-xs text-muted">
            A fan, a chimney, a water purifier — its name is what customers will see.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              value={newName}
              autoFocus
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="Ceiling Fan"
              className="min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-royal-bright"
            />
            <button
              onClick={add}
              disabled={!newName.trim() || busy === "new"}
              className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
            >
              {busy === "new" && <Loader2 className="size-4 animate-spin" />} Add
            </button>
            <button
              onClick={() => {
                setAdding(false);
                setNewName("");
              }}
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        {rows.map((s) => (
          <ServiceCard
            key={s.id}
            service={s}
            busy={busy === s.id}
            saved={saved === s.id}
            onChange={(fields) => patch(s.id, fields)}
            onSave={() => save(s)}
            onRemove={() => remove(s)}
          />
        ))}
      </div>
    </div>
  );
}

function ServiceCard({
  service: s,
  busy,
  saved,
  onChange,
  onSave,
  onRemove,
}: {
  service: CatalogueService;
  busy: boolean;
  saved: boolean;
  onChange: (fields: Partial<CatalogueService>) => void;
  onSave: () => void;
  onRemove: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  const setProblem = (i: number, fields: Partial<ServiceProblem>) =>
    onChange({ problems: s.problems.map((p, n) => (n === i ? { ...p, ...fields } : p)) });

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-premium-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="text-xs font-medium text-muted">Service name</span>
          <input
            value={s.name}
            onChange={(e) => onChange({ name: e.target.value })}
            aria-label="Service name"
            className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-medium outline-none focus:border-royal-bright"
          />
        </div>
        <label className="mt-6 flex shrink-0 cursor-pointer items-center gap-2 text-xs font-medium text-muted">
          <input
            type="checkbox"
            checked={s.active}
            onChange={(e) => onChange({ active: e.target.checked })}
            className="size-4 accent-emerald"
          />
          <span className={s.active ? "text-emerald" : undefined}>{s.active ? "Live" : "Hidden"}</span>
        </label>
      </div>

      <Field label="One-line description">
        <input
          value={s.blurb}
          onChange={(e) => onChange({ blurb: e.target.value })}
          placeholder="Cooling, gas, compressor & installation by certified pros."
          className={input}
        />
      </Field>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Field label="Starting price (₹)">
          <NumberField
            value={s.startingPrice}
            onValue={(startingPrice) => onChange({ startingPrice })}
            min="0"
            className={input}
          />
        </Field>
        <Field label="Service time">
          <input value={s.serviceTime} onChange={(e) => onChange({ serviceTime: e.target.value })} className={input} />
        </Field>
        <Field label="Rating">
          <NumberField
            value={s.rating}
            onValue={(rating) => onChange({ rating })}
            step="0.1"
            min="0"
            max="5"
            className={input}
          />
        </Field>
        <Field label="Bookings label">
          <input value={s.bookings} onChange={(e) => onChange({ bookings: e.target.value })} className={input} />
        </Field>
      </div>

      {/* Which of the four we are authorised for cover this appliance. What
          each of them is charged is set on that brand's own page — one job
          per page, rather than the same four boxes in two places. */}
      <div className="mt-4">
        <span className="text-xs font-medium text-muted">Brands we service this for</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {BRANDS.map((b) => {
            const on = brandsFor(s).includes(b.id);
            return (
              <button
                key={b.id}
                onClick={() =>
                  onChange({
                    brands: on ? brandsFor(s).filter((id) => id !== b.id) : [...brandsFor(s), b.id],
                  })
                }
                aria-pressed={on}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  on ? "border-transparent text-white" : "border-border text-muted hover:text-ink",
                )}
                style={on ? { background: b.accent } : undefined}
              >
                {on && <Check className="size-3" />}
                {b.name}
              </button>
            );
          })}
        </div>
        {brandsFor(s).length === 0 ? (
          <p className="mt-2 text-xs text-danger">
            Pick at least one — a service with no brands can&apos;t be booked.
          </p>
        ) : (
          <p className="mt-2 text-[0.68rem] text-muted-2">
            What each brand pays is set on its own page —{" "}
            {BRANDS.filter((b) => brandsFor(s).includes(b.id)).map((b, i, list) => (
              <span key={b.id}>
                <Link href={`/admin/services/${b.id}`} className="font-medium text-royal-bright hover:underline">
                  {b.name}
                </Link>
                {i < list.length - 1 ? ", " : "."}
              </span>
            ))}
          </p>
        )}
      </div>

      {/* The faults a customer picks from, with what each is quoted at. */}
      <div className="mt-5 border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted">Problems customers can book ({s.problems.length})</p>
          <button
            onClick={() => onChange({ problems: [...s.problems, { ...blankProblem(), id: `problem-${s.problems.length + 1}`, label: "" }] })}
            className="inline-flex items-center gap-1 text-xs font-medium text-royal-bright hover:underline"
          >
            <Plus className="size-3.5" /> Add
          </button>
        </div>

        {s.problems.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-border-strong px-3 py-4 text-center text-xs text-muted">
            None yet — a service with no problems can&apos;t be booked.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {s.problems.map((p, i) => (
              <div key={i} className="rounded-xl border border-border bg-surface-2/50 p-2.5">
                <div className="flex items-center gap-2">
                  <input
                    value={p.label}
                    onChange={(e) => setProblem(i, { label: e.target.value })}
                    placeholder="Not cooling"
                    aria-label="Problem"
                    className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs outline-none focus:border-royal-bright"
                  />
                  <button
                    onClick={() => onChange({ problems: s.problems.filter((_, n) => n !== i) })}
                    aria-label={`Remove ${p.label || "problem"}`}
                    className="shrink-0 rounded-lg p-1.5 text-danger hover:bg-danger/10"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
                {/* Three bare boxes in a row said nothing about which was
                    which — the quote's floor, its ceiling, and how long. */}
                <div className="mt-2 grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2">
                  <Small label="From ₹">
                    <NumberField
                      value={p.price[0]}
                      onValue={(low) => setProblem(i, { price: [low, p.price[1]] })}
                      min="0"
                      className={smallInput}
                    />
                  </Small>
                  <Small label="Up to ₹">
                    <NumberField
                      value={p.price[1]}
                      onValue={(high) => setProblem(i, { price: [p.price[0], high] })}
                      min="0"
                      className={smallInput}
                    />
                  </Small>
                  <Small label="Takes">
                    <input
                      value={p.eta}
                      onChange={(e) => setProblem(i, { eta: e.target.value })}
                      placeholder="60 min"
                      className={smallInput}
                    />
                  </Small>
                  {/* "Common" is what puts a fault at the top of the booking
                      list, so it is worth saying rather than initialling. */}
                  <label
                    title="Show this fault first when booking"
                    className="mb-1.5 flex shrink-0 cursor-pointer items-center gap-1.5 text-[0.68rem] font-medium text-muted"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(p.common)}
                      onChange={(e) => setProblem(i, { common: e.target.checked })}
                      className="size-3.5 accent-royal-bright"
                    />
                    Show first
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* What the detail sheet shows: the bundle prices and the ticked list. */}
      <div className="mt-5 border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted">Quantity offers ({(s.tiers ?? []).length})</p>
          <button
            onClick={() => {
              const next = [...(s.tiers ?? [])];
              const qty = next.length + 1;
              next.push({ qty, price: s.startingPrice * qty, was: s.startingPrice * qty });
              onChange({ tiers: next });
            }}
            className="inline-flex items-center gap-1 text-xs font-medium text-royal-bright hover:underline"
          >
            <Plus className="size-3.5" /> Add
          </button>
        </div>

        {(s.tiers ?? []).length > 0 && (
          <>
            <div className="mt-3 grid grid-cols-[3.5rem_1fr_1fr_1fr_auto] items-end gap-2">
              {["Units", "Price ₹", "Was ₹", "Badge"].map((h) => (
                <span key={h} className="text-[0.62rem] font-medium uppercase tracking-[0.08em] text-muted-2">
                  {h}
                </span>
              ))}
              <span />
            </div>
            <div className="mt-1.5 space-y-1.5">
              {(s.tiers ?? []).map((t, i) => (
                <TierRow
                  key={i}
                  tier={t}
                  onChange={(fields) =>
                    onChange({ tiers: (s.tiers ?? []).map((row, n) => (n === i ? { ...row, ...fields } : row)) })
                  }
                  onRemove={() => onChange({ tiers: (s.tiers ?? []).filter((_, n) => n !== i) })}
                />
              ))}
            </div>
            <p className="mt-2 text-[0.68rem] text-muted-2">
              &ldquo;Was&rdquo; is what the units would cost separately — the discount is worked out from it.
            </p>
          </>
        )}

        <Field label="Highlights headline">
          <input
            value={s.headline ?? ""}
            onChange={(e) => onChange({ headline: e.target.value })}
            placeholder="Highly rated by customers for better cooling"
            className={input}
          />
        </Field>

        <div className="mt-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Highlights</span>
            <button
              onClick={() => onChange({ highlights: [...(s.highlights ?? []), ""] })}
              className="inline-flex items-center gap-1 text-xs font-medium text-royal-bright hover:underline"
            >
              <Plus className="size-3.5" /> Add
            </button>
          </div>
          <div className="mt-1.5 space-y-1.5">
            {(s.highlights ?? []).map((h, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={h}
                  onChange={(e) =>
                    onChange({ highlights: (s.highlights ?? []).map((row, n) => (n === i ? e.target.value : row)) })
                  }
                  placeholder="Applicable for both split & window ACs"
                  className={smallInput}
                />
                <button
                  onClick={() => onChange({ highlights: (s.highlights ?? []).filter((_, n) => n !== i) })}
                  aria-label="Remove highlight"
                  className="shrink-0 rounded-lg p-1.5 text-danger hover:bg-danger/10"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={onSave}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          {saved ? "Saved" : "Save"}
        </button>

        <button
            onClick={() => setConfirming(true)}
            disabled={busy}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-medium",
              s.custom ? "text-danger hover:bg-danger/10" : "text-muted hover:text-ink",
            )}
          >
            {s.custom ? <Trash2 className="size-4" /> : <RotateCcw className="size-4" />}
            {s.custom ? "Delete" : "Reset"}
        </button>

        {!s.custom && (
          <span className="text-xs text-muted-2">Ships with the site — reset puts it back</span>
        )}
      </div>

      <ConfirmDialog
        open={confirming}
        title={s.custom ? `Delete ${s.name}?` : `Reset ${s.name}?`}
        body={
          s.custom
            ? "The service comes off the site, along with its repairs and any prices set for it. This can't be undone."
            : "Everything changed about this service goes back to what the site ships with — its words, its prices and its repairs."
        }
        confirmLabel={s.custom ? "Delete it" : "Reset it"}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          onRemove();
        }}
      />
    </div>
  );
}

const input =
  "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-royal-bright";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mt-3 block">
      <span className="text-xs font-medium text-muted">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const smallInput =
  "w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-xs outline-none focus:border-royal-bright";

/** A labelled field inside a problem row, where the label has to be tiny. */
function Small({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="text-[0.62rem] font-medium uppercase tracking-[0.08em] text-muted-2">{label}</span>
      <div className="mt-0.5">{children}</div>
    </label>
  );
}

/** One quantity offer: how many units, what it costs, and what it saves. */
function TierRow({
  tier,
  onChange,
  onRemove,
}: {
  tier: ServiceTier;
  onChange: (fields: Partial<ServiceTier>) => void;
  onRemove: () => void;
}) {
  const off = tierSaving(tier);
  return (
    <div className="grid grid-cols-[3.5rem_1fr_1fr_1fr_auto] items-center gap-2">
      <NumberField value={tier.qty} onValue={(qty) => onChange({ qty })} min="1" className={smallInput} />
      <NumberField value={tier.price} onValue={(price) => onChange({ price })} min="0" className={smallInput} />
      <NumberField
        value={tier.was ?? 0}
        onValue={(was) => onChange({ was: was > 0 ? was : undefined })}
        min="0"
        className={smallInput}
      />
      <input
        value={tier.badge ?? ""}
        onChange={(e) => onChange({ badge: e.target.value || undefined })}
        placeholder="Bestseller"
        aria-label="Badge"
        className={smallInput}
      />
      <span className="flex items-center gap-1">
        <span className="w-9 text-right text-[0.68rem] font-medium text-emerald">
          {off > 0 ? `${off}%` : ""}
        </span>
        <button
          onClick={onRemove}
          aria-label="Remove offer"
          className="rounded-lg p-1.5 text-danger hover:bg-danger/10"
        >
          <X className="size-3.5" />
        </button>
      </span>
    </div>
  );
}
