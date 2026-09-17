/**
 * Everything that changes when the app is renamed. Nothing else in the codebase
 * should contain the product name as a literal.
 */

export const brand = {
  /** DECISION NEEDED: confirm the trading name before the Play Store listing. */
  name: '24X7',
  fullName: '24X7 Services',
  tagline: 'Home appliance repair, done right',

  /** A text wordmark, not an image — see BRAND_LOGOS_ENABLED below. */
  wordmark: '24X7',

  /** DECISION NEEDED: must match the Play Console package before first upload. */
  androidAppId: 'com.twentyfourseven.services',

  supportEmail: 'support@example.com',
} as const

/**
 * Supported brands appear as text wordmarks, never as logos.
 *
 * DECISION NEEDED: this flips to true only once an authorised partner
 * agreement exists. Using a manufacturer's logo without one implies an
 * endorsement the business does not have.
 */
export const BRAND_LOGOS_ENABLED = false

/**
 * Shown wherever manufacturer names appear: the Brand step, the Trusted Brands
 * row on Home, and the About section.
 */
export const BRAND_DISCLAIMER =
  'Independent service provider. Not affiliated with or endorsed by LG, Samsung, Bosch or IFB. Brand names are used only to identify appliances we service.'

/**
 * Shown on the Appliance Details step. A third-party repair can void a
 * manufacturer warranty, and the customer needs to know that before booking,
 * not after.
 */
export const MANUFACTURER_WARRANTY_NOTICE =
  'If your appliance is still under manufacturer warranty, a third-party repair may affect that warranty. Please check with the manufacturer first.'

/**
 * The promises the app repeats across screens. Deliberately free of anything
 * absolute — no guarantees, no percentages nobody measures.
 */
export const TRUST_POINTS = [
  { key: 'pricing', label: 'Transparent pricing' },
  { key: 'verified', label: 'Verified technicians' },
  { key: 'no-hidden', label: 'No hidden charges' },
  { key: 'approval', label: 'Repairs only after your approval' },
  { key: 'warranty', label: 'Service warranty' },
  { key: 'invoice', label: 'Digital GST invoice' },
  { key: 'support', label: '24x7 support' },
] as const
