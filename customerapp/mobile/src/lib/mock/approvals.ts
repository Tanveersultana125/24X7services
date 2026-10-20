/**
 * Extra work a professional found on the job and is waiting for the
 * customer to approve, by booking id. Kept beside the bookings rather than
 * on them: catalog-v2's Booking is shared with the backend and Member 2, and
 * the approval shape is still the lead's to settle.
 */
export interface ApprovalItem {
  name: string
  /** Paise. */
  price: number
}

export interface MockApproval {
  bookingId: string
  note: string
  items: ApprovalItem[]
  /** Null while waiting for the customer. */
  answer: 'approved' | 'rejected' | null
}

export const APPROVALS: MockApproval[] = [
  {
    bookingId: 'BK1039',
    note: 'The drain pump is blocked and its motor has burnt out. It needs replacing for the machine to drain.',
    items: [
      { name: 'Drain pump (genuine part)', price: 145000 },
      { name: 'Labour for the replacement', price: 30000 },
    ],
    answer: null,
  },
]
