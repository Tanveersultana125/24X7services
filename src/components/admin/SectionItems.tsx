"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImageUp, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  SECTION_FIELDS,
  SPOTLIGHT_TINTS,
  type SectionId,
  type SectionItem,
} from "@/lib/section-items-shared";
import { ADD_CARD_EVENT, type AddCardRequest } from "@/lib/admin/add-card-event";
import { cn } from "@/lib/utils";

const MAX_BYTES = 10 * 1024 * 1024;

type Draft = Record<string, string>;

/**
 * Cards added to a strip, beside the ones that ship with it.
 *
 * The built-in cards are the design and can only have their photo replaced;
 * these are extra positions, so they carry their own words and can be removed
 * again.
 */
export function SectionItems({
  section,
  label,
  initial,
}: {
  section: SectionId;
  label: string;
  initial: SectionItem[];
}) {
  const [items, setItems] = useState(initial);
  const [adding, setAdding] = useState(false);
  /** The card being edited; null while adding a new one. */
  const [editing, setEditing] = useState<SectionItem | null>(null);
  const [draft, setDraft] = useState<Draft>({ tint: SPOTLIGHT_TINTS[0] });
  const [src, setSrc] = useState("");
  const [busy, setBusy] = useState<"upload" | "save" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fields = SECTION_FIELDS[section];

  const openAdd = useCallback((withSrc = "") => {
    setEditing(null);
    setDraft({ tint: SPOTLIGHT_TINTS[0] });
    setSrc(withSrc);
    setError(null);
    setAdding(true);
  }, []);

  /**
   * "Use it here → as a new card" from the shelf above. The photo is already
   * uploaded by then, so the dialog opens with only the words left to write.
   */
  useEffect(() => {
    const onRequest = (e: Event) => {
      const src = (e as CustomEvent<AddCardRequest>).detail?.src;
      if (src) openAdd(src);
    };
    window.addEventListener(ADD_CARD_EVENT, onRequest);
    return () => window.removeEventListener(ADD_CARD_EVENT, onRequest);
  }, [openAdd]);

  const openEdit = (item: SectionItem) => {
    setEditing(item);
    setDraft({
      title: item.title,
      sub: item.sub,
      cta: item.cta,
      price: item.price ? String(item.price) : "",
      rating: item.rating ? String(item.rating) : "",
      meta: item.meta,
      badge: item.badge,
      href: item.href,
      tint: item.tint,
    });
    setSrc(item.src);
    setError(null);
    setAdding(true);
  };

  const upload = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return setError("That file isn't an image.");
    if (file.size > MAX_BYTES) {
      return setError(`That image is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is 10 MB.`);
    }
    setBusy("upload");
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", "site-images");
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.url) {
        setError(data?.detail ? `Upload failed. ${data.detail}` : "Upload failed. Please try again.");
        return;
      }
      setSrc(data.url);
      // A screenshot pasted from the clipboard arrives as "image.png", which
      // makes a poor card title — only fill an empty one.
      const name = file.name.replace(/\.[^.]+$/, "");
      setDraft((d) => (d.title?.trim() ? d : { ...d, title: name }));
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }, []);

  /**
   * Ctrl+V while the dialog is open. A screenshot or an image copied from
   * another page never reaches the disk, so "choose a file" can't get at it.
   * Text pasted into one of the fields is left alone.
   */
  useEffect(() => {
    if (!adding) return;
    const onPaste = (e: ClipboardEvent) => {
      const clip = e.clipboardData;
      if (!clip) return;
      const image = Array.from(clip.files).find((f) => f.type.startsWith("image/"));
      if (!image) return;
      if (clip.types.includes("text/plain")) return;
      e.preventDefault();
      upload(image);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [adding, upload]);

  const save = async () => {
    const missing = fields.find((f) => f.required && !draft[f.name as string]?.trim());
    if (!src) return setError("Add a photo first.");
    if (missing) return setError(`${missing.label} is required.`);

    setBusy("save");
    setError(null);
    try {
      const res = await fetch("/api/admin/section-items", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editing ? { id: editing.id } : { section }),
          src,
          ...draft,
          price: draft.price ? Number(draft.price) : 0,
          rating: draft.rating ? Number(draft.rating) : 0,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setError(
          res.status === 401
            ? "Your admin session expired — sign in again at /admin/login."
            : data?.detail ?? "Couldn't save that card.",
        );
        return;
      }
      const saved = {
          id: editing ? editing.id : data.id,
          section,
          src,
          title: draft.title ?? "",
          sub: draft.sub ?? "",
          cta: draft.cta ?? "Book now",
          price: Number(draft.price ?? 0),
          rating: Number(draft.rating ?? 0),
          meta: draft.meta ?? "",
          badge: draft.badge ?? "",
          href: draft.href ?? "/book",
          tint: draft.tint ?? SPOTLIGHT_TINTS[0],
          createdAt: editing ? editing.createdAt : Date.now(),
      };
      setItems((prev) => (editing ? prev.map((i) => (i.id === saved.id ? saved : i)) : [...prev, saved]));
      setDraft({ tint: SPOTLIGHT_TINTS[0] });
      setSrc("");
      setEditing(null);
      setAdding(false);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  };

  const remove = async (id: string) => {
    const prev = items;
    setItems((list) => list.filter((i) => i.id !== id));
    try {
      const res = await fetch("/api/admin/section-items", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        setItems(prev);
        setError("Couldn't delete that card.");
      }
    } catch {
      setItems(prev);
      setError("Couldn't reach the server. Check your connection and try again.");
    }
  };

  const field =
    "mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-royal-bright";

  return (
    <section className="mt-12 border-t border-border pt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl tracking-[-0.02em]">Cards you&apos;ve added</h2>
          <p className="mt-1 text-sm text-muted">
            These appear after the built-in ones in {label}. Delete removes the card from the site.
          </p>
        </div>
        <button
          onClick={() => openAdd()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-background hover:opacity-90"
        >
          <Plus className="size-4" /> Add a card
        </button>
      </div>

      {error && !adding && (
        <p className="mt-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>
      )}

      {items.length === 0 ? (
        <p className="mt-5 rounded-2xl border border-dashed border-border-strong bg-surface px-4 py-8 text-center text-sm text-muted">
          No added cards yet — the strip shows the ones that ship with the site.
        </p>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-2xl border border-border bg-surface shadow-premium-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.src} alt={item.title} className="aspect-[5/4] w-full object-cover" />
              <div className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted">{item.href}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => openEdit(item)}
                    aria-label={`Edit ${item.title}`}
                    className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-ink"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => remove(item.id)}
                    aria-label={`Delete ${item.title}`}
                    className="rounded-lg p-2 text-danger hover:bg-danger/10"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {adding && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4" onClick={() => setAdding(false)}>
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-premium-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{editing ? `Edit ${editing.title}` : `Add a card to ${label}`}</h3>
              <button onClick={() => setAdding(false)} aria-label="Close">
                <X className="size-5 text-muted" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
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
              <button
                onClick={() => fileRef.current?.click()}
                disabled={busy === "upload"}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f) upload(f);
                }}
                className={cn(
                  "flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-border-strong bg-surface-2/40 px-4 py-6 text-sm hover:border-royal-bright",
                  busy === "upload" && "pointer-events-none opacity-60",
                )}
              >
                {busy === "upload" ? <Loader2 className="size-5 animate-spin text-muted" /> : <ImageUp className="size-5 text-muted" />}
                <span className="font-medium">{busy === "upload" ? "Uploading…" : "Choose a photo or drop it here"}</span>
                {busy !== "upload" && (
                  <span className="text-xs text-muted">or paste a copied image with Ctrl/⌘+V</span>
                )}
              </button>

              <label className="block">
                <span className="text-xs font-medium text-muted">…or paste an image URL</span>
                <input value={src} onChange={(e) => setSrc(e.target.value)} placeholder="https://… or /work/ac.png" className={field} />
              </label>

              {src && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt="" className="aspect-[5/4] w-full rounded-lg border border-border object-cover" />
              )}

              {fields.map((f) =>
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
                            "size-8 rounded-lg ring-2 ring-offset-2 ring-offset-surface transition-transform hover:scale-105",
                            draft.tint === t ? "ring-royal-bright" : "ring-transparent",
                          )}
                          style={{ background: t }}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <label key={f.name as string} className="block">
                    <span className="text-xs font-medium text-muted">
                      {f.label}
                      {f.required && <span className="text-danger"> *</span>}
                    </span>
                    <input
                      type={f.type === "number" ? "number" : "text"}
                      value={draft[f.name as string] ?? ""}
                      onChange={(e) => setDraft((d) => ({ ...d, [f.name as string]: e.target.value }))}
                      placeholder={f.placeholder}
                      className={field}
                    />
                  </label>
                ),
              )}

              {error && <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setAdding(false)} className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-surface-2">
                Cancel
              </button>
              <button
                onClick={save}
                disabled={busy !== null}
                className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
              >
                {busy === "save" && <Loader2 className="size-4 animate-spin" />}
                {busy === "save" ? "Saving…" : editing ? "Save changes" : "Add card"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
