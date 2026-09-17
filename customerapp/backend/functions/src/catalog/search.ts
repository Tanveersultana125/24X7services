import { z } from 'zod'
import {
  applianceIdSchema,
  COL,
  serviceKeySchema,
  type SearchHit,
} from '@app/shared'
import { db } from '../lib/admin'
import { defineCallable } from '../lib/callable'

/**
 * Search over the denormalised `searchIndex` — one row per appliance, service
 * and issue.
 *
 * The whole index is read into memory and matched there rather than queried.
 * Firestore can only match a token exactly (`array-contains-any`), which means
 * "fri" finds nothing until the customer has typed "fridge" — and a search box
 * that stays empty for the first five keystrokes reads as broken. The index is
 * around seventy rows and changes when the catalog is reseeded, so one read
 * every few minutes buys prefix matching for every keystroke after it.
 *
 * If the catalog ever grows past a few hundred rows this stops being the right
 * trade and search belongs in a real index.
 */

const indexRowSchema = z.object({
  kind: z.enum(['appliance', 'service', 'issue']),
  applianceId: applianceIdSchema,
  serviceKey: serviceKeySchema.optional(),
  issueId: z.string().optional(),
  label: z.string().min(1),
  sublabel: z.string().optional(),
  href: z.string().startsWith('/'),
  tokens: z.array(z.string()),
})
type IndexRow = z.infer<typeof indexRowSchema>

/** How long a warm instance may serve the index it already has. */
const CACHE_TTL_MS = 5 * 60 * 1000

const MAX_HITS = 20

let cache: { rows: IndexRow[]; loadedAt: number } | undefined

async function loadIndex(): Promise<IndexRow[]> {
  if (cache && Date.now() - cache.loadedAt < CACHE_TTL_MS) return cache.rows

  const snap = await db().collection(COL.searchIndex).get()
  const rows: IndexRow[] = []
  for (const doc of snap.docs) {
    const parsed = indexRowSchema.safeParse(doc.data())
    // A malformed row is skipped rather than failing the search. One bad seed
    // entry should not take the whole search box down.
    if (parsed.success) rows.push(parsed.data)
  }

  cache = { rows, loadedAt: Date.now() }
  return rows
}

/**
 * Split what was typed into terms. Single letters are kept, unlike in the
 * index's own tokens — a lone letter is a useless token but a perfectly good
 * prefix while someone is still typing.
 */
function terms(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

/** Appliances are the broadest answer, so they lead where scores tie. */
const KIND_WEIGHT: Record<IndexRow['kind'], number> = {
  appliance: 2,
  service: 1,
  issue: 0,
}

function scoreRow(row: IndexRow, queryTerms: string[]): number {
  const label = row.label.toLowerCase()
  let score = KIND_WEIGHT[row.kind]

  for (const term of queryTerms) {
    let best = 0
    for (const token of row.tokens) {
      if (token === term) {
        best = Math.max(best, 3)
      } else if (token.startsWith(term)) {
        best = Math.max(best, 2)
      }
    }
    // "not cooling" is a phrase in the label, not a token in it.
    if (best === 0 && label.includes(term)) best = 1

    // Every term has to land somewhere, or this is not the row being asked for.
    if (best === 0) return 0
    score += best
  }

  return score
}

export const searchCatalog = defineCallable('searchCatalog', async ({ q }) => {
  const queryTerms = terms(q)
  if (queryTerms.length === 0) return { hits: [] }

  const rows = await loadIndex()

  const scored: Array<{ row: IndexRow; score: number }> = []
  for (const row of rows) {
    const score = scoreRow(row, queryTerms)
    if (score > 0) scored.push({ row, score })
  }

  scored.sort(
    (a, b) => b.score - a.score || a.row.label.localeCompare(b.row.label)
  )

  // An absent optional is left off the object rather than set to undefined.
  // The callable encoder turns an undefined value into a JSON null, and the
  // shared schema's `.optional()` rejects null on the way back in — which would
  // fail every search that returned an appliance, on the client, after the
  // server had done all the work.
  const hits: SearchHit[] = scored.slice(0, MAX_HITS).map(({ row }) => ({
    kind: row.kind,
    applianceId: row.applianceId,
    ...(row.serviceKey === undefined ? {} : { serviceKey: row.serviceKey }),
    ...(row.issueId === undefined ? {} : { issueId: row.issueId }),
    label: row.label,
    ...(row.sublabel === undefined ? {} : { sublabel: row.sublabel }),
    href: row.href,
  }))

  return { hits }
})
