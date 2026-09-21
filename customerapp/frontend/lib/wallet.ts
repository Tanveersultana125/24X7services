'use client'

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
} from 'firebase/firestore'
import {
  COL,
  SUB,
  EMPTY_WALLET,
  walletEntrySchema,
  walletSchema,
  type Wallet,
  type WalletEntry,
} from '@app/shared'
import { db } from './firebase'

/**
 * Reading a customer's credits.
 *
 * Read-only by design: the rules grant the owner a get on their own wallet and
 * a capped list of the ledger under it, and grant nobody a write. Credits move
 * only inside a server transaction, so there is no client-side mutation here
 * to go looking for.
 */

/** How much of the statement one screen asks for. */
export const LEDGER_PAGE = 50

/**
 * A customer who has never been given credits has no wallet document, and that
 * is not an error — it is a zero balance. Returning the empty wallet rather
 * than null keeps the caller from having to spell that out at every use.
 */
export async function fetchWallet(uid: string): Promise<Wallet> {
  const snap = await getDoc(doc(db(), COL.wallets, uid))
  if (!snap.exists()) return EMPTY_WALLET

  const parsed = walletSchema.safeParse(snap.data())
  // A wallet that does not parse is shown as empty rather than as a crash. The
  // ledger underneath it still renders, so the customer sees the credits they
  // were given even on the day the balance field is the thing that broke.
  return parsed.success ? parsed.data : EMPTY_WALLET
}

/** The statement, newest first. Rows that do not parse are dropped, not shown. */
export async function fetchLedger(uid: string): Promise<WalletEntry[]> {
  const snap = await getDocs(
    query(
      collection(db(), COL.wallets, uid, SUB.ledger),
      orderBy('createdAt', 'desc'),
      limit(LEDGER_PAGE)
    )
  )

  const rows: WalletEntry[] = []
  for (const document of snap.docs) {
    const parsed = walletEntrySchema.safeParse({
      id: document.id,
      ...document.data(),
    })
    if (parsed.success) rows.push(parsed.data)
  }
  return rows
}
