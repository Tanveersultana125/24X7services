"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Loader2, Plus, RotateCcw, Trash2 } from "lucide-react";
import { BrandMark } from "@/components/ui/Icons";
import {
  BUILT_IN_BRAND_IDS,
  DEFAULT_BRAND_ACCENT,
  brandSlug,
  type AdminBrand,
} from "@/lib/brands-shared";
import { ConfirmDialog } from "./ConfirmDialog";
import { cn } from "@/lib/utils";

/**
 * The makes we service.
 *
 * The four that ship with the build can be renamed, recoloured and hidden but
 * not deleted — Reset puts one back to what the code says. A company added
 * here can be deleted outright, and is ticked onto every service the moment it
 * is added, because a make that services nothing appears nowhere on the site.
 */
export function BrandsManager({ initial }: { initial: AdminBrand[] }) {
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  const patch = (id: string, fields: Partial<AdminBrand>) =>
    setRows((prev) => prev.map((b) => (b.id === id ? { ...b, ...fields } : b)));

  const send = async (method: "POST" | "PATCH" | "DELETE", body: unknown) => {
    const res = await fetch("/api/admin/brands", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      if (res.status === 401) setError("Your admin session expired — sign in again at /admin/login.");
      else if (data?.error === "already_exists") setError("A company with that name is already listed.");
      else if (data?.error === "name_reserved")
        setError("That name is taken — the booking form uses “other” for a make we don't list.");
      else if (data?.error === "name_unusable") setError("That name has no letters or numbers in it.");
      else setError(data?.detail ? `That didn't save. ${data.detail}` : "That didn't save. Please try again.");
      return null;
    }
    return data ?? {};
  };

  const save = async (b: AdminBrand) => {
    setBusy(b.id);
    setError(null);
    const ok = await send("PATCH", {
      id: b.id,
      name: b.name,
      tagline: b.tagline,
      accent: b.accent,
      active: b.active,
    });
    setBusy(null);
    if (!ok) return;
    setSaved(b.id);
    window.setTimeout(() => setSaved((cur) => (cur === b.id ? null : cur)), 1800);
  };

  const remove = async (b: AdminBrand) => {
    setBusy(b.id);
    setError(null);
    const ok = await send("DELETE", { id: b.id });
    setBusy(null);
    if (!ok) return;
    // A built-in comes back as the code has it; an added one goes for good.
    if (b.custom) setRows((prev) => prev.filter((r) => r.id !== b.id));
    else window.location.reload();
  };

  const add = async () => {
    const name = newName.trim();
    if (!name) return;
    setBusy("new");
    setError(null);
    const res = await send("POST", { name });
    setBusy(null);
    if (!res?.id) return;
    setNewName("");
    setAdding(false);
    // Reloaded rather than pushed onto the list: adding a company also ticks it
    // onto every service, and puts a new page under Services in the sidebar.
    window.location.reload();
  };

  const preview = brandSlug(newName.trim());

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-2xl tracking-[-0.02em] sm:text-3xl">Brands &amp; companies</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            The makes the site says it services. Add a company and it appears on the brands page, in
            the footer, in search and in the booking form&apos;s first step — and gets its own
            pricing page under Services. Saving publishes straight away.
          </p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-background hover:opacity-90 sm:py-2"
        >
          <Plus className="size-4" /> Add a company
        </button>
      </div>

      {error && <p className="mb-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}

      {adding && (
        <div className="mb-5 rounded-2xl border border-border bg-surface p-4 shadow-premium-sm sm:p-5">
          <p className="text-sm font-medium">Which company do you service?</p>
          <p className="mt-1 text-xs text-muted">
            Whirlpool, Godrej, Voltas — its name is what customers will see. It starts ticked on
            every service; untick it on the ones it doesn&apos;t cover.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              value={newName}
              autoFocus
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="Whirlpool"
              className="min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-royal-bright"
            />
            <button
              onClick={add}
              disabled={!preview || busy === "new"}
              className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
            >
              {busy === "new" && <Loader2 className="size-4 animate-spin" />} Add
            </button>
            <button
              onClick={() => {
                setAdding(false);
                setNewName("");
                setError(null);
              }}
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted hover:text-ink"
            >
              Cancel
            </button>
          </div>
          {preview && (
            <p className="mt-2 text-[0.68rem] text-muted-2">
              Its page will be <span className="font-medium">/brands/{preview}</span>.
            </p>
          )}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        {rows.map((b) => (
          <BrandCard
            key={b.id}
            brand={b}
            busy={busy === b.id}
            saved={saved === b.id}
            onChange={(fields) => patch(b.id, fields)}
            onSave={() => save(b)}
            onRemove={() => remove(b)}
          />
        ))}
      </div>
    </div>
  );
}

const input =
  "mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-royal-bright";

function BrandCard({
  brand: b,
  busy,
  saved,
  onChange,
  onSave,
  onRemove,
}: {
  brand: AdminBrand;
  busy: boolean;
  saved: boolean;
  onChange: (fields: Partial<AdminBrand>) => void;
  onSave: () => void;
  onRemove: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const builtIn = BUILT_IN_BRAND_IDS.has(b.id);

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-premium-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        {/* White plate in both themes: a mark is fixed artwork, and Samsung's
            navy on a near-black card reads as a different, muddier logo. */}
        <span className="grid h-12 min-w-[7rem] shrink-0 place-items-center rounded-xl bg-white px-4 ring-1 ring-black/5">
          <BrandMark id={b.id} name={b.name} accent={b.accent} tone="brand" className="text-xl" />
        </span>
        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs font-medium text-muted">
          <input
            type="checkbox"
            checked={b.active}
            onChange={(e) => onChange({ active: e.target.checked })}
            className="size-4 accent-emerald"
          />
          <span className={b.active ? "text-emerald" : undefined}>{b.active ? "Live" : "Hidden"}</span>
        </label>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium text-muted">Company name</span>
          <input value={b.name} onChange={(e) => onChange({ name: e.target.value })} className={input} />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted">House colour</span>
          <span className="mt-1 flex items-center gap-2">
            <input
              type="color"
              value={/^#[0-9a-fA-F]{6}$/.test(b.accent) ? b.accent : DEFAULT_BRAND_ACCENT}
              onChange={(e) => onChange({ accent: e.target.value.toUpperCase() })}
              aria-label={`${b.name} house colour`}
              className="size-9 shrink-0 cursor-pointer rounded-lg border border-border bg-surface-2 p-1"
            />
            <input
              value={b.accent}
              onChange={(e) => onChange({ accent: e.target.value })}
              spellCheck={false}
              className="min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-sm uppercase outline-none focus:border-royal-bright"
            />
          </span>
        </label>
      </div>

      <label className="mt-3 block">
        <span className="text-xs font-medium text-muted">One-line description</span>
        <input value={b.tagline} onChange={(e) => onChange({ tagline: e.target.value })} className={input} />
      </label>

      <p className="mt-3 text-[0.68rem] text-muted-2">
        Prices for this make are set on{" "}
        <Link href={`/admin/services/${b.id}`} className="font-medium text-royal-bright hover:underline">
          its own page
        </Link>
        . Which services it covers is ticked on{" "}
        <Link href="/admin/services" className="font-medium text-royal-bright hover:underline">
          Services &amp; prices
        </Link>
        .
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <button
          onClick={onSave}
          disabled={busy || !b.name.trim()}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50",
            saved ? "bg-emerald text-white" : "bg-ink text-background hover:opacity-90",
          )}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : saved ? <Check className="size-4" /> : null}
          {saved ? "Saved" : "Save"}
        </button>
        <button
          onClick={() => setConfirming(true)}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-danger disabled:opacity-50"
        >
          {builtIn ? <RotateCcw className="size-4" /> : <Trash2 className="size-4" />}
          {builtIn ? "Reset" : "Delete"}
        </button>
      </div>

      <ConfirmDialog
        open={confirming}
        title={builtIn ? `Reset ${b.name}?` : `Delete ${b.name}?`}
        body={
          builtIn
            ? "Everything this panel changed about this make goes back to what the code says. Its prices are not touched."
            : "The company is removed from the site, along with its page. Prices already set for it are left behind and will not be shown."
        }
        confirmLabel={builtIn ? "Reset" : "Delete"}
        onConfirm={() => {
          setConfirming(false);
          onRemove();
        }}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}
