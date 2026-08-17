"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Crop as CropIcon, Loader2, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Crop a photo before it goes on the site.
 *
 * The site shows whatever is saved here whole — it does not crop for you — so
 * this is where a photo is made the shape it should be. The cut is done in the
 * browser on a canvas and uploaded as its own image; the original is left
 * where it is, so a crop can always be started again from it.
 */

/** Fractions of the image, 0–1 — resolution-independent, so the box survives a resize. */
type Rect = { x: number; y: number; w: number; h: number };

type Handle = "move" | "nw" | "ne" | "sw" | "se";

const FULL: Rect = { x: 0, y: 0, w: 1, h: 1 };
const MIN = 0.06;

const RATIOS: { label: string; value: number | null }[] = [
  { label: "Free", value: null },
  { label: "16:9", value: 16 / 9 },
  { label: "4:3", value: 4 / 3 },
  { label: "1:1", value: 1 },
  { label: "3:4", value: 3 / 4 },
];

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function ImageCropper({
  src,
  onCropped,
  onCancel,
  onError,
}: {
  src: string;
  /** The cropped image's URL, once it has been uploaded. */
  onCropped: (url: string) => void;
  onCancel: () => void;
  onError: (message: string) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const drag = useRef<{ handle: Handle; x: number; y: number; rect: Rect } | null>(null);

  const [rect, setRect] = useState<Rect>(FULL);
  const [aspect, setAspect] = useState<number | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [busy, setBusy] = useState(false);
  /**
   * Asking for the image cross-origin is what lets the canvas read it back.
   * A host that answers without the matching header refuses the request
   * outright, though — so a failure falls back to a plain load, which at least
   * shows the picture, and the crop itself reports why it can't be saved.
   */
  const [cors, setCors] = useState(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  /** Fit the box to a ratio, keeping it centred on what it already covers. */
  const applyAspect = (value: number | null) => {
    setAspect(value);
    if (value === null) return;
    const box = wrapRef.current?.getBoundingClientRect();
    if (!box) return;
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;
    let w = rect.w;
    let h = (w * box.width) / (value * box.height);
    if (h > 1) {
      h = 1;
      w = (h * value * box.height) / box.width;
    }
    setRect({ x: clamp(cx - w / 2, 0, 1 - w), y: clamp(cy - h / 2, 0, 1 - h), w, h });
  };

  const start = (handle: Handle, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    drag.current = { handle, x: e.clientX, y: e.clientY, rect };
  };

  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    const box = wrapRef.current?.getBoundingClientRect();
    if (!d || !box) return;
    const dx = (e.clientX - d.x) / box.width;
    const dy = (e.clientY - d.y) / box.height;
    setRect(resize(d.handle, d.rect, dx, dy, aspect, box.width, box.height));
  };

  const end = () => {
    drag.current = null;
  };

  const save = async () => {
    const img = imgRef.current;
    if (!img) return;
    setBusy(true);
    try {
      const nw = img.naturalWidth;
      const nh = img.naturalHeight;
      const sx = Math.round(rect.x * nw);
      const sy = Math.round(rect.y * nh);
      const sw = Math.max(1, Math.round(rect.w * nw));
      const sh = Math.max(1, Math.round(rect.h * nh));

      const canvas = document.createElement("canvas");
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no 2d context");
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

      // PNG keeps whatever transparency the original had; everything else is
      // a photograph, and JPEG is a third the size at this quality.
      const png = /\.png(\?|$)/i.test(src);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, png ? "image/png" : "image/jpeg", 0.92),
      );
      if (!blob) throw new Error("the browser produced no image");

      const form = new FormData();
      form.append("file", new File([blob], png ? "cropped.png" : "cropped.jpg", { type: blob.type }));
      form.append("folder", "site-images");
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.url) {
        onError(data?.detail ? `The crop didn't save. ${data.detail}` : "The crop didn't save. Please try again.");
        return;
      }
      onCropped(data.url);
    } catch (err) {
      // A photo served from another site without CORS permission taints the
      // canvas, and reading it back throws. Nothing to do but re-upload it.
      const tainted = err instanceof DOMException && err.name === "SecurityError";
      console.warn("[24X7] admin crop failed —", err);
      onError(
        tainted
          ? "This photo is hosted elsewhere and won't allow editing. Upload it from your computer, then crop it."
          : "Couldn't crop that photo. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const cropPx = size
    ? { w: Math.round(rect.w * size.w), h: Math.round(rect.h * size.h) }
    : null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4 backdrop-blur-sm"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="max-h-full w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-surface p-4 shadow-premium-xl sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display flex items-center gap-2 text-lg tracking-[-0.02em]">
            <CropIcon className="size-4.5" /> Crop photo
          </h2>
          <button onClick={onCancel} aria-label="Close" className="grid size-8 place-items-center rounded-lg hover:bg-surface-2">
            <X className="size-4" />
          </button>
        </div>

        {/* The picture at its own shape, with the box drawn over it. */}
        <div
          ref={wrapRef}
          className="relative mx-auto w-fit touch-none select-none overflow-hidden rounded-xl bg-surface-2"
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={cors ? "cors" : "plain"}
            ref={imgRef}
            src={src}
            alt=""
            crossOrigin={cors ? "anonymous" : undefined}
            onLoad={(e) =>
              setSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })
            }
            onError={() => setCors((on) => (on ? false : on))}
            className="block max-h-[52vh] w-auto max-w-full"
            draggable={false}
          />

          {/* Everything outside the box, dimmed — four panels rather than a
              cut-out, which no browser draws consistently. */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute inset-x-0 top-0 bg-ink/45" style={{ height: `${rect.y * 100}%` }} />
            <div className="absolute inset-x-0 bottom-0 bg-ink/45" style={{ height: `${(1 - rect.y - rect.h) * 100}%` }} />
            <div
              className="absolute left-0 bg-ink/45"
              style={{ top: `${rect.y * 100}%`, height: `${rect.h * 100}%`, width: `${rect.x * 100}%` }}
            />
            <div
              className="absolute right-0 bg-ink/45"
              style={{ top: `${rect.y * 100}%`, height: `${rect.h * 100}%`, width: `${(1 - rect.x - rect.w) * 100}%` }}
            />
          </div>

          <div
            onPointerDown={(e) => start("move", e)}
            className="absolute cursor-move ring-2 ring-inset ring-white"
            style={{
              left: `${rect.x * 100}%`,
              top: `${rect.y * 100}%`,
              width: `${rect.w * 100}%`,
              height: `${rect.h * 100}%`,
            }}
          >
            {(["nw", "ne", "sw", "se"] as const).map((h) => (
              <span
                key={h}
                onPointerDown={(e) => start(h, e)}
                className={cn(
                  "absolute size-4 rounded-full border-2 border-royal-bright bg-white",
                  h === "nw" && "-left-2 -top-2 cursor-nwse-resize",
                  h === "ne" && "-right-2 -top-2 cursor-nesw-resize",
                  h === "sw" && "-bottom-2 -left-2 cursor-nesw-resize",
                  h === "se" && "-bottom-2 -right-2 cursor-nwse-resize",
                )}
              />
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted">Shape</span>
          {RATIOS.map((r) => (
            <button
              key={r.label}
              onClick={() => applyAspect(r.value)}
              className={cn(
                "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                aspect === r.value
                  ? "border-royal-bright bg-royal-bright/10 text-royal-bright"
                  : "border-border text-muted hover:text-ink",
              )}
            >
              {r.label}
            </button>
          ))}
          {cropPx && (
            <span className="ml-auto text-xs text-muted-2">
              {cropPx.w} × {cropPx.h} px
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={save}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            {busy ? "Cropping…" : "Use this crop"}
          </button>
          <button
            onClick={() => {
              setAspect(null);
              setRect(FULL);
            }}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-medium text-muted hover:text-ink"
          >
            <RotateCcw className="size-4" /> Whole photo
          </button>
          <button
            onClick={onCancel}
            disabled={busy}
            className="rounded-xl px-3 py-2 text-sm font-medium text-muted hover:text-ink"
          >
            Cancel
          </button>
        </div>

        <p className="mt-3 text-[0.72rem] leading-snug text-muted-2">
          The site shows the saved photo whole — nothing is cropped for you, so what you keep here is
          what visitors see. The original is untouched; crop it again any time.
        </p>
      </div>
    </div>
  );
}

/** Where a handle leaves the box, kept inside the picture and on its ratio. */
function resize(
  handle: Handle,
  from: Rect,
  dx: number,
  dy: number,
  aspect: number | null,
  boxW: number,
  boxH: number,
): Rect {
  if (handle === "move") {
    return {
      ...from,
      x: clamp(from.x + dx, 0, 1 - from.w),
      y: clamp(from.y + dy, 0, 1 - from.h),
    };
  }

  const west = handle === "nw" || handle === "sw";
  const north = handle === "nw" || handle === "ne";

  // The opposite corner stays put; the dragged one moves.
  const anchorX = west ? from.x + from.w : from.x;
  const anchorY = north ? from.y + from.h : from.y;

  let w = clamp(west ? from.w - dx : from.w + dx, MIN, west ? anchorX : 1 - anchorX);
  let h = clamp(north ? from.h - dy : from.h + dy, MIN, north ? anchorY : 1 - anchorY);

  if (aspect !== null) {
    // The ratio is what the eye sees, so it is measured on the displayed
    // picture — the fractions are of different lengths on each axis.
    h = (w * boxW) / (aspect * boxH);
    const roomY = north ? anchorY : 1 - anchorY;
    if (h > roomY) {
      h = roomY;
      w = (h * aspect * boxH) / boxW;
    }
    const roomX = west ? anchorX : 1 - anchorX;
    if (w > roomX) {
      w = roomX;
      h = (w * boxW) / (aspect * boxH);
    }
  }

  return {
    x: west ? anchorX - w : anchorX,
    y: north ? anchorY - h : anchorY,
    w,
    h,
  };
}
