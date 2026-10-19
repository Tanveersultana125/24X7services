import { getDocs, type Query } from 'firebase/firestore'
import type { z } from 'zod'

/** Reads a query and keeps the rows that parse, dropping any that drifted. */
export async function readAll<S extends z.ZodTypeAny>(
  q: Query,
  schema: S
): Promise<z.infer<S>[]> {
  const snap = await getDocs(q)
  const rows: z.infer<S>[] = []
  for (const document of snap.docs) {
    const parsed = schema.safeParse({ id: document.id, ...document.data() })
    if (parsed.success) rows.push(parsed.data)
  }
  return rows
}
