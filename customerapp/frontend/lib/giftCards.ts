'use client'

import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore'
import { COL, giftCardSchema, type GiftCard } from '@app/shared'
import { db } from './firebase'

/**
 * The gift cards this customer has bought.
 *
 * Only the buyer's own, because that is all the rules grant — a gift card is
 * fetched by nobody and listed by the person who paid for it. Redeeming goes
 * through `redeemGiftCard`, which claims the card on the server before it
 * credits anything; there is deliberately no client read of a card by code,
 * since a read that succeeds is a code confirmed.
 */
export async function fetchMyGiftCards(uid: string): Promise<GiftCard[]> {
  const snap = await getDocs(
    query(
      collection(db(), COL.giftCards),
      where('purchasedBy', '==', uid),
      orderBy('purchasedAt', 'desc'),
      limit(50)
    )
  )

  const cards: GiftCard[] = []
  for (const document of snap.docs) {
    const parsed = giftCardSchema.safeParse(document.data())
    if (parsed.success) cards.push(parsed.data)
  }
  return cards
}
