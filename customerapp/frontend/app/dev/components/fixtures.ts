import type {
  Address,
  Banner,
  CatalogPlan,
  BookingEvent,
  CatalogAppliance,
  CatalogBrand,
  CatalogService,
  Invoice,
  MediaLimits,
  PriceBreakdown,
  Review,
  SlotOption,
  TechnicianPublic,
  UserPlan,
  Warranty,
} from '@app/shared'

/**
 * Sample data for the component library only. It never ships to a screen — the
 * real components are fed from Firestore — but it has to be shaped exactly like
 * what Firestore returns, or the preview stops being evidence that the
 * components work.
 */

const day = 24 * 60 * 60 * 1000

export const appliance: CatalogAppliance = {
  id: 'washing-machine',
  name: 'Washing Machine',
  image: '/appliances/washing-machine.svg',
  order: 1,
  active: true,
  detailFields: [
    {
      key: 'type',
      label: 'Machine type',
      kind: 'select',
      options: ['front-load', 'top-load', 'semi-automatic'],
      required: true,
    },
  ],
}

export const service: CatalogService = {
  id: 'washing-machine_repair',
  applianceId: 'washing-machine',
  serviceKey: 'repair',
  name: 'Washing Machine Repair',
  description:
    'Not draining, not spinning, leaking or throwing an error code. The expert inspects it and quotes the repair before touching anything.',
  visitFee: 29900,
  startingPrice: 49900,
  durationMinutes: 60,
  rating: 4.8,
  reviewCount: 2140,
  order: 1,
  active: true,
  video: '/services/washing-machine-repair.mp4',
  poster: '/services/washing-machine-repair.jpg',
}

export const brands: CatalogBrand[] = [
  {
    id: 'lg',
    name: 'LG',
    wordmark: 'LG',
    logo: '/brands/lg.svg',
    active: true,
    order: 1,
  },
  {
    id: 'samsung',
    name: 'Samsung',
    wordmark: 'SAMSUNG',
    logo: '/brands/samsung.svg',
    active: true,
    order: 2,
  },
  {
    id: 'bosch',
    name: 'Bosch',
    wordmark: 'BOSCH',
    logo: '/brands/bosch.svg',
    active: true,
    order: 3,
  },
  {
    id: 'ifb',
    name: 'IFB',
    wordmark: 'IFB',
    logo: '/brands/ifb.png',
    active: true,
    order: 4,
  },
]

export const banners: Banner[] = [
  {
    id: 'b1',
    badge: 'In season',
    slot: 'hero',
    tone: 'blue',
    title: 'Summer-ready AC service',
    subtitle: 'Filter clean, gas check and a cooling test in under an hour.',
    ctaLabel: 'Book AC service',
    ctaHref: '/services',
    order: 1,
    active: true,
  },
  {
    id: 'b2',
    slot: 'hero',
    tone: 'amber',
    title: 'You approve the repair before it starts',
    subtitle: 'The expert inspects, quotes, and waits for your yes.',
    ctaLabel: 'How it works',
    ctaHref: '/services',
    order: 2,
    active: true,
  },
  {
    id: 'b3',
    slot: 'inline',
    tone: 'green',
    title: 'Every repair carries a service warranty',
    subtitle: 'With a GST invoice in the app the moment the job is done.',
    order: 3,
    active: true,
  },
]

export const technician: TechnicianPublic = {
  id: 'tech_arjun',
  name: 'Arjun Kumar',
  rating: 4.8,
  jobsCount: 320,
  specializations: ['samsung', 'lg'],
}

export const brandNames: Record<string, string> = {
  lg: 'LG',
  samsung: 'Samsung',
  bosch: 'Bosch',
  ifb: 'IFB',
}

export const address: Address = {
  id: 'addr_home',
  label: 'home',
  flat: 'Flat 402, Lake View Apartments',
  area: 'Kondapur',
  landmark: 'Botanical Garden',
  city: 'Hyderabad',
  pincode: '500084',
}

export const officeAddress: Address = {
  id: 'addr_office',
  label: 'office',
  flat: '7th Floor, Cyber Towers',
  area: 'Madhapur',
  city: 'Hyderabad',
  pincode: '500081',
}

export const price: PriceBreakdown = {
  visitFee: 29900,
  additional: 110000,
  discount: 0,
  taxable: 118559,
  cgst: 10670,
  sgst: 10671,
  igst: 0,
  total: 139900,
  paid: 29900,
  due: 110000,
}

export const simplePrice: PriceBreakdown = {
  visitFee: 29900,
  additional: 0,
  discount: 0,
  taxable: 25339,
  cgst: 2280,
  sgst: 2281,
  igst: 0,
  total: 29900,
  paid: 0,
  due: 29900,
}

export const slots: SlotOption[] = [
  { start: '09:00', end: '11:00', availability: 'available' },
  { start: '11:00', end: '13:00', availability: 'limited' },
  { start: '13:00', end: '15:00', availability: 'unavailable' },
  { start: '15:00', end: '17:00', availability: 'available' },
]

export const events: BookingEvent[] = [
  {
    id: 'e1',
    status: 'confirmed',
    title: 'Booking confirmed',
    note: 'Visit fee paid.',
    at: Date.now() - 6 * 60 * 60 * 1000,
  },
  {
    id: 'e2',
    status: 'assigned',
    title: 'Arjun Kumar assigned',
    at: Date.now() - 2 * 60 * 60 * 1000,
  },
  {
    id: 'e3',
    status: 'en_route',
    title: 'On the way',
    note: 'Arriving in about 20 minutes.',
    at: Date.now() - 25 * 60 * 1000,
  },
]

export const review: Review = {
  id: 'rv1',
  bookingId: 'bk1',
  uid: 'demo-user-1',
  technicianId: 'tech_arjun',
  rating: 5,
  techRating: 5,
  tags: ['On time', 'Explained the fault', 'Tidy'],
  text: 'Found the blocked drain pump in ten minutes, showed me the part before replacing it, and tested a full cycle before leaving.',
  createdAt: Date.now() - 3 * day,
}

export const warranty: Warranty = {
  id: 'w1',
  bookingId: 'bk1',
  uid: 'demo-user-1',
  applianceId: 'washing-machine',
  brandId: 'ifb',
  serviceKey: 'repair',
  startsAt: Date.now() - 12 * day,
  expiresAt: Date.now() + 18 * day,
  covers: ['The replaced part', 'The labour on this repair'],
  excludes: ['New faults', 'Physical damage'],
}

export const expiredWarranty: Warranty = {
  ...warranty,
  id: 'w2',
  startsAt: Date.now() - 120 * day,
  expiresAt: Date.now() - 90 * day,
}

export const expiringWarranty: Warranty = {
  ...warranty,
  id: 'w3',
  expiresAt: Date.now() + 3 * day,
}

export const invoice: Invoice = {
  id: 'inv1',
  bookingId: 'bk1',
  uid: 'demo-user-1',
  number: 'AP/2026-27/00042',
  issuedAt: Date.now() - 2 * day,
  seller: {
    legalName: '24X7 Home Services Private Limited',
    gstin: '36AAAAA0000A1Z5',
    address: 'Plot 12, Road No. 2, Banjara Hills, Hyderabad, Telangana 500034',
  },
  buyer: {
    name: 'Demo Customer',
    address: 'Flat 402, Lake View Apartments, Kondapur, Hyderabad 500084',
  },
  sacCode: '998714',
  gstRate: 18,
  lines: [
    { label: 'Washing machine repair — visit & inspection', amount: 29900 },
    { label: 'Drum belt replacement (part)', amount: 85000 },
    { label: 'Drum belt replacement (labour)', amount: 25000 },
  ],
  price,
  paymentStatus: 'paid',
}

export const mediaLimits: MediaLimits = {
  maxPhotos: 5,
  maxPhotoBytes: 307200,
  maxPhotoDimension: 1600,
  maxVideos: 1,
  maxVideoBytes: 26214400,
  maxVideoSeconds: 30,
}

export const booking = {
  id: 'bk1',
  displayId: '#AP10428',
  status: 'en_route' as const,
  slot: { date: todayKeyPlus(0), start: '11:00', end: '13:00' },
  price,
  address: { ...address, sourceAddressId: address.id },
  technicianSnapshot: technician,
}

function todayKeyPlus(days: number): string {
  const d = new Date(Date.now() + days * day)
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

export { todayKeyPlus }

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------

export const catalogPlan: CatalogPlan = {
  id: 'ac-annual-care',
  name: 'AC Annual Care',
  tagline: 'Two services a year, and the visit fee gone on both',
  applianceIds: ['air-conditioner'],
  price: 249900,
  compareAt: 319800,
  durationDays: 365,
  visitsIncluded: 2,
  benefits: [
    'Two full services, booked when you want them',
    'No visit fee on either',
    'Gas top-up checked at every visit',
    'Same technician wherever we can',
  ],
  order: 1,
  active: true,
}

export const wholeHomePlan: CatalogPlan = {
  ...catalogPlan,
  id: 'home-annual-care',
  name: 'Whole Home Annual Care',
  tagline: 'Four visits a year, any appliance in the house',
  applianceIds: ['refrigerator', 'washing-machine', 'air-conditioner'],
  price: 449900,
  compareAt: 639600,
  visitsIncluded: 4,
  benefits: [
    'Four service visits, on whichever appliance needs one',
    'No visit fee on any of them',
    'Every appliance in the house covered',
    'Priority slots, including same day',
  ],
  order: 4,
}

export const userPlan: UserPlan = {
  id: 'p_1',
  uid: 'demo-user-1',
  planId: 'ac-annual-care',
  name: 'AC Annual Care',
  applianceIds: ['air-conditioner'],
  price: 249900,
  visitsIncluded: 2,
  visitsUsed: 1,
  benefits: catalogPlan.benefits,
  startsAt: Date.now() - 120 * day,
  expiresAt: Date.now() + 245 * day,
  createdAt: Date.now() - 120 * day,
}

export const spentPlan: UserPlan = {
  ...userPlan,
  id: 'p_2',
  visitsUsed: 2,
  startsAt: Date.now() - 400 * day,
  expiresAt: Date.now() - 35 * day,
}

/** What the plan cards are handed instead of the appliance catalog. */
export const applianceNames = new Map<string, string>([
  ['air-conditioner', 'Air conditioner'],
  ['refrigerator', 'Refrigerator'],
  ['washing-machine', 'Washing machine'],
])
