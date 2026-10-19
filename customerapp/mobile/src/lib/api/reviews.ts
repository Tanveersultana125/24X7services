import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from 'firebase/firestore'
import { COL, reviewSchema, type Review } from '@app/shared'

import { db } from '@/lib/firebase'

/** A review by id, or null when it is missing or does not parse. */
export async function fetchReview(reviewId: string): Promise<Review | null> {
  const snap = await getDoc(doc(db(), COL.reviews, reviewId))
  const parsed = reviewSchema.safeParse({ id: snap.id, ...snap.data() })
  return parsed.success ? parsed.data : null
}

/**
 * The last hundred reviews this customer left, newest first. Rows that fail
 * the schema are dropped and the rest are kept.
 */
export async function fetchMyReviews(uid: string): Promise<Review[]> {
  const snap = await getDocs(
    query(collection(db(), COL.reviews), where('uid', '==', uid), orderBy('createdAt', 'desc'), limit(100))
  )
  const reviews: Review[] = []
  for (const document of snap.docs) {
    const parsed = reviewSchema.safeParse({ id: document.id, ...document.data() })
    if (parsed.success) reviews.push(parsed.data)
  }
  return reviews
}
