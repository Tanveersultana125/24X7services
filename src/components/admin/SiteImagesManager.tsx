"use client";

import { useRef, useState } from "react";
import { Loader2, ImageUp, RotateCcw, Link as LinkIcon } from "lucide-react";
import {
  SITE_IMAGE_SLOTS,
  DEFAULT_SITE_IMAGES,
  type SiteImages,
} from "@/lib/site-images-shared";
import { cn } from "@/lib/utils";

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const MAX_BYTES = 10 * 1024 * 1024;

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
}: {
  current: SiteImages;
  /** Restricts the page to one group of slots. */
  group: string;
  title: string;
  blurb: string;
}) {
  const [images, setImages] = useState<SiteImages>(current);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const configured = Boolean(CLOUD && PRESET);

  const fail = async (res: Response, fallback: string) => {
    if (res.status === 401) {
      setError("Your admin session expired — sign in again at /admin/login.");
      return;
    }
    const data = await res.json().catch(() => null);
    setError(typeof data?.detail === "string" ? `${fallback} ${data.detail}` : fallback);
  };

  const assign = async (key: string, src: string) => {
    setBusy(key);
    setError(null);
    try {
      const res = await fetch("/api/admin/site-images", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, src }),
      });
      if (!res.ok) return void (await fail(res, "Couldn't save that image."));
      setImages((prev) => ({ ...prev, [key]: src }));
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  };

  const upload = async (key: string, file: File) => {
    if (!configured) {
      setError("Cloudinary isn't configured — set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and _UPLOAD_PRESET.");
      return;
    }
    if (!file.type.startsWith("image/")) return setError("That file isn't an image.");
    if (file.size > MAX_BYTES) {
      return setError(`That image is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is 10 MB.`);
    }

    setBusy(key);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("upload_preset", PRESET!);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.secure_url) {
        // Cloudinary's own wording for a bad cloud name or preset is "Unknown
        // API key", which sends people hunting for a key they never set.
        const message = String(data?.error?.message ?? "");
        setError(
          res.status === 401 || /unknown api key/i.test(message)
            ? `Cloudinary rejected the account details (“${message.trim() || "unauthorised"}”). Check NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, and that NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET is the name of an unsigned upload preset — not an API key or secret. You can paste an image URL below in the meantime.`
            : message || "Cloudinary refused the upload.",
        );
        setBusy(null);
        return;
      }
      await assign(key, data.secure_url);
    } catch {
      setError("Couldn't reach Cloudinary. Check your connection and try again.");
      setBusy(null);
    }
  };

  const reset = async (key: string) => {
    setBusy(key);
    setError(null);
    try {
      const res = await fetch("/api/admin/site-images", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      if (!res.ok) return void (await fail(res, "Couldn't reset that image."));
      setImages((prev) => ({ ...prev, [key]: DEFAULT_SITE_IMAGES[key] }));
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {SITE_IMAGE_SLOTS.filter((slot) => slot.group === group).map((slot) => {
          const src = images[slot.key] ?? slot.defaultSrc;
          return (
            <SlotCard
              key={slot.key}
              slotKey={slot.key}
              label={slot.label}
              where={slot.where}
              ratio={slot.ratio}
              src={src}
              custom={src !== slot.defaultSrc}
              busy={busy === slot.key}
              onUpload={(file) => upload(slot.key, file)}
              onUseUrl={(url) => assign(slot.key, url)}
              onReset={() => reset(slot.key)}
            />
          );
        })}
      </div>
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
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  // The way in when Cloudinary isn't set up — or when the photo already lives
  // somewhere, including this project's own /public folder.
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={label} className="max-h-full max-w-full object-contain" />
        {busy && (
          <span className="absolute inset-0 grid place-items-center bg-surface/70">
            <Loader2 className="size-6 animate-spin text-muted" />
          </span>
        )}
        {custom && (
          <span className="absolute left-3 top-3 rounded-full bg-emerald/15 px-2 py-0.5 text-[0.65rem] font-semibold text-emerald">
            Replaced
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
            aria-label={`Replace ${slotKey}`}
          >
            <ImageUp className="size-3.5" /> Replace
          </button>
          <button
            onClick={() => setUrlOpen((o) => !o)}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted hover:text-ink"
          >
            <LinkIcon className="size-3.5" /> Use a URL
          </button>
          {custom && (
            <button
              onClick={onReset}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted hover:text-ink"
            >
              <RotateCcw className="size-3.5" /> Reset
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
    </div>
  );
}
