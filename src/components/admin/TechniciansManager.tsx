"use client";

import { useState } from "react";
import { Check, KeyRound, Loader2, Plus, Trash2 } from "lucide-react";
import type { Technician } from "@/lib/technicians";
import { ConfirmDialog } from "./ConfirmDialog";
import { cn } from "@/lib/utils";

/**
 * The people on the books.
 *
 * A technician here is a login as well as a name on a booking: the number and
 * PIN set on this page are what they sign into the field app with. The PIN is
 * never read back — the box is blank on every load, and typing into it is how
 * you replace it. Doing so signs their phone out, which is the point of doing
 * it at all.
 */
export function TechniciansManager({
  initial,
  appliances,
}: {
  initial: Technician[];
  appliances: string[];
}) {
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: "", phone: "", pin: "", city: "" });

  const patch = (id: string, fields: Partial<Technician>) =>
    setRows((prev) => prev.map((t) => (t.id === id ? { ...t, ...fields } : t)));

  const send = async (method: "POST" | "PATCH" | "DELETE", body: unknown) => {
    const res = await fetch("/api/admin/technicians", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      if (res.status === 401) setError("Your admin session expired — sign in again at /admin/login.");
      else if (data?.error === "already_exists") setError("Somebody with that name is already on the books.");
      else if (data?.error === "phone_invalid") setError("That doesn't look like a 10-digit mobile number.");
      else if (data?.error === "pin_invalid") setError("A PIN is 4 to 6 digits.");
      else setError(data?.detail ? `That didn't save. ${data.detail}` : "That didn't save. Please try again.");
      return null;
    }
    return data ?? {};
  };

  const save = async (t: Technician, pin: string) => {
    setBusy(t.id);
    setError(null);
    const ok = await send("PATCH", {
      id: t.id,
      name: t.name,
      phone: t.phone,
      city: t.city,
      skills: t.skills,
      active: t.active,
      pin,
    });
    setBusy(null);
    if (!ok) return;
    setSaved(t.id);
    window.setTimeout(() => setSaved((cur) => (cur === t.id ? null : cur)), 1800);
  };

  const remove = async (t: Technician) => {
    setBusy(t.id);
    setError(null);
    const ok = await send("DELETE", { id: t.id });
    setBusy(null);
    if (!ok) return;
    setRows((prev) => prev.filter((r) => r.id !== t.id));
  };

  const add = async () => {
    setBusy("new");
    setError(null);
    const res = await send("POST", { ...draft, skills: [] });
    setBusy(null);
    if (!res?.id) return;
    setDraft({ name: "", phone: "", pin: "", city: "" });
    setAdding(false);
    window.location.reload();
  };

  const canAdd =
    draft.name.trim().length > 1 &&
    draft.phone.replace(/\D/g, "").length >= 10 &&
    /^\d{4,6}$/.test(draft.pin);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-2xl tracking-[-0.02em] sm:text-3xl">Technicians</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Who is on the books, and what they sign into the field app at{" "}
            <span className="font-medium text-ink">/tech</span> with. Assign them to a booking on
            the Bookings page — they see only their own jobs, with the address and the customer&apos;s
            number.
          </p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-background hover:opacity-90 sm:py-2"
        >
          <Plus className="size-4" /> Add a technician
        </button>
      </div>

      {error && <p className="mb-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}

      {adding && (
        <div className="mb-5 rounded-2xl border border-border bg-surface p-4 shadow-premium-sm sm:p-5">
          <p className="text-sm font-medium">Who is joining?</p>
          <p className="mt-1 text-xs text-muted">
            The number is their sign-in. Give them the PIN yourself — it can&apos;t be read back
            from here afterwards, only replaced.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-4">
            <input
              value={draft.name}
              autoFocus
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="Ravi Kumar"
              aria-label="Name"
              className={FIELD}
            />
            <input
              value={draft.phone}
              onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
              placeholder="98450 11223"
              inputMode="numeric"
              aria-label="Phone"
              className={FIELD}
            />
            <input
              value={draft.pin}
              onChange={(e) => setDraft((d) => ({ ...d, pin: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
              placeholder="PIN (4–6 digits)"
              inputMode="numeric"
              aria-label="PIN"
              className={FIELD}
            />
            <input
              value={draft.city}
              onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))}
              placeholder="Hyderabad"
              aria-label="City"
              className={FIELD}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={add}
              disabled={!canAdd || busy === "new"}
              className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
            >
              {busy === "new" && <Loader2 className="size-4 animate-spin" />} Add
            </button>
            <button
              onClick={() => {
                setAdding(false);
                setError(null);
              }}
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {rows.length === 0 && !adding ? (
        <p className="rounded-2xl border border-dashed border-border px-5 py-12 text-center text-sm text-muted">
          Nobody on the books yet. Add one and they can sign in at /tech.
        </p>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {rows.map((t) => (
            <TechnicianCard
              key={t.id}
              technician={t}
              appliances={appliances}
              busy={busy === t.id}
              saved={saved === t.id}
              onChange={(fields) => patch(t.id, fields)}
              onSave={(pin) => save(t, pin)}
              onRemove={() => remove(t)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const FIELD =
  "w-full min-w-0 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-royal-bright";

function TechnicianCard({
  technician: t,
  appliances,
  busy,
  saved,
  onChange,
  onSave,
  onRemove,
}: {
  technician: Technician;
  appliances: string[];
  busy: boolean;
  saved: boolean;
  onChange: (fields: Partial<Technician>) => void;
  onSave: (pin: string) => void;
  onRemove: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  // Blank on every render: the stored PIN can't be read, so this box is only
  // ever a replacement, never the current value.
  const [pin, setPin] = useState("");

  const toggleSkill = (name: string) =>
    onChange({
      skills: t.skills.includes(name) ? t.skills.filter((s) => s !== name) : [...t.skills, name],
    });

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-premium-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="text-xs font-medium text-muted">Name</span>
          <input
            value={t.name}
            onChange={(e) => onChange({ name: e.target.value })}
            aria-label="Technician name"
            className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-medium outline-none focus:border-royal-bright"
          />
        </div>
        <label className="mt-6 flex shrink-0 cursor-pointer items-center gap-2 text-xs font-medium text-muted">
          <input
            type="checkbox"
            checked={t.active}
            onChange={(e) => onChange({ active: e.target.checked })}
            className="size-4 accent-emerald"
          />
          <span className={t.active ? "text-emerald" : undefined}>{t.active ? "Working" : "Off"}</span>
        </label>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium text-muted">Phone (their sign-in)</span>
          <input
            value={t.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            inputMode="numeric"
            className={cn(FIELD, "mt-1")}
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted">City</span>
          <input value={t.city} onChange={(e) => onChange({ city: e.target.value })} className={cn(FIELD, "mt-1")} />
        </label>
      </div>

      <label className="mt-3 block">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
          <KeyRound className="size-3.5" /> New PIN
        </span>
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="Leave blank to keep the current one"
          inputMode="numeric"
          className={cn(FIELD, "mt-1")}
        />
        {pin.length > 0 && pin.length < 4 && (
          <span className="mt-1 block text-[0.68rem] text-danger">A PIN is 4 to 6 digits.</span>
        )}
        {pin.length >= 4 && (
          <span className="mt-1 block text-[0.68rem] text-muted-2">
            Saving this signs their phone out — tell them the new PIN.
          </span>
        )}
      </label>

      {appliances.length > 0 && (
        <div className="mt-4">
          <span className="text-xs font-medium text-muted">Trained on</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {appliances.map((name) => {
              const on = t.skills.includes(name);
              return (
                <button
                  key={name}
                  onClick={() => toggleSkill(name)}
                  aria-pressed={on}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    on
                      ? "border-transparent bg-royal-bright text-white"
                      : "border-border text-muted hover:text-ink",
                  )}
                >
                  {on && <Check className="size-3" />}
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <button
          onClick={() => {
            onSave(pin);
            setPin("");
          }}
          disabled={busy || !t.name.trim() || (pin.length > 0 && pin.length < 4)}
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
          <Trash2 className="size-4" /> Remove
        </button>
      </div>

      <ConfirmDialog
        open={confirming}
        title={`Remove ${t.name}?`}
        body="Their login stops working immediately. Jobs already assigned to them keep their name — reassign anything still open first."
        confirmLabel="Remove"
        onConfirm={() => {
          setConfirming(false);
          onRemove();
        }}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}
