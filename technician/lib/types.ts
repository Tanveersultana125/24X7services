import type { Appliance, Brand, Condition } from './catalog'

/**
 * A job's life, in the order the technician moves it. `request` is an offer
 * nobody has taken yet; everything from `assigned` on is this technician's.
 */
export const FLOW = [
  'assigned',
  'accepted',
  'on_the_way',
  'arrived',
  'diagnosis',
  'repair',
  'repaired',
  'confirmation',
  'closed',
] as const
export type FlowStep = (typeof FLOW)[number]

export type JobStatus = 'request' | FlowStep | 'cancelled' | 'rejected'

export type Priority = 'emergency' | 'high' | 'normal'

export type ServiceType =
  | 'Repair'
  | 'General service'
  | 'Gas refill'
  | 'Installation'
  | 'Uninstallation'
  | 'Deep cleaning'

export interface Customer {
  name: string
  phone: string
  address: string
  landmark?: string
  area: string
  lat: number
  lng: number
}

export interface PartLine {
  sku: string
  name: string
  qty: number
  price: number
  inVan: boolean
}

export interface Diagnosis {
  condition: Condition
  problem: string
  category: string
  repair: string
  notes: string
  estimate: number
}

export type PhotoKind = 'appliance' | 'damaged' | 'before' | 'after'

export interface Photo {
  id: string
  kind: PhotoKind
  url: string
}

export type PaymentMethod = 'cash' | 'online'

export interface Bill {
  labour: number
  additional: number
  additionalNote: string
  paid: boolean
  method: PaymentMethod | null
}

export interface Confirmation {
  signature: string
  rating: number
  review: string
  at: string
}

export interface Job {
  id: string
  customer: Customer
  appliance: Appliance
  brand: Brand
  model?: string
  service: ServiceType
  issue: string
  customerNote?: string
  priority: Priority
  status: JobStatus
  requestedAt: string
  scheduledAt: string
  distanceKm: number
  etaMin: number
  durationMin: number
  estFee: number
  /** When each step happened. */
  log: Partial<Record<FlowStep, string>>
  diagnosis?: Diagnosis
  parts: PartLine[]
  photos: Photo[]
  bill?: Bill
  confirmation?: Confirmation
  cancelReason?: string
  /** Final amount for closed jobs that pre-date this session. */
  amount?: number
}

export type NotificationKind =
  | 'request'
  | 'assigned'
  | 'customer'
  | 'schedule'
  | 'cancelled'
  | 'emergency'
  | 'payment'
  | 'rating'

export interface Notice {
  id: string
  kind: NotificationKind
  title: string
  body: string
  at: string
  read: boolean
  jobId?: string
}

export interface Technician {
  name: string
  id: string
  phone: string
  email: string
  photo: string
  area: string
  base: string
  experienceYears: number
  rating: number
  ratingCount: number
  completedJobs: number
  joined: string
  brands: Brand[]
  appliances: string[]
}

export interface Settings {
  shiftStart: string
  shiftEnd: string
  radiusKm: number
  language: 'English' | 'हिन्दी' | 'తెలుగు' | 'اردو'
  notify: {
    requests: boolean
    emergency: boolean
    schedule: boolean
    payments: boolean
    sound: boolean
  }
  upi: string
  bank: string
  fingerprint: boolean
  passwordChangedAt: string
  /** Other phones signed in to this account; this device is always listed first. */
  devices: { id: string; name: string; lastActive: string }[]
}
