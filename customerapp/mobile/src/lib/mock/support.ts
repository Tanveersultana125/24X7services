/**
 * The demo customer's support conversations. Shaped for the support screens;
 * the backend swap replaces it with the tickets collection and its messages.
 */

export interface MockMessage {
  id: string
  from: 'customer' | 'agent'
  text: string
  /** ISO 8601. */
  at: string
}

export interface MockTicket {
  id: string
  /** A SUPPORT_TOPICS id. */
  topicId: string
  subject: string
  bookingId?: string
  status: 'open' | 'resolved'
  messages: MockMessage[]
  /** ISO 8601. */
  updatedAt: string
}

export const TICKETS: MockTicket[] = [
  {
    id: 'T-2041',
    topicId: 'payments',
    subject: 'Refund for kitchen cleaning',
    bookingId: 'BK0930',
    status: 'resolved',
    updatedAt: '2026-09-21T11:05:00+05:30',
    messages: [
      { id: 'm1', from: 'customer', text: 'My kitchen cleaning was cancelled. When will I get my money back?', at: '2026-09-20T09:40:00+05:30' },
      { id: 'm2', from: 'agent', text: 'Sorry about the cancellation. The full ₹1,348 has been refunded to your UPI; it can take 3–5 working days to show.', at: '2026-09-20T09:52:00+05:30' },
      { id: 'm3', from: 'customer', text: 'Got it today, thanks.', at: '2026-09-21T11:00:00+05:30' },
      { id: 'm4', from: 'agent', text: 'Glad it reached you. Closing this ticket now.', at: '2026-09-21T11:05:00+05:30' },
    ],
  },
]
