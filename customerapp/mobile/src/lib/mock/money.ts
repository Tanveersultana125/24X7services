/**
 * The demo customer's wallet, the Plus plans on sale, their referral code and
 * the reviews they have written. Shaped for the account screens; the backend
 * swap replaces each with its Firestore collection.
 */

export interface WalletEntry {
  id: string
  /** Paise; positive is money in, negative is money spent. */
  amount: number
  title: string
  detail: string
  /** ISO 8601. */
  at: string
}

export const WALLET = {
  /** Paise. */
  balance: 32500,
  entries: [
    { id: 'w5', amount: 25000, title: 'Referral reward', detail: 'Rahul booked his first service', at: '2026-10-12T18:20:00+05:30' },
    { id: 'w4', amount: -22000, title: 'Used on booking #BK0987', detail: 'Full arms + full legs waxing', at: '2026-10-03T12:00:00+05:30' },
    { id: 'w3', amount: 13500, title: 'Refund for #BK0930', detail: 'Kitchen deep cleaning, cancelled', at: '2026-09-20T10:00:00+05:30' },
    { id: 'w2', amount: 10000, title: 'Welcome credit', detail: 'For joining', at: '2026-09-01T09:00:00+05:30' },
    { id: 'w1', amount: 6000, title: 'Cashback', detail: 'Paid with UPI on #BK0961', at: '2026-09-28T13:15:00+05:30' },
  ] as WalletEntry[],
}

export interface PlusPlan {
  id: string
  name: string
  /** Paise. */
  price: number
  /** Paise, struck through beside the price. */
  compareAt?: number
  days: number
  /** What it adds over the free account. */
  benefits: string[]
  /** "Annual cover" plans sit under Plus too, as the lead asked (Plans merged into Plus). */
  kind: 'membership' | 'cover'
}

export const PLUS_PLANS: PlusPlan[] = [
  { id: 'plus-3m', name: 'Plus · 3 months', price: 29900, compareAt: 44900, days: 90, kind: 'membership', benefits: ['15% off every booking', 'No booking fee', 'Priority slots'] },
  { id: 'plus-12m', name: 'Plus · 12 months', price: 89900, compareAt: 179600, days: 365, kind: 'membership', benefits: ['15% off every booking', 'No booking fee', 'Priority slots', 'A named support contact'] },
  { id: 'cover-ac', name: 'AC annual cover', price: 249900, compareAt: 359600, days: 365, kind: 'cover', benefits: ['3 services a year', 'Free gas top-up once', '10% off repairs'] },
  { id: 'cover-home', name: 'Home cleaning cover', price: 399900, days: 365, kind: 'cover', benefits: ['4 bathroom cleanings', '2 kitchen cleanings', 'Free rescheduling'] },
]

export const REFERRAL = {
  code: 'AISHA250',
  /** Paise, for each friend whose first booking is finished. */
  reward: 25000,
  invited: [
    { name: 'Rahul V.', status: 'rewarded' as const, at: '2026-10-12' },
    { name: 'Priya S.', status: 'joined' as const, at: '2026-10-16' },
  ],
}

export interface MyReview {
  bookingId: string
  serviceName: string
  rating: number
  comment: string
  /** ISO 8601. */
  at: string
}

export const MY_REVIEWS: MyReview[] = [
  { bookingId: 'BK0987', serviceName: 'Full arms + full legs waxing', rating: 5, comment: 'Neha was on time and very careful. Will book again.', at: '2026-10-05T20:10:00+05:30' },
]
