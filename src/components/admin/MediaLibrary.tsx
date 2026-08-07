"use client";

import { useRef, useState } from "react";
import { Check, Copy, ImageUp, Loader2, Trash2 } from "lucide-react";
import type { MediaImage } from "@/lib/media";
import { cn } from "@/lib/utils";

const MAX_BYTES = 10 * 1024 * 1024;
// Kept in step with the upload route, so a rejection is explained here first.
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

/**
 * Images an admin has uploaded but not yet placed.
 *
 * Every position on this page is fixed by the design, so "add" can't mean a
 * new position here. It means a new image on the shelf: upload once, copy its
 * link, and point any slot or card at it with "Use a URL".
 */
export function MediaLibrary({ initial }: { initial: MediaImage[] }) {
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    if (!TYPES.includes(file.type)) {
      return setError("Use a JPG, PNG, WebP, AVIF or GIF image.");
    }
    if (file.size > MAX_BYTES) {
      return setError(`That image is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is 10 MB.`);
    }

    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", "site-images");
      const up = await fetch("/api/admin/upload", { method: "POST", body: form });
      const uploaded = await up.json().catch(() => null);
      if (!up.ok || !uploaded?.url) {
        setError(uploaded?.detail ? `Upload failed. ${uploaded.detail}` : "Upload failed. Please try again.");
        return;
      }

      const name = file.name.replace(/\.[^.]+$/, "");
      const res = await fetch("/api/admin/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: uploaded.url, name }),
      });
      const saved = await res.json().catch(() => null);
      if (!res.ok || !saved?.id) {
        setError("Uploaded, but couldn't save it to the library.");
        return;
      }
      setItems((prev) => [{ id: saved.id, url: uploaded.url, name, createdAt: Date.now() }, ...prev]);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    const prev = items;
    setItems((list) => list.filter((i) => i.id !== id));
    try {
      const res = await fetch("/api/admin/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        setItems(prev);
        setError("Couldn't remove that image from the library.");
      }
    } catch {
      setItems(prev);
      setError("Couldn't reach the server. Check your connection and try again.");
    }
  };

  const copy = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(id);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setError("Your browser wouldn't let the page copy — select the link and copy it by hand.");
    }
  };

  return (
    <section className="mt-12 border-t border-border pt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl">
          <h2 className="font-display text-xl tracking-[-0.02em]">Your images</h2>
          <p className="mt-1 text-sm text-muted">
            Upload a photo here to keep it ready. An image on the shelf isn&apos;t on the site by
            itself — copy its link, then use <span className="font-medium">Use a URL</span> on
            whichever position or card should show it.
          </p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept={TYPES.join(",")}
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = "";
          }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-background hover:opacity-90",
            busy && "pointer-events-none opacity-60",
          )}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <ImageUp className="size-4" />}
          {busy ? "Uploading…" : "Add image"}
        </button>
      </div>

      {error && <p className="mt-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}

      {items.length === 0 ? (
        <p className="mt-5 rounded-2xl border border-dashed border-border-strong bg-surface px-4 py-8 text-center text-sm text-muted">
          Nothing uploaded yet.
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-2xl border border-border bg-surface shadow-premium-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url} alt={item.name} className="aspect-[4/3] w-full object-cover" />
              <div className="p-3">
                <p className="truncate text-sm font-medium">{item.name}</p>
                <div className="mt-2 flex gap-1.5">
                  <button
                    onClick={() => copy(item.url, item.id)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-2 py-1.5 text-xs font-medium text-muted hover:text-ink"
                  >
                    {copied === item.id ? <Check className="size-3.5 text-emerald" /> : <Copy className="size-3.5" />}
                    {copied === item.id ? "Copied" : "Copy link"}
                  </button>
                  <button
                    onClick={() => remove(item.id)}
                    aria-label={`Remove ${item.name}`}
                    className="rounded-lg p-2 text-danger hover:bg-danger/10"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
