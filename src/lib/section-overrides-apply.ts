import type { SectionOverride } from "@/lib/section-overrides-shared";

/**
 * An override only replaces what it actually sets.
 *
 * Firestore holds absent fields as undefined and cleared ones as "", and
 * spreading either over a built-in card would blank a title nobody edited —
 * so both are dropped before the merge. `hidden` is handled by the caller.
 */
export function clean(override: SectionOverride | undefined): Record<string, string | number> {
  if (!override) return {};
  const out: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(override)) {
    if (key === "hidden") continue;
    if (typeof value === "string" && value.trim()) out[key] = value;
    if (typeof value === "number" && value) out[key] = value;
  }
  return out;
}
