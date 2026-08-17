"use client";

import { useRef, useState } from "react";
import {
  Check,
  ExternalLink,
  ImageUp,
  Link as LinkIcon,
  Loader2,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import {
  SERVICE_INDEX_COPY_DEFAULTS,
  type ServiceIndexCopy,
  type ServiceIndexRow,
} from "@/lib/service-index-shared";
import { ConfirmDialog } from "./ConfirmDialog";
import { cn } from "@/lib/utils";

type Row = ServiceIndexRow;
type ApplianceOption = { id: string; name: string };

const MAX_BYTES = 10 * 1024 * 1024;

const FIELD =
  "mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-royal-bright";

/**
 * The service index on /services — "Eight services. One standard."
 *
 * Everything on that section is edited here: the words around the list, the
 * rows themselves, and the photo on each row's preview card. A row that ships
 * with the build can be rewritten, taken off the site or put back exactly as
 * the code has it; a row added here can be deleted for good. The numbering
 * follows the list, so nothing has to be renumbered by hand.
 */
export function ServiceIndexManager({
  initial,
  copy,
  appliances,
}: {
  initial: Row[];
  copy: ServiceIndexCopy;
  appliances: ApplianceOption[];
}) {
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<Row | null>(null);
  const [adding, setAdding] = useState(false);

  const live = rows.filter((r) => !r.hidden).length;

  const patch = (id: string, fields: Partial<Row>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...fields } : r)));

  const failed = (res: Response, data: { detail?: string } | null) =>
    setError(
      res.status === 401
        ? "Your admin session expired — sign in again at /admin/login."
        : data?.detail
          ? `That didn't save. ${data.detail}`
          : "That didn't save. Please try again.",
    );

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
          ...(row.custom ? { appliance: row.appliance ?? "", kind: row.kind } : null),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        failed(res, data);
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

  /** Reset for a shipped row, delete for one that was added here. */
  const remove = async (row: Row) => {
    setBusy(row.id);
    setError(null);
    try {
      const res = await fetch("/api/admin/service-index", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id }),
      });
      if (!res.ok) {
        setError(row.custom ? "Couldn't delete that service." : "Couldn't reset that service.");
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
        <h1 className="font-display text-2xl tracking-[-0.02em] sm:text-3xl">Services page list</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          The section under &ldquo;Eight services. One standard.&rdquo; on the services page — its
          words, its rows and the photo on each preview card. Add a service of your own, rewrite one
          that ships with the site, or take it off. Reset puts a shipped row back to what the site
          ships with; an added row deletes for good.
        </p>
        <a
          href="/services#services"
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-royal-bright hover:underline"
        >
          See it on the site <ExternalLink className="size-3.5" />
        </a>
      </div>

      {error && <p className="mb-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}

      <CopyCard copy={copy} live={live} onError={setError} />

      <div className="mb-4 mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg tracking-[-0.02em]">
          Services <span className="text-sm font-normal text-muted">({live} live of {rows.length})</span>
        </h2>
        <button
          onClick={() => setAdding((o) => !o)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-sm font-medium text-background hover:opacity-90"
        >
          {adding ? <X className="size-4" /> : <Plus className="size-4" />}
          {adding ? "Cancel" : "Add a service"}
        </button>
      </div>

      {adding && (
        <NewRowForm
          appliances={appliances}
          onError={setError}
          onCancel={() => setAdding(false)}
        />
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        {rows.map((row) => (
          <RowCard
            key={row.id}
            row={row}
            appliances={appliances}
            busy={busy === row.id}
            saved={saved === row.id}
            onChange={(fields) => patch(row.id, fields)}
            onSave={() => save(row)}
            onRemove={() => setConfirming(row)}
            onError={setError}
          />
        ))}
      </div>

      <ConfirmDialog
        open={confirming !== null}
        title={
          confirming?.custom
            ? `Delete ${confirming.title}?`
            : `Reset ${confirming?.title ?? "this service"}?`
        }
        body={
          confirming?.custom
            ? "It goes off the services page for good — there is no code version to fall back to."
            : "Its words, price and photo go back to what the site ships with."
        }
        confirmLabel={confirming?.custom ? "Delete it" : "Reset it"}
        onCancel={() => setConfirming(null)}
        onConfirm={() => {
          const row = confirming;
          setConfirming(null);
          if (row) remove(row);
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------ section copy */

function CopyCard({
  copy,
  live,
  onError,
}: {
  copy: ServiceIndexCopy;
  live: number;
  onError: (message: string) => void;
}) {
  const [words, setWords] = useState(copy);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [resetting, setResetting] = useState(false);

  const set = (fields: Partial<ServiceIndexCopy>) => setWords((prev) => ({ ...prev, ...fields }));

  const save = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/service-index/copy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(words),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        onError(data?.detail ? `That didn't save. ${data.detail}` : "That didn't save. Please try again.");
        return;
      }
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch {
      onError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/service-index/copy", { method: "DELETE" });
      if (!res.ok) {
        onError("Couldn't reset the section's words.");
        return;
      }
      window.location.reload();
    } catch {
      onError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  // The shipped headline counts the services out loud, so it goes stale the
  // moment a row is added or hidden. Say so rather than let the page lie.
  const stale = words.headline === SERVICE_INDEX_COPY_DEFAULTS.headline && live !== 8;

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-premium-sm sm:p-5">
      <h2 className="font-display text-lg tracking-[-0.02em]">Section words</h2>
      <p className="mt-1 text-sm text-muted">
        The heading and the line beside it, above the list.
      </p>

      {stale && (
        <p className="mt-3 rounded-xl bg-amber/10 px-3 py-2 text-[0.8rem] text-amber">
          The heading still says &ldquo;Eight services.&rdquo; but {live} are live. Worth rewording.
        </p>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium text-muted">Kicker</span>
          <input value={words.kicker} onChange={(e) => set({ kicker: e.target.value })} placeholder="The work" className={FIELD} />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted">Heading — first line</span>
          <input value={words.headline} onChange={(e) => set({ headline: e.target.value })} placeholder="Eight services." className={FIELD} />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted">Heading — second line (italic)</span>
          <input
            value={words.headlineAccent}
            onChange={(e) => set({ headlineAccent: e.target.value })}
            placeholder="One standard."
            className={FIELD}
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted">Paragraph</span>
          <textarea
            value={words.intro}
            onChange={(e) => set({ intro: e.target.value })}
            rows={2}
            className={cn(FIELD, "resize-y")}
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={save}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          {saved ? "Saved" : "Save words"}
        </button>
        <button
          onClick={() => setResetting(true)}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-medium text-muted hover:text-ink"
        >
          <RotateCcw className="size-4" /> Reset
        </button>
      </div>

      <ConfirmDialog
        open={resetting}
        title="Reset the section's words?"
        body="The kicker, heading and paragraph go back to what the site ships with."
        confirmLabel="Reset them"
        onCancel={() => setResetting(false)}
        onConfirm={() => {
          setResetting(false);
          reset();
        }}
      />
    </div>
  );
}

/* --------------------------------------------------------------- new service */

function NewRowForm({
  appliances,
  onError,
  onCancel,
}: {
  appliances: ApplianceOption[];
  onError: (message: string) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState({
    title: "",
    desc: "",
    price: "",
    eta: "",
    tags: "",
    image: "",
    appliance: "",
    kind: "care" as "repair" | "care",
  });
  const [busy, setBusy] = useState(false);

  const set = (fields: Partial<typeof draft>) => setDraft((prev) => ({ ...prev, ...fields }));

  const submit = async () => {
    if (!draft.title.trim()) return onError("A new service needs a title.");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/service-index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          tags: draft.tags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        onError(data?.detail ? `That didn't save. ${data.detail}` : "That didn't save. Please try again.");
        return;
      }
      window.location.reload();
    } catch {
      onError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-4 rounded-2xl border border-royal-bright/30 bg-royal-bright/[0.04] p-4 shadow-premium-sm sm:p-5">
      <h3 className="font-display text-base tracking-[-0.02em]">A service of your own</h3>
      <p className="mt-1 text-sm text-muted">
        It joins the end of the list and is numbered from there.
      </p>

      <label className="mt-4 block">
        <span className="text-xs font-medium text-muted">Title</span>
        <input
          value={draft.title}
          onChange={(e) => set({ title: e.target.value })}
          placeholder="Chimney Deep Clean"
          className={cn(FIELD, "font-medium")}
        />
      </label>

      <div className="mt-3">
        <span className="text-xs font-medium text-muted">Photo</span>
        <PhotoPicker value={draft.image} onChange={(image) => set({ image })} onError={onError} />
      </div>

      <label className="mt-3 block">
        <span className="text-xs font-medium text-muted">Description</span>
        <textarea
          value={draft.desc}
          onChange={(e) => set({ desc: e.target.value })}
          rows={2}
          placeholder="What the visit covers, in a line."
          className={cn(FIELD, "resize-y")}
        />
      </label>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium text-muted">Price line</span>
          <input value={draft.price} onChange={(e) => set({ price: e.target.value })} placeholder="from ₹499" className={FIELD} />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted">Time</span>
          <input value={draft.eta} onChange={(e) => set({ eta: e.target.value })} placeholder="45–90 min" className={FIELD} />
        </label>
      </div>

      <label className="mt-3 block">
        <span className="text-xs font-medium text-muted">Tags — separated by commas</span>
        <input value={draft.tags} onChange={(e) => set({ tags: e.target.value })} placeholder="Deep clean, Safety, Filters" className={FIELD} />
      </label>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ApplianceSelect
          value={draft.appliance}
          appliances={appliances}
          onChange={(appliance) => set({ appliance })}
        />
        <KindSelect value={draft.kind} onChange={(kind) => set({ kind })} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={submit}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Add it
        </button>
        <button
          onClick={onCancel}
          disabled={busy}
          className="rounded-xl border border-border px-3 py-2 text-sm font-medium text-muted hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- rows */

function RowCard({
  row,
  appliances,
  busy,
  saved,
  onChange,
  onSave,
  onRemove,
  onError,
}: {
  row: Row;
  appliances: ApplianceOption[];
  busy: boolean;
  saved: boolean;
  onChange: (fields: Partial<Row>) => void;
  onSave: () => void;
  onRemove: () => void;
  onError: (message: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-premium-sm sm:p-5">
      <div className="flex items-start gap-3">
        <span className="mt-1 text-xs font-semibold text-muted-2">{row.no}</span>
        <div className="min-w-0 flex-1">
          <span className="text-xs font-medium text-muted">
            Title{row.custom && <span className="ml-2 text-royal-bright">Added here</span>}
          </span>
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
      <div className="mt-4">
        <PhotoPicker value={row.image ?? ""} onChange={(image) => onChange({ image })} onError={onError} />
      </div>

      <label className="mt-3 block">
        <span className="text-xs font-medium text-muted">Description</span>
        <textarea
          value={row.desc}
          onChange={(e) => onChange({ desc: e.target.value })}
          rows={2}
          className={cn(FIELD, "resize-y")}
        />
      </label>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium text-muted">Price line</span>
          <input value={row.price} onChange={(e) => onChange({ price: e.target.value })} placeholder="from ₹299" className={FIELD} />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted">Time</span>
          <input value={row.eta} onChange={(e) => onChange({ eta: e.target.value })} placeholder="45–90 min" className={FIELD} />
        </label>
      </div>

      <label className="mt-3 block">
        <span className="text-xs font-medium text-muted">Tags — separated by commas</span>
        <input
          value={row.tags.join(", ")}
          onChange={(e) => onChange({ tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
          placeholder="Cooling, Compressor, Gas"
          className={FIELD}
        />
      </label>

      {/* Which appliance a shipped row books is design, in the code — an added
          row's is not, so only it is asked. */}
      {row.custom && (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ApplianceSelect
            value={row.appliance ?? ""}
            appliances={appliances}
            onChange={(appliance) => onChange({ appliance })}
          />
          <KindSelect value={row.kind} onChange={(kind) => onChange({ kind })} />
        </div>
      )}

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
          onClick={onRemove}
          disabled={busy}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-medium",
            row.custom ? "text-danger hover:bg-danger/10" : "text-muted hover:text-ink",
          )}
        >
          {row.custom ? (
            <>
              <Trash2 className="size-4" /> Delete
            </>
          ) : (
            <>
              <RotateCcw className="size-4" /> Reset
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- shared fields */

function ApplianceSelect({
  value,
  appliances,
  onChange,
}: {
  value: string;
  appliances: ApplianceOption[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted">Books</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={FIELD}>
        <option value="">No appliance — general booking</option>
        {appliances.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function KindSelect({
  value,
  onChange,
}: {
  value: "repair" | "care";
  onChange: (value: "repair" | "care") => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted">Badge on the card</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value === "repair" ? "repair" : "care")}
        className={FIELD}
      >
        <option value="repair">Repair</option>
        <option value="care">Care</option>
      </select>
    </label>
  );
}

/** Upload a photo, paste a URL, or take the one that's there off. */
function PhotoPicker({
  value,
  onChange,
  onError,
}: {
  value: string;
  onChange: (value: string) => void;
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
      onChange(data.url);
    } catch {
      onError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    // Side by side needs about 300px to hold a thumbnail and three buttons; a
    // phone hasn't got it, and the buttons were being pushed off the card
    // rather than wrapping. Below sm the two stack instead.
    <div className="flex flex-col gap-3 sm:flex-row">
      {/* Contained, not cropped: this is the check on what was uploaded, so it
          has to show the whole frame — a cover crop hid whichever half of the
          photo the card happens not to use. */}
      <div className="grid aspect-[4/3] w-full shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-surface-2 p-1 sm:w-28">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="max-h-full max-w-full rounded-lg object-contain" />
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
            {uploading ? "Uploading…" : value ? "Replace" : "Add photo"}
          </button>
          <button
            onClick={() => setUrlOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted hover:text-ink"
          >
            <LinkIcon className="size-3.5" /> Use a URL
          </button>
          {value && (
            <button
              onClick={() => onChange("")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted hover:text-danger"
            >
              <X className="size-3.5" /> Remove
            </button>
          )}
        </div>
        {urlOpen && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const next = url.trim();
              if (!next) return;
              onChange(next);
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
        <p className="mt-2 text-[0.68rem] leading-snug text-muted-2">
          Landscape reads best — it sits as a band across the top of the preview card.
        </p>
      </div>
    </div>
  );
}
