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
}

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
