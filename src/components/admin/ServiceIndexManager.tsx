"use client";

import { useRef, useState } from "react";
import { Check, ImageUp, Link as LinkIcon, Loader2, RotateCcw } from "lucide-react";
import type { Service } from "@/lib/services";
import { ConfirmDialog } from "./ConfirmDialog";
import { cn } from "@/lib/utils";

type Row = Service & { hidden?: boolean };

const MAX_BYTES = 10 * 1024 * 1024;

/**
 * The eight-service index on /services.
 *
 * The order, the numbering and which appliance each row books stay in the
 * code — those are the design. What a row says, what it costs, the photo
 * behind it and whether it appears at all are edited here, and only the
 * changes are stored, so an untouched field keeps following the code.
 */
export function ServiceIndexManager({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState<Row | null>(null);

  const patch = (id: string, fields: Partial<Row>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...fields } : r)));

  const save = async (row: Row) => {
    setBusy(row.id);
    setError(null);
    try {
      const res = await fetch("/api/admin/service-index", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: row.id,
          title: row.title,
          desc: row.desc,
          price: row.price,
          eta: row.eta,
          tags: row.tags,
          image: row.image ?? "",
          hidden: row.hidden ?? false,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(
          res.status === 401
            ? "Your admin session expired — sign in again at /admin/login."
            : data?.detail
              ? `That didn't save. ${data.detail}`
              : "That didn't save. Please try again.",
        );
        return;
      }
      setSaved(row.id);
      window.setTimeout(() => setSaved((cur) => (cur === row.id ? null : cur)), 2000);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  };

  const reset = async (row: Row) => {
    setBusy(row.id);
    setError(null);
    try {
      const res = await fetch("/api/admin/service-index", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id }),
      });
      if (!res.ok) {
        setError("Couldn't reset that service.");
        return;
      }
      window.location.reload();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="font-display text-2xl tracking-[-0.02em] sm:text-3xl">Service list</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          The eight rows under &ldquo;Eight services. One standard.&rdquo; on the services page.
          Change what a row says, what it starts at, and the photo on its preview card. Reset puts a
          row back to what the site ships with.
        </p>
      </div>

      {error && <p className="mb-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}

      <div className="grid gap-4 xl:grid-cols-2">
        {rows.map((row) => (
          <RowCard
            key={row.id}
            row={row}
            busy={busy === row.id}
            saved={saved === row.id}
            onChange={(fields) => patch(row.id, fields)}
            onSave={() => save(row)}
            onReset={() => setResetting(row)}
            onError={setError}
          />
        ))}
      </div>

      <ConfirmDialog
        open={resetting !== null}
        title={`Reset ${resetting?.title ?? "this service"}?`}
        body="Its words, price and photo go back to what the site ships with."
        confirmLabel="Reset it"
        onCancel={() => setResetting(null)}
        onConfirm={() => {
          const row = resetting;
          setResetting(null);
          if (row) reset(row);
        }}
      />
    </div>
  );
}

function RowCard({
  row,
  busy,
  saved,
  onChange,
  onSave,
  onReset,
  onError,
}: {
  row: Row;
  busy: boolean;
  saved: boolean;
  onChange: (fields: Partial<Row>) => void;
  onSave: () => void;
  onReset: () => void;
  onError: (message: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [urlOpen, setUrlOpen] = useState(false);
  const [url, setUrl] = useState("");

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) return onError("That file isn't an image.");
    if (file.size > MAX_BYTES) {
      return onError(`That image is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is 10 MB.`);
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", "site-images");
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.url) {
        onError(data?.detail ? `Upload failed. ${data.detail}` : "Upload failed. Please try again.");
        return;
      }
      onChange({ image: data.url });
    } catch {
      onError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-premium-sm sm:p-5">
      <div className="flex items-start gap-3">
        <span className="mt-1 text-xs font-semibold text-muted-2">{row.no}</span>
        <div className="min-w-0 flex-1">
          <span className="text-xs font-medium text-muted">Title</span>
          <input
            value={row.title}
            onChange={(e) => onChange({ title: e.target.value })}
            aria-label="Service title"
            className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-medium outline-none focus:border-royal-bright"
          />
        </div>
        <label className="mt-6 flex shrink-0 cursor-pointer items-center gap-2 text-xs font-medium text-muted">
          <input
            type="checkbox"
            checked={!row.hidden}
            onChange={(e) => onChange({ hidden: !e.target.checked })}
            className="size-4 accent-emerald"
          />
          <span className={row.hidden ? undefined : "text-emerald"}>{row.hidden ? "Hidden" : "Live"}</span>
        </label>
      </div>

      {/* the photo behind the preview card */}
      <div className="mt-4 flex gap-3">
        <div className="grid aspect-[4/3] w-28 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface-2">
          {row.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.image} alt="" className="size-full object-cover" />
          ) : (
            <span className="px-2 text-center text-[0.62rem] text-muted-2">No photo</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
              e.target.value = "";
            }}
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-xs font-medium text-background hover:opacity-90",
                uploading && "pointer-events-none opacity-60",
              )}
            >
              {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <ImageUp className="size-3.5" />}
              {uploading ? "Uploading…" : row.image ? "Replace" : "Add photo"}
            </button>
            <button
              onClick={() => setUrlOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted hover:text-ink"
            >
              <LinkIcon className="size-3.5" /> Use a URL
            </button>
          </div>
          {urlOpen && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const value = url.trim();
                if (!value) return;
                onChange({ image: value });
                setUrl("");
                setUrlOpen(false);
              }}
              className="mt-2 flex gap-2"
            >
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://… or /work/gallery/ac-1.png"
                className="min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs outline-none focus:border-royal-bright"
              />
              <button
                type="submit"
                className="rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-background hover:opacity-90"
              >
                Use
              </button>
            </form>
          )}
        </div>
      </div>

      <label className="mt-3 block">
        <span className="text-xs font-medium text-muted">Description</span>
        <textarea
          value={row.desc}
          onChange={(e) => onChange({ desc: e.target.value })}
          rows={2}
          className="mt-1 w-full resize-y rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-royal-bright"
        />
      </label>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-medium text-muted">Price line</span>
          <input
            value={row.price}
            onChange={(e) => onChange({ price: e.target.value })}
            placeholder="from ₹299"
            className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-royal-bright"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted">Time</span>
          <input
            value={row.eta}
            onChange={(e) => onChange({ eta: e.target.value })}
            placeholder="45–90 min"
            className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-royal-bright"
          />
        </label>
      </div>

      <label className="mt-3 block">
        <span className="text-xs font-medium text-muted">Tags — separated by commas</span>
        <input
          value={row.tags.join(", ")}
          onChange={(e) => onChange({ tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
          placeholder="Cooling, Compressor, Gas"
          className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-royal-bright"
        />
      </label>

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
          onClick={onReset}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-medium text-muted hover:text-ink"
        >
          <RotateCcw className="size-4" /> Reset
        </button>
      </div>
    </div>
  );
}
