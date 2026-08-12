"use client";

import { useRef, useState } from "react";
import type { MediaImage } from "@/lib/media";
import { MediaLibrary } from "./MediaLibrary";
import { ConfirmDialog } from "./ConfirmDialog";
import { Loader2, ImageUp, RotateCcw, Link as LinkIcon, Pencil, Trash2, Undo2, X } from "lucide-react";
import { SECTION_FIELDS, SPOTLIGHT_TINTS, type SectionId } from "@/lib/section-items-shared";
import type { SectionOverride, SectionOverrides } from "@/lib/section-overrides-shared";
import {
  SITE_IMAGE_SLOTS,
  DEFAULT_SITE_IMAGES,
  NO_IMAGE,
  type SiteImages,
} from "@/lib/site-images-shared";
import { cn } from "@/lib/utils";

const MAX_BYTES = 10 * 1024 * 1024;

const DISK_NOTICE =
  "This upload was saved on the dev server, because neither Cloudinary nor Firebase Storage is configured. It works locally, but a deployed server starts with an empty disk — set the Cloudinary keys, or turn Storage on in the Firebase console, before deploying.";

/**
 * Replace any photograph on the marketing site.
 *
 * Each card is a slot, not a file: uploading here reassigns what that position
 * renders, and "Reset" puts back the image that ships with the build.
 */
export function SiteImagesManager({
  current,
  group,
  title,
  blurb,
  section,
  overrides: initialOverrides = {},
  media,
}: {
  current: SiteImages;
  /** Restricts the page to one group of slots. */
  group: string;
  title: string;
  blurb: string;
  /** Set on the carousel pages, where a slot is a card with words of its own. */
  section?: SectionId;
  overrides?: SectionOverrides;
  /** Photos already uploaded, for the shelf above the positions. */
  media: MediaImage[];
}) {
  const groupSlots = SITE_IMAGE_SLOTS.filter((slot) => slot.group === group);
  const [images, setImages] = useState<SiteImages>(current);
  const [overrides, setOverrides] = useState<SectionOverrides>(initialOverrides);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Not a failure — where the bytes landed, when it wasn't the bucket.
  const [notice, setNotice] = useState<string | null>(null);
  /**
   * The last change and how to put it back. Only one deep: this undoes the
   * step you just took, which is the one you regret.
   */
  const [undo, setUndo] = useState<{ label: string; run: () => Promise<boolean> } | null>(null);

  const labelOf = (key: string) => groupSlots.find((s) => s.key === key)?.label ?? "that position";

  const fail = async (res: Response, fallback: string) => {
    if (res.status === 401) {
      setError("Your admin session expired — sign in again at /admin/login.");
      return;
    }
    const data = await res.json().catch(() => null);
    setError(typeof data?.detail === "string" ? `${fallback} ${data.detail}` : fallback);
  };

  /**
   * The four writes, with no memory of their own. Everything below records
   * how to reverse itself in terms of these, so an undo is an ordinary write
   * and can't leave the panel and the site disagreeing.
   */
  const putImage = async (key: string, src: string): Promise<boolean> => {
    setBusy(key);
    setError(null);
    try {
      const res = await fetch("/api/admin/site-images", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, src }),
      });
      if (!res.ok) {
        await fail(res, "Couldn't save that image.");
        return false;
      }
      setImages((prev) => ({ ...prev, [key]: src }));
      return true;
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      return false;
    } finally {
      setBusy(null);
    }
  };

  const dropImage = async (key: string): Promise<boolean> => {
    setBusy(key);
    setError(null);
    try {
      const res = await fetch("/api/admin/site-images", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      if (!res.ok) {
        await fail(res, "Couldn't reset that image.");
        return false;
      }
      setImages((prev) => ({ ...prev, [key]: DEFAULT_SITE_IMAGES[key] }));
      return true;
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      return false;
    } finally {
      setBusy(null);
    }
  };

  /**
   * Puts a position back the way it was before the last change — to whichever
   * photo it held, or to the build's own if it held nothing of ours.
   */
  const restoreImage = (key: string, previous: string | undefined) =>
    previous === undefined || previous === DEFAULT_SITE_IMAGES[key]
      ? dropImage(key)
      : putImage(key, previous);

  /** Returns whether the position now holds this photo. */
  const assign = async (key: string, src: string): Promise<boolean> => {
    const previous = images[key];
    const ok = await putImage(key, src);
    if (ok) {
      setUndo({
        label: `Changed the photo in ${labelOf(key)}.`,
        run: () => restoreImage(key, previous),
      });
    }
    return ok;
  };

  /** Browser → our server → the project's own storage bucket. */
  const upload = async (key: string, file: File) => {
    if (!file.type.startsWith("image/")) return setError("That file isn't an image.");
    if (file.size > MAX_BYTES) {
      return setError(`That image is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is 10 MB.`);
    }

    setBusy(key);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", "site-images");
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.url) {
        setError(
          data?.detail
            ? `Upload failed. ${data.detail}`
            : data?.error === "storage_not_configured"
              ? "Storage isn't configured — set the CLOUDINARY_* keys, or turn on Firebase Storage."
              : "Upload failed. Please try again.",
        );
        setBusy(null);
        return;
      }
      if (data.stored === "disk") setNotice(DISK_NOTICE);
      await assign(key, data.url);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setBusy(null);
    }
  };

  const putOverride = async (key: string, fields: Record<string, unknown>): Promise<boolean> => {
    setBusy(key);
    setError(null);
    try {
      const res = await fetch("/api/admin/section-overrides", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, ...fields }),
      });
      if (!res.ok) {
        await fail(res, "Couldn't save that card.");
        return false;
      }
      setOverrides((prev) => ({ ...prev, [key]: { ...prev[key], ...fields } }));
      return true;
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      return false;
    } finally {
      setBusy(null);
    }
  };

  const dropOverride = async (key: string): Promise<boolean> => {
    setBusy(key);
    setError(null);
    try {
      const res = await fetch("/api/admin/section-overrides", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      if (!res.ok) {
        await fail(res, "Couldn't restore that card.");
        return false;
      }
      setOverrides((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return true;
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      return false;
    } finally {
      setBusy(null);
    }
  };

  /**
   * The route merges, so putting an earlier state back means clearing first —
   * otherwise a field the last change added would survive the undo.
   */
  const restoreOverride = async (key: string, previous: SectionOverride | undefined) => {
    const cleared = await dropOverride(key);
    if (!cleared) return false;
    if (!previous || Object.keys(previous).length === 0) return true;
    return putOverride(key, previous);
  };

  /** Rewrite or hide a built-in card; both are stored against its slot. */
  const patchOverride = async (key: string, fields: Record<string, unknown>) => {
    const previous = overrides[key];
    const ok = await putOverride(key, fields);
    if (!ok) return;
    setEditing(null);
    setUndo({
      label:
        "hidden" in fields
          ? `${fields.hidden ? "Deleted" : "Restored"} ${labelOf(key)}.`
          : `Edited the words on ${labelOf(key)}.`,
      run: () => restoreOverride(key, previous),
    });
  };

  /** Back to exactly what the code says — words, link and visibility. */
  const clearOverride = async (key: string) => {
    const previous = overrides[key];
    const ok = await dropOverride(key);
    if (ok && previous) {
      setUndo({
        label: `Restored ${labelOf(key)} to the original.`,
        run: () => restoreOverride(key, previous),
      });
    }
  };

  const openEdit = (key: string) => {
    const o = overrides[key] ?? {};
    setDraft({
      title: o.title ?? "",
      sub: o.sub ?? "",
      cta: o.cta ?? "",
      href: o.href ?? "",
      meta: o.meta ?? "",
      badge: o.badge ?? "",
      price: o.price ? String(o.price) : "",
      rating: o.rating ? String(o.rating) : "",
      tint: o.tint ?? SPOTLIGHT_TINTS[0],
    });
    setEditing(key);
  };

  const reset = async (key: string) => {
    const previous = images[key];
    const ok = await dropImage(key);
    if (ok && previous !== DEFAULT_SITE_IMAGES[key]) {
      setUndo({
        label: `Put the original photo back in ${labelOf(key)}.`,
        run: () => restoreImage(key, previous),
      });
    }
  };

  const runUndo = async () => {
    if (!undo) return;
    const ok = await undo.run();
    if (ok) setUndo(null);
  };

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="font-display text-2xl tracking-[-0.02em] sm:text-3xl">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          {blurb} Replace one and it appears everywhere that position is used; reset puts back the
          original.
        </p>
      </div>

      {error && <p className="mb-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}
      {notice && <p className="mb-4 rounded-xl bg-amber/10 px-4 py-3 text-sm text-amber">{notice}</p>}

      {undo && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm">
          <span className="text-ink">{undo.label}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={runUndo}
              disabled={busy !== null}
              className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-background hover:opacity-90 disabled:opacity-50"
            >
              <Undo2 className="size-3.5" /> Undo
            </button>
            <button
              onClick={() => setUndo(null)}
              aria-label="Dismiss"
              className="rounded-lg p-1.5 text-muted hover:text-ink"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      <MediaLibrary
        initial={media}
        targets={groupSlots.map((s) => ({ key: s.key, label: s.label }))}
        onPlace={assign}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {groupSlots.map((slot) => {
          const src = images[slot.key] ?? slot.defaultSrc;
          const emptied = src === NO_IMAGE;
          return (
            <SlotCard
              key={slot.key}
              slotKey={slot.key}
              label={slot.label}
              where={slot.where}
              ratio={slot.ratio}
              src={emptied ? "" : src}
              custom={src !== slot.defaultSrc}
              busy={busy === slot.key}
              onUpload={(file) => upload(slot.key, file)}
              onUseUrl={(url) => assign(slot.key, url)}
              onReset={() => reset(slot.key)}
              // A carousel card is deleted whole, through its section override;
              // a standalone page photo is deleted by emptying its position.
              emptied={emptied}
              onEmpty={section ? undefined : () => assign(slot.key, NO_IMAGE)}
              editable={Boolean(section)}
              hidden={Boolean(overrides[slot.key]?.hidden)}
              rewritten={Object.keys(overrides[slot.key] ?? {}).some((k) => k !== "hidden")}
              onEdit={() => openEdit(slot.key)}
              onToggleHidden={() => patchOverride(slot.key, { hidden: !overrides[slot.key]?.hidden })}
              onRestore={() => clearOverride(slot.key)}
            />
          );
        })}
      </div>

      {/* Rewriting a built-in card: the same fields its section shows, empty
          meaning "leave what the code says". */}
      {editing && section && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4" onClick={() => setEditing(null)}>
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-premium-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-medium">
              Edit {SITE_IMAGE_SLOTS.find((s) => s.key === editing)?.label ?? "card"}
            </h3>
            <p className="mt-1 text-xs text-muted">Leave a field empty to keep what the site ships with.</p>

            <div className="mt-4 space-y-3">
              {SECTION_FIELDS[section].map((f) =>
                f.type === "colour" ? (
                  <div key={f.name as string}>
                    <span className="text-xs font-medium text-muted">{f.label}</span>
                    <div className="mt-1.5 flex gap-2">
                      {SPOTLIGHT_TINTS.map((t) => (
                        <button
                          key={t}
                          onClick={() => setDraft((d) => ({ ...d, tint: t }))}
                          aria-label={t}
                          className={cn(
                            "size-8 rounded-lg ring-2 ring-offset-2 ring-offset-surface",
                            draft.tint === t ? "ring-royal-bright" : "ring-transparent",
                          )}
                          style={{ background: t }}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <label key={f.name as string} className="block">
                    <span className="text-xs font-medium text-muted">{f.label}</span>
                    <input
                      type={f.type === "number" ? "number" : "text"}
                      value={draft[f.name as string] ?? ""}
                      onChange={(e) => setDraft((d) => ({ ...d, [f.name as string]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-royal-bright"
                    />
                  </label>
                ),
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-surface-2">
                Cancel
              </button>
              <button
                onClick={() =>
                  patchOverride(editing, {
                    ...Object.fromEntries(
                      Object.entries(draft).filter(([, v]) => v !== ""),
                    ),
                    ...(draft.price ? { price: Number(draft.price) } : {}),
                    ...(draft.rating ? { rating: Number(draft.rating) } : {}),
                  })
                }
                disabled={busy !== null}
                className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SlotCard({
  slotKey,
  label,
  where,
  ratio,
  src,
  custom,
  busy,
  onUpload,
  onUseUrl,
  onReset,
  emptied = false,
  onEmpty,
  editable = false,
  hidden = false,
  rewritten = false,
  onEdit,
  onToggleHidden,
  onRestore,
}: {
  slotKey: string;
  label: string;
  where: string;
  ratio: string;
  src: string;
  custom: boolean;
  busy: boolean;
  onUpload: (file: File) => void;
  onUseUrl: (url: string) => void;
  onReset: () => void;
  /** The position is on the site but showing nothing. */
  emptied?: boolean;
  /** Absent where a picture can't be taken away on its own. */
  onEmpty?: () => void;
  /** Carousel cards carry words as well as a picture. */
  editable?: boolean;
  hidden?: boolean;
  rewritten?: boolean;
  onEdit?: () => void;
  onToggleHidden?: () => void;
  onRestore?: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  // Taking a card off the site is worth a second press, the way deleting a
  // review is — it is reversible, but not by accident.
  const [confirming, setConfirming] = useState(false);
  // For a photo that already lives somewhere — another site, or this
  // project's own /public folder.
  const [urlOpen, setUrlOpen] = useState(false);
  const [url, setUrl] = useState("");

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-premium-sm">
      {/* checkerboard: several of these are cut-outs, and a plain panel hides a
          transparent edge that would show up badly on the site */}
      <div
        className="relative grid aspect-[4/3] place-items-center p-4"
        style={{
          backgroundImage:
            "linear-gradient(45deg, var(--surface-2) 25%, transparent 25%), linear-gradient(-45deg, var(--surface-2) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--surface-2) 75%), linear-gradient(-45deg, transparent 75%, var(--surface-2) 75%)",
          backgroundSize: "16px 16px",
          backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0",
        }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={label} className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="text-xs font-medium text-muted-2">No image</span>
        )}
        {busy && (
          <span className="absolute inset-0 grid place-items-center bg-surface/70">
            <Loader2 className="size-6 animate-spin text-muted" />
          </span>
        )}
        {custom && !emptied && (
          <span className="absolute left-3 top-3 rounded-full bg-emerald/15 px-2 py-0.5 text-[0.65rem] font-semibold text-emerald">
            Replaced
          </span>
        )}
        {emptied && (
          <span className="absolute left-3 top-3 rounded-full bg-danger/15 px-2 py-0.5 text-[0.65rem] font-semibold text-danger">
            Deleted from the site
          </span>
        )}
        {rewritten && !hidden && (
          <span className="absolute right-3 top-3 rounded-full bg-royal-bright/15 px-2 py-0.5 text-[0.65rem] font-semibold text-royal-bright">
            Edited
          </span>
        )}
        {hidden && (
          <span className="absolute inset-0 grid place-items-center bg-surface/80 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            Deleted from the site
          </span>
        )}
      </div>

      <div className="p-4">
        <p className="font-medium">{label}</p>
        <p className="mt-0.5 text-xs text-muted">{where}</p>
        <p className="mt-1 text-[0.7rem] text-muted-2">{ratio}</p>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
            e.target.value = "";
          }}
        />

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) onUpload(file);
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-xs font-medium text-background hover:opacity-90",
              busy && "pointer-events-none opacity-60",
            )}
            aria-label={`${emptied ? "Add an image to" : "Replace"} ${slotKey}`}
          >
            <ImageUp className="size-3.5" /> {emptied ? "Add image" : "Replace"}
          </button>
          <button
            onClick={() => setUrlOpen((o) => !o)}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted hover:text-ink"
          >
            <LinkIcon className="size-3.5" /> Use a URL
          </button>
          {/* Takes the photo off the site and leaves the position empty —
              recoverable with Reset, but worth a second press first. */}
          {onEmpty && !emptied && (
            <button
              onClick={() => setConfirming(true)}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-danger hover:bg-danger/10"
            >
              <Trash2 className="size-3.5" /> Delete
            </button>
          )}
          {editable && (
            <>
              <button
                onClick={onEdit}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted hover:text-ink"
              >
                <Pencil className="size-3.5" /> Edit text
              </button>
              {hidden ? (
                <button
                  onClick={onToggleHidden}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-emerald"
                >
                  <Undo2 className="size-3.5" /> Restore
                </button>
              ) : (
                <button
                  onClick={() => setConfirming(true)}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-danger hover:bg-danger/10"
                >
                  <Trash2 className="size-3.5" /> Delete
                </button>
              )}
            </>
          )}
          {(custom || rewritten || hidden) && (
            <button
              onClick={() => {
                if (custom) onReset();
                if (rewritten || hidden) onRestore?.();
              }}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted hover:text-ink"
            >
              <RotateCcw className="size-3.5" /> {emptied ? "Bring it back" : "Reset"}
            </button>
          )}
        </div>

        {urlOpen && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const value = url.trim();
              if (!value) return;
              onUseUrl(value);
              setUrl("");
              setUrlOpen(false);
            }}
            className="mt-3 flex gap-2"
          >
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://… or /work/ac.png"
              className="min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs outline-none focus:border-royal-bright"
            />
            <button
              type="submit"
              disabled={!url.trim() || busy}
              className="rounded-lg bg-ink px-3 py-2 text-xs font-medium text-background hover:opacity-90 disabled:opacity-50"
            >
              Save
            </button>
          </form>
        )}
      </div>

      {/* Both Delete buttons open this: a page position is emptied, a carousel
          card is taken off the strip. Either is undone from the same card. */}
      <ConfirmDialog
        open={confirming}
        title={`Delete ${label}?`}
        body={
          editable
            ? "The card comes off the site. Restore puts it back exactly as it was."
            : "The position stays, showing nothing. Bring it back restores the original photo."
        }
        confirmLabel="Delete it"
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          if (editable) onToggleHidden?.();
          else onEmpty?.();
        }}
      />
    </div>
  );
}
