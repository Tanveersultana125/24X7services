"use client";

import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { GALLERY, type GalleryItem } from "@/lib/admin/data";

export function GalleryManager() {
  const [items, setItems] = useState<GalleryItem[]>(GALLERY);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ src: "", label: "", category: "AC" });

  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const add = () => {
    if (!draft.src.trim()) return;
    setItems((prev) => [
      { id: `G${Date.now()}`, src: draft.src.trim(), label: draft.label.trim() || "Untitled", category: draft.category },
      ...prev,
    ]);
    setDraft({ src: "", label: "", category: "AC" });
    setAdding(false);
  };

  return (
    <div>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-[-0.02em]">Gallery</h1>
          <p className="mt-1 text-sm text-muted">Manage the work photos shown on the site.</p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <Plus className="size-4" /> Add photo
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
              className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-white/90 text-danger opacity-0 shadow-premium-sm backdrop-blur transition-opacity hover:bg-white group-hover:opacity-100"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted">Changes are in-memory for now — reset on refresh. Wire to a database + Cloudinary to persist.</p>

      {/* Add modal */}
      {adding && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4" onClick={() => setAdding(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-premium-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-medium">Add photo</h2>
              <button onClick={() => setAdding(false)} aria-label="Close"><X className="size-5 text-muted" /></button>
            </div>
            <div className="mt-4 space-y-3">
              <Input label="Image URL (Cloudinary or /work/…)" value={draft.src} onChange={(v) => setDraft({ ...draft, src: v })} placeholder="https://res.cloudinary.com/…" />
              <Input label="Label" value={draft.label} onChange={(v) => setDraft({ ...draft, label: v })} placeholder="AC installation" />
              <label className="block">
                <span className="text-xs font-medium text-muted">Category</span>
                <select
                  value={draft.category}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-royal-bright"
                >
                  {["AC", "Refrigerator", "Washing Machine", "Microwave", "Oven"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
              {draft.src && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draft.src} alt="preview" className="aspect-[4/3] w-full rounded-lg border border-border object-cover" />
              )}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setAdding(false)} className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-surface-2">Cancel</button>
              <button onClick={add} disabled={!draft.src.trim()} className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">Add</button>
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
