/**
 * Firestore collection paths and Storage paths, in one place. The rules file,
 * the seed, the functions and the frontend services all point at the same
 * strings, so a renamed collection cannot half-land.
 */

export const COL = {
  catalogAppliances: 'catalogAppliances',
  catalogServices: 'catalogServices',
  catalogBrands: 'catalogBrands',
  brandApplianceMatrix: 'brandApplianceMatrix',
  catalogIssues: 'catalogIssues',
  diagnosisRules: 'diagnosisRules',
  banners: 'banners',
  popularServices: 'popularServices',
  serviceAreas: 'serviceAreas',
  searchIndex: 'searchIndex',
  config: 'config',
  users: 'users',
  technicians: 'technicians',
  technicianPublic: 'technicianPublic',
  slots: 'slots',
  bookings: 'bookings',
  tracking: 'tracking',
  invoices: 'invoices',
  /** One per customer, keyed by uid, with the ledger underneath it. */
  wallets: 'wallets',
  warranties: 'warranties',
  reviews: 'reviews',
  supportTickets: 'supportTickets',
  waitlist: 'waitlist',
  notifications: 'notifications',
  counters: 'counters',
  processedWebhookEvents: 'processedWebhookEvents',
} as const

export const SUB = {
  addresses: 'addresses',
  appliances: 'appliances',
  events: 'events',
  repairRequests: 'repairRequests',
  private: 'private',
  messages: 'messages',
  items: 'items',
  ledger: 'ledger',
} as const

export const DOC = {
  businessConfig: 'business',
  privateConfig: 'private',
  otp: 'otp',
  invoiceCounter: 'invoice',
  bookingCounter: 'booking',
} as const

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

export const storagePaths = {
  /** Issue photos and video attached to a booking. */
  bookingMedia(uid: string, bookingId: string, fileName: string): string {
    return `users/${uid}/bookings/${bookingId}/${fileName}`
  },
  /** Photo of the model sticker on a saved appliance. */
  applianceMedia(uid: string, fileName: string): string {
    return `users/${uid}/appliances/${fileName}`
  },
  /** Attachments on a support message. */
  supportMedia(uid: string, ticketId: string, fileName: string): string {
    return `users/${uid}/support/${ticketId}/${fileName}`
  },
  /** Generated GST invoice PDF. Written by functions, read by the owner. */
  invoice(uid: string, invoiceId: string): string {
    return `users/${uid}/invoices/${invoiceId}.pdf`
  },
  /**
   * Media the customer attached before signing in has no uid yet. It is staged
   * here by the client and moved under the user once `createBooking` returns.
   */
  draftMedia(uid: string, fileName: string): string {
    return `users/${uid}/drafts/${fileName}`
  },
} as const
