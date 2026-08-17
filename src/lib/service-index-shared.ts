import { SERVICES, type Service } from "./services";

/**
 * The service index on /services — "Eight services. One standard."
 *
 * Three things are stored, and each is a different kind of change:
 *
 *  - an *edit* to a row that ships with the build, keyed by its id. Only the
 *    fields that were touched are kept, so an untouched one keeps following
 *    the code and "reset" can mean exactly that.
 *  - an *addition* — a row that exists only here, and can be deleted outright.
 *  - the section's own *words*: the kicker, the two headline lines and the
 *    paragraph beside them. The headline counts the services out loud, so it
 *    has to be editable the moment a row is added or hidden.
 *
 * The numbering is not stored anywhere: it is the position in the list, so a
 * hidden row closes its gap and an added one carries on from the last.
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

/** A row an admin added. Everything a shipped row has, minus its position. */
export type ServiceIndexAddition = Omit<Service, "no"> & {
  hidden?: boolean;
  /** Orders added rows among themselves. */
  createdAt?: number;
};

/** A row as the panel and the site see it. */
export type ServiceIndexRow = Service & {
  hidden?: boolean;
  /** Added here rather than shipped in the build — deletable. */
  custom?: boolean;
  createdAt?: number;
};

export const SERVICE_INDEX_DEFAULTS = SERVICES;

/** The ids that ship with the build — the rows that reset rather than delete. */
export const BUILT_IN_SERVICE_IDS = new Set(SERVICE_INDEX_DEFAULTS.map((s) => s.id));

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

/** The index is numbered by position, so the list never shows a gap. */
function numbered(rows: ServiceIndexRow[]): ServiceIndexRow[] {
  return rows.map((row, i) => ({ ...row, no: String(i + 1).padStart(2, "0") }));
}

/** The list as the panel has it — hidden rows included, for the panel itself. */
export function mergeServiceIndex(
  edits: ServiceIndexEdits,
  added: (ServiceIndexAddition & { id: string })[] = [],
): ServiceIndexRow[] {
  const builtIn: ServiceIndexRow[] = SERVICE_INDEX_DEFAULTS.map((s) => ({
    ...s,
    ...cleanEdit(edits[s.id]),
    hidden: edits[s.id]?.hidden === true,
  }));
  const extras: ServiceIndexRow[] = [...added]
    .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))
    .map((s) => ({ ...s, no: "", custom: true }));
  return numbered([...builtIn, ...extras]);
}

/** What the site shows. */
export function visibleServiceIndex(all: ServiceIndexRow[]): Service[] {
  return numbered(all.filter((s) => !s.hidden));
}

/* ---------------------------------------------------------------- section */

/** The words around the index. Stored whole — every field has a default. */
export type ServiceIndexCopy = {
  kicker: string;
  /** First headline line, set upright. */
  headline: string;
  /** Second line, set in italics under it. Blank drops the line. */
  headlineAccent: string;
  /** The paragraph opposite the headline. */
  intro: string;
};

export const SERVICE_INDEX_COPY_DEFAULTS: ServiceIndexCopy = {
  kicker: "The work",
  headline: "Eight services.",
  headlineAccent: "One standard.",
  intro:
    "Every job — from a quick microwave fix to a full annual contract — held to the same obsessive bar.",
};

export const SERVICE_INDEX_COPY_FIELDS = [
  "kicker",
  "headline",
  "headlineAccent",
  "intro",
] as const;

/** A stored copy edit over the defaults — a blank field keeps the default. */
export function mergeServiceIndexCopy(edit?: Partial<ServiceIndexCopy> | null): ServiceIndexCopy {
  const out = { ...SERVICE_INDEX_COPY_DEFAULTS };
  for (const key of SERVICE_INDEX_COPY_FIELDS) {
    const value = edit?.[key];
    // headlineAccent is the one line that is allowed to be emptied on purpose.
    if (typeof value !== "string") continue;
    if (value.trim() === "" && key !== "headlineAccent") continue;
    out[key] = value;
  }
  return out;
}

/** A url-safe id from a title, so "Chimney Repair" becomes "chimney-repair". */
export function serviceIndexSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

/** Keeps two rows from sharing an id — "chimney-repair", then "-2", "-3". */
export function uniqueServiceIndexId(title: string, taken: Iterable<string>): string {
  const base = serviceIndexSlug(title) || "service";
  const used = new Set(taken);
  if (!used.has(base)) return base;
  for (let n = 2; n < 100; n += 1) {
    const candidate = `${base}-${n}`;
    if (!used.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}
