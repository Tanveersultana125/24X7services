import { SERVICES, type Service } from "./services";

/**
 * Changes an admin has made to the eight-service index on /services.
 *
 * The list itself stays in the code — its order, its numbering and which
 * appliance each row books are design, not content. What can be changed is
 * what a row says, what it costs, the photo behind it, and whether it is
 * shown at all. Only the changes are stored, so an untouched field keeps
 * following the code.
 */

export type ServiceIndexEdit = {
  title?: string;
  desc?: string;
  price?: string;
  eta?: string;
  tags?: string[];
  image?: string;
  hidden?: boolean;
};

export type ServiceIndexEdits = Record<string, ServiceIndexEdit>;

export const SERVICE_INDEX_DEFAULTS = SERVICES;

/** Drops empty values, so a blank field means "leave the code's version". */
export function cleanEdit(edit: ServiceIndexEdit | undefined): ServiceIndexEdit {
  if (!edit) return {};
  const out: ServiceIndexEdit = {};
  for (const [key, value] of Object.entries(edit)) {
    if (typeof value === "string" && value.trim() === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;
    if (value === undefined || key === "hidden") continue;
    (out as Record<string, unknown>)[key] = value;
  }
  return out;
}

/** The list as the panel has it — hidden rows included, for the panel itself. */
export function mergeServiceIndex(edits: ServiceIndexEdits): (Service & { hidden?: boolean })[] {
  return SERVICE_INDEX_DEFAULTS.map((s) => ({
    ...s,
    ...cleanEdit(edits[s.id]),
    hidden: edits[s.id]?.hidden === true,
  }));
}

/** What the site shows. */
export function visibleServiceIndex(all: (Service & { hidden?: boolean })[]): Service[] {
  return all.filter((s) => !s.hidden);
}
