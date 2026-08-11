"use client";

import { useRef, useState } from "react";
import { Plus, Trash2, X, Loader2, ImageUp } from "lucide-react";
import { GALLERY_CATEGORIES, type GalleryPhoto } from "@/lib/gallery-shared";
import { cn } from "@/lib/utils";

/** Matches the limit the upload route enforces; fail here with a reason instead. */
const MAX_BYTES = 10 * 1024 * 1024;

const DISK_NOTICE =
  "This upload was saved on the dev server, because neither Cloudinary nor Firebase Storage is configured. It works locally, but a deployed server starts with an empty disk — set the Cloudinary keys, or turn Storage on in the Firebase console, before deploying.";

export function GalleryManager({ initial }: { initial: GalleryPhoto[] }) {
  const [items, setItems] = useState<GalleryPhoto[]>(initial);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ src: "", label: "", category: GALLERY_CATEGORIES[0] as string });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const describe = async (res: Response, fallback: string) => {
    if (res.status === 401) return "Your admin session expired — sign in again at /admin/login.";
    const data = await res.json().catch(() => null);
    return typeof data?.detail === "string" ? `${fallback} ${data.detail}` : fallback;
  };

  /** Browser → our server → the project's own storage bucket. */
  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("That file isn't an image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`That image is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is 10 MB.`);
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("folder", "gallery");
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.url) {
        setError(
          data?.detail
            ? `Upload failed. ${data.detail}`
            : data?.error === "storage_not_configured"
              ? "Storage isn't configured — set the CLOUDINARY_* keys, or turn on Firebase Storage."
              : "Upload failed. Please try again.",
        );
        return;
      }
      if (data.stored === "disk") setNotice(DISK_NOTICE);
      setDraft((d) => ({ ...d, src: data.url, label: d.label || file.name.replace(/\.[^.]+$/, "") }));
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!draft.src.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) {
        setError(await describe(res, "Couldn't save that photo."));
        return;
      }
      const data = await res.json();
      setItems((prev) => [
        { id: data.id, src: draft.src, label: draft.label || "Untitled", category: draft.category, createdAt: Date.now() },
        ...prev,
      ]);
      setDraft({ src: "", label: "", category: GALLERY_CATEGORIES[0] });
      setAdding(false);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    const prev = items;
    setItems((list) => list.filter((i) => i.id !== id));
    setError(null);
    try {
      const res = await fetch("/api/admin/gallery", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        setItems(prev);
        setError(await describe(res, "Couldn't delete that photo."));
      }
    } catch {
      setItems(prev);
      setError("Couldn't reach the server. Check your connection and try again.");
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-2xl tracking-[-0.02em] sm:text-3xl">Gallery</h1>
          <p className="mt-1 text-sm text-muted">
            The work photos on the Process page. Uploads are stored in the project&apos;s own bucket; the page refreshes itself
            once a photo is added or removed.
          </p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-background hover:opacity-90 sm:py-2"
        >
          <Plus className="size-4" /> Add photo
        </button>
      </div>

      {error && !adding && (
        <p className="mb-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>
      )}
      {notice && <p className="mb-4 rounded-xl bg-amber/10 px-4 py-3 text-sm text-amber">{notice}</p>}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-strong bg-surface py-14 text-center">
          <p className="font-medium">No photos yet.</p>
          <p className="mt-1 text-sm text-muted">
            Add one and it appears in the gallery on the Process page.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {items.map((item) => (
            <div key={item.id} className="group relative overflow-hidden rounded-2xl border border-border bg-surface shadow-premium-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.src} alt={item.label} className="aspect-[4/3] w-full object-cover" />
              <div className="p-3">
                <p className="truncate text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted">{item.category}</p>
              </div>
              <button
                onClick={() => remove(item.id)}
                aria-label="Remove"
                /* Always visible on touch: reveal-on-hover leaves the only way to
                   delete a photo unreachable on a phone. Hover-reveal is kept
                   from lg up, where a pointer exists. */
                className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-white/90 text-danger shadow-premium-sm backdrop-blur transition-opacity hover:bg-white lg:opacity-0 lg:group-hover:opacity-100"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add modal */}
      {adding && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4" onClick={() => setAdding(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-premium-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-medium">Add photo</h2>
              <button onClick={() => setAdding(false)} aria-label="Close"><X className="size-5 text-muted" /></button>
            </div>

            <div className="mt-4 space-y-3">
              {/* upload */}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) upload(file);
                  e.target.value = "";
                }}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) upload(file);
                }}
                className={cn(
                  "flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-border-strong bg-surface-2/40 px-4 py-6 text-sm transition-colors hover:border-royal-bright",
                  uploading && "pointer-events-none opacity-60",
                )}
              >
                {uploading ? <Loader2 className="size-5 animate-spin text-muted" /> : <ImageUp className="size-5 text-muted" />}
                <span className="font-medium">{uploading ? "Uploading…" : "Choose a photo or drop it here"}</span>
                <span className="text-xs text-muted">JPG or PNG, up to 10 MB</span>
              </button>

              <Input
                label="…or paste an image URL"
                value={draft.src}
                onChange={(v) => setDraft({ ...draft, src: v })}
                placeholder="https://… or /work/gallery/ac-1.png"
              />
              <Input
                label="Label"
                value={draft.label}
                onChange={(v) => setDraft({ ...draft, label: v })}
                placeholder="AC installation"
              />
              <label className="block">
                <span className="text-xs font-medium text-muted">Category</span>
                <select
                  value={draft.category}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-royal-bright"
                >
                  {GALLERY_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>

              {draft.src && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draft.src} alt="preview" className="aspect-[4/3] w-full rounded-lg border border-border object-cover" />
              )}

              {error && <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setAdding(false)} className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-surface-2">
                Cancel
              </button>
              <button
                onClick={save}
                disabled={!draft.src.trim() || saving || uploading}
                className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
              >
                {saving && <Loader2 className="size-4 animate-spin" />}
                {saving ? "Saving…" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-royal-bright"
      />
    </label>
  );
}
