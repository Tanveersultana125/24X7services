import type { Appliance, Brand } from './catalog'

/**
 * The operations model the console runs on. One booking is the same piece of
 * work the customer app calls a booking and the technician app calls a job,
 * so its status list is the customer's lifecycle and its id is what both
 * apps show.
 */

export const BOOKING_FLOW = ['pending_payment', 'confirmed', 'assigned', 'en_route', 'arrived', 'in_progress', 'completed'] as const
export type FlowStatus = (typeof BOOKING_FLOW)[number]
export type BookingStatus = FlowStatus | 'cancelled' | 'refunded'

export type Priority = 'emergency' | 'high' | 'normal'

export const SERVICE_TYPES = ['Repair', 'General service', 'Gas refill', 'Installation', 'Uninstallation', 'Deep cleaning'] as const
export type ServiceType = (typeof SERVICE_TYPES)[number]

export type PayMethod = 'upi' | 'card' | 'cash' | 'wallet'

export interface Customer {
  id: string
  name: string
  phone: string
  email: string
  area: string
  address: string
  joinedAt: string
  status: 'active' | 'blocked'
  addresses: { label: string; line: string }[]
  referralCode: string
  referrals: number
  walletCredit: number
}

export type KycStatus = 'verified' | 'pending' | 'rejected' | 'suspended'
export type Presence = 'online' | 'on_job' | 'offline'

export interface Technician {
  id: string
  name: string
  phone: string
  email: string
  area: string
  lat: number
  lng: number
  experienceYears: number
  rating: number
  ratingCount: number
  completedJobs: number
  brands: Brand[]
  appliances: Appliance[]
  presence: Presence
  kyc: KycStatus
  joinedAt: string
  acceptanceRate: number
  onTimeRate: number
  /** Cash collected on site and not yet deposited at the hub. */
  cashInHand: number
  /** Shares live location with dispatch while on shift. */
  tracking: boolean
  workingHours: { days: string; start: string; end: string }
  radiusKm: number
  /** Which onboarding documents are on file. */
  docs: { aadhaar: boolean; pan: boolean; bank: boolean; training: boolean; police: boolean }
}

export interface TimelineEntry {
  status: BookingStatus
  at: string
  note?: string
}

export interface Booking {
  id: string
  customerId: string
  technicianId?: string
  brand: Brand
  appliance: Appliance
  service: ServiceType
  issue: string
  priority: Priority
  status: BookingStatus
  createdAt: string
  scheduledAt: string
  area: string
  address: string
  lat: number
  lng: number
  amount: number
  paid: boolean
  method: PayMethod | null
  coupon?: string
  discount: number
  rating?: number
  cancelReason?: string
  timeline: TimelineEntry[]
}

export interface Payout {
  id: string
  technicianId: string
  period: string
  jobs: number
  gross: number
  commission: number
  status: 'pending' | 'processing' | 'paid'
  at: string
}

export interface TicketMessage {
  from: 'user' | 'agent' | 'system'
  text: string
  at: string
}

export type TicketStatus = 'open' | 'in_progress' | 'resolved'
export type TicketPriority = 'urgent' | 'high' | 'normal' | 'low'

export interface Ticket {
  id: string
  side: 'customer' | 'technician'
  personId: string
  subject: string
  category: string
  priority: TicketPriority
  status: TicketStatus
  createdAt: string
  bookingId?: string
  assignee?: string
  messages: TicketMessage[]
}

export interface Review {
  id: string
  bookingId: string
  customerId: string
  technicianId: string
  rating: number
  text: string
  at: string
  status: 'published' | 'flagged' | 'hidden'
}

export interface Coupon {
  code: string
  description: string
  kind: 'flat' | 'percent'
  value: number
  minOrder: number
  used: number
  limit: number
  active: boolean
  expires: string
  /** Offer fields; older coupons without them read as a plain coupon on everything. */
  type?: OfferType
  title?: string
  image?: string
  maxDiscount?: number
  start?: string
  brand?: Brand | 'all'
  appliance?: Appliance | 'all'
}

export const OFFER_TYPES = ['percentage', 'fixed', 'first_booking', 'emergency', 'brand', 'service', 'seasonal'] as const
export type OfferType = (typeof OFFER_TYPES)[number]

export interface Broadcast {
  id: string
  audience: 'customers' | 'technicians' | 'all'
  title: string
  body: string
  at: string
  reach: number
}

export type ActivityKind = 'booking' | 'dispatch' | 'payment' | 'technician' | 'customer' | 'support' | 'system'

export interface Activity {
  id: string
  kind: ActivityKind
  text: string
  at: string
  actor: string
}

export interface ServiceArea {
  pincode: string
  area: string
  active: boolean
}

export interface TeamMember {
  name: string
  email: string
  role: 'Super admin' | 'Operations' | 'Dispatcher' | 'Finance' | 'Support'
  lastActive: string
}

export interface AdminSettings {
  labour: Record<Appliance, number>
  /** Which brand × appliance pairs customers can book. */
  matrix: Record<Brand, Record<Appliance, boolean>>
  emergencySurcharge: number
  commissionPct: number
  gstPct: number
  autoAssign: boolean
  emergencySlaMin: number
  areas: ServiceArea[]
  team: TeamMember[]
}

/* ===================================================================
   Control centre — roles, audit, AI, content and the published catalog
   =================================================================== */

/** Every area of the console a role can be granted. */
export const MODULES = [
  'dashboard', 'dispatch', 'bookings', 'support', 'customers', 'reviews', 'promotions', 'technicians',
  'payouts', 'payments', 'catalog', 'reports', 'ai', 'content', 'admins', 'audit', 'settings',
] as const
export type Module = (typeof MODULES)[number]

export const PERMS = ['view', 'create', 'edit', 'delete', 'approve', 'publish', 'assign', 'export'] as const
export type Perm = (typeof PERMS)[number]

export const ADMIN_ROLES = ['Super Admin', 'Operations Admin', 'Finance Admin', 'Content Admin', 'Support Admin'] as const
export type AdminRole = (typeof ADMIN_ROLES)[number]

export type RoleMatrix = Record<AdminRole, Partial<Record<Module, Perm[]>>>

export interface AdminUser {
  id: string
  name: string
  email: string
  phone: string
  role: AdminRole
  status: 'active' | 'invited' | 'disabled'
  twoFactor: boolean
  lastActive: string
  createdAt: string
}

/** One accountable change: who, where, what it was, what it became. Never edited. */
export interface AuditEntry {
  id: string
  at: string
  admin: string
  role: AdminRole | 'System'
  module: Module
  action: string
  target?: string
  old?: string
  new?: string
}

/* ------------------------------------------------------------------ AI */

export interface AiChatConfig {
  enabled: boolean
  name: string
  avatar: string
  welcome: string
  quickQuestions: string[]
  instructions: string
  brands: Brand[]
  appliances: Appliance[]
  techRules: string
  safety: string
  tone: 'Friendly' | 'Professional' | 'Concise'
  handoff: boolean
}

export interface AiCallConfig {
  enabled: boolean
  name: string
  voice: string
  language: string
  greeting: string
  scripts: { confirm: string; eta: string; followup: string; reschedule: string; escalation: string }
  maxDurationMin: number
  callingHours: { start: string; end: string }
  recording: { enabled: boolean; consent: boolean; retentionDays: number }
  summary: { auto: boolean; attachToBooking: boolean; notifyTechnician: boolean; format: 'Short' | 'Detailed' }
}

export const CALL_PURPOSES = ['Appointment confirmation', 'ETA update', 'Location confirmation', 'Service follow-up', 'Rescheduling', 'Escalation'] as const
export type CallPurpose = (typeof CALL_PURPOSES)[number]

export interface AiCallLog {
  id: string
  bookingId: string
  customerId: string
  technicianId?: string
  purpose: CallPurpose
  at: string
  durationSec: number
  status: 'completed' | 'no_answer' | 'escalated' | 'failed' | 'voicemail'
  sentiment: 'positive' | 'neutral' | 'negative'
  summary: string
  outcome: string
  recording: boolean
  transcript: { who: 'ai' | 'customer'; text: string; t: number }[]
}

/* -------------------------------------------------------------- Content */

export const MEDIA_CATEGORIES = ['service', 'brand', 'banner', 'promotion', 'icon', 'other'] as const
export type MediaCategory = (typeof MEDIA_CATEGORIES)[number]

export interface MediaItem {
  id: string
  name: string
  category: MediaCategory
  url: string
  size: number
  width: number
  height: number
  alt: string
  uploadedAt: string
  uploadedBy: string
}

export interface HomeSection {
  visible: boolean
  title: string
  body: string
}

export interface HomepageContent {
  heroHeading: string
  heroSub: string
  cta: string
  heroImage: string
  services: HomeSection
  promo: HomeSection
  trust: HomeSection
  faq: HomeSection
}

export interface Banner {
  id: string
  image: string
  heading: string
  sub: string
  cta: string
  link: string
  placement: 'Home hero' | 'Home strip' | 'Offers page'
  start: string
  end: string
  enabled: boolean
}

export interface Faq {
  id: string
  q: string
  a: string
  category: string
  visible: boolean
}

export interface Testimonial {
  id: string
  name: string
  area: string
  appliance: string
  rating: number
  text: string
  visible: boolean
}

/** Everything the customer app shows that is not a booking. Edited as a draft, then published. */
export interface SiteContent {
  homepage: HomepageContent
  banners: Banner[]
  serviceImages: Record<Appliance, string>
  brandLogos: Record<Brand, { url: string; enabled: boolean }>
  faqs: Faq[]
  testimonials: Testimonial[]
}

/* -------------------------------------------------------------- Catalog */

export interface ServiceDef {
  name: string
  description: string
  image: string
  enabled: boolean
  types: { name: string; price: number; enabled: boolean }[]
}

export interface BrandDef {
  name: string
  logo: string
  image: string
  tagline: string
  enabled: boolean
}

export interface PriceRow {
  normal: number
  emergency: number
}

export interface Pricing {
  /** Base price customers see for each brand × appliance. */
  rows: Record<Brand, Record<Appliance, PriceRow>>
  visitCharge: number
  labour: Record<Appliance, number>
  emergencyCharge: number
  taxPct: number
  platformFee: number
  cancellationFee: number
  additionalCharge: number
}

export interface EmergencyPolicy {
  enabled: boolean
  surcharge: number
  nightSurcharge: number
  nightFrom: string
  nightTo: string
  slaMin: number
  maxRadiusKm: number
}

/** The service catalogue, as a draft the admin edits and the version customers see. */
export interface Catalog {
  services: Record<Appliance, ServiceDef>
  brands: Record<Brand, BrandDef>
  pricing: Pricing
  emergency: EmergencyPolicy
}
