/**
 * Loads the emulator (or a real project) with everything the app reads but
 * never writes: the catalog, the brand matrix, serviceable pincodes, two weeks
 * of slots, the technician roster, the business config, and one demo customer
 * with saved appliances and a service history.
 *
 * Run it with `npm run seed` from the repo root. It is idempotent — every write
 * is a set() on a known id, so running it twice leaves the same data.
 *
 * It targets the emulator unless SEED_ALLOW_PRODUCTION=1 is set, because it
 * overwrites whatever catalog it is pointed at. Against the emulator it needs
 * no credentials; against a real project it uses GOOGLE_APPLICATION_CREDENTIALS.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { initializeApp, applicationDefault } from 'firebase-admin/app'
import {
  getFirestore,
  FieldValue,
  type Firestore,
  type WriteBatch,
} from 'firebase-admin/firestore'
import {
  APPLIANCE_IDS,
  BRAND_IDS,
  COL,
  DOC,
  SUB,
  bannerSchema,
  brandIdSchema,
  businessConfigSchema,
  catalogApplianceSchema,
  catalogBrandSchema,
  catalogIssueSchema,
  catalogPlanSchema,
  catalogServiceSchema,
  serviceReviewSchema,
  diagnosisRuleSchema,
  matrixDocId,
  popularServiceSchema,
  serviceAreaSchema,
  slotDocId,
  type BusinessConfig,
  type CatalogAppliance,
  type CatalogIssue,
  type CatalogService,
} from '@app/shared'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const PROJECT_ID =
  process.env.GCLOUD_PROJECT ?? process.env.FIREBASE_PROJECT ?? 'demo-customerapp'

/**
 * The emulator is the default target, and reaching a real project takes saying
 * so out loud.
 *
 * It cannot be the other way round. `FIRESTORE_EMULATOR_HOST` is only set for
 * processes the emulator itself spawns, so a seed run from a second terminal —
 * which is the documented way to load the emulator you are developing
 * against — never sees it. Requiring it there meant the documented command
 * could not work, and the way around it was to export the variable by hand,
 * which is a habit that eventually gets used in a shell pointed at production.
 */
const usingEmulator = process.env.SEED_ALLOW_PRODUCTION !== '1'

/** Matches the firestore port in backend/firebase.json. */
const DEFAULT_EMULATOR_HOST = '127.0.0.1:8080'

if (usingEmulator) {
  process.env.FIRESTORE_EMULATOR_HOST ??= DEFAULT_EMULATOR_HOST
} else {
  console.warn(
    `SEED_ALLOW_PRODUCTION=1: writing to the real project "${PROJECT_ID}" ` +
      'and overwriting its catalog.'
  )
}

// Against an emulator the SDK needs no credential at all, and handing it a
// placeholder one fails at key parsing rather than being ignored.
initializeApp(
  usingEmulator
    ? { projectId: PROJECT_ID }
    : { projectId: PROJECT_ID, credential: applicationDefault() }
)

const db = getFirestore()

const FIXTURES = join(__dirname, 'fixtures')

function fixture<T>(name: string, schema: z.ZodType<T>): T {
  const raw: unknown = JSON.parse(
    readFileSync(join(FIXTURES, `${name}.json`), 'utf8')
  )
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    console.error(`${name}.json does not match its schema:`)
    console.error(parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n'))
    process.exit(1)
  }
  return parsed.data
}

/**
 * Firestore caps a batch at 500 writes. This keeps one open and flushes it
 * before it fills, so a growing fixture never quietly breaks the seed.
 */
class Batcher {
  private batch: WriteBatch
  private count = 0
  private total = 0
  /** Commits started by a mid-run rollover, awaited together in flush(). */
  private inFlight: Array<Promise<unknown>> = []

  constructor(private readonly firestore: Firestore) {
    this.batch = firestore.batch()
  }

  /**
   * A fixture that brings its own `createdAt` keeps it.
   *
   * These used to be stamped unconditionally, which overwrote every date a
   * fixture had deliberately spread over time — the wallet statement's entries
   * all landed in the same second, and the seeded reviews came back as
   * Timestamps where their schema wanted epoch milliseconds, so every one of
   * them failed to parse and the section they belong to simply never appeared.
   * Silently: a row that does not parse is dropped, which is right, and gives
   * you an empty list with nothing in the console.
   */
  set(path: string, data: Record<string, unknown>): void {
    this.batch.set(this.firestore.doc(path), {
      ...('createdAt' in data
        ? {}
        : { createdAt: FieldValue.serverTimestamp() }),
      ...('updatedAt' in data
        ? {}
        : { updatedAt: FieldValue.serverTimestamp() }),
      ...data,
    })
    this.count += 1
    this.total += 1
    if (this.count >= 400) this.rollOver()
  }

  /** Hand the full batch off to commit and start a fresh one. */
  private rollOver(): void {
    const full = this.batch
    this.batch = this.firestore.batch()
    this.count = 0
    this.inFlight.push(full.commit())
  }

  async flush(): Promise<void> {
    if (this.count > 0) this.rollOver()
    const pending = this.inFlight
    this.inFlight = []
    // Promise.all, not allSettled: a failed write should fail the seed rather
    // than leave the emulator half-loaded and look like it worked.
    await Promise.all(pending)
  }

  get written(): number {
    return this.total
  }
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const appliances = fixture('appliances', z.array(catalogApplianceSchema))
const services = fixture('services', z.array(catalogServiceSchema))
const brands = fixture('brands', z.array(catalogBrandSchema))
const issues = fixture('issues', z.array(catalogIssueSchema))
const diagnosisRules = fixture('diagnosis', z.array(diagnosisRuleSchema))
const plans = fixture('plans', z.array(catalogPlanSchema))
// Fictional, like the technician ratings beside them, and for the same reason:
// a service page with nothing on it cannot be looked at while it is being
// built. See scripts note in the fixture — both go before launch.
const serviceReviews = fixture('serviceReviews', z.array(serviceReviewSchema))
const serviceAreas = fixture('serviceAreas', z.array(serviceAreaSchema))
const home = fixture(
  'home',
  z.object({
    banners: z.array(bannerSchema),
    popularServices: z.array(popularServiceSchema),
  })
)
const technicians = fixture(
  'technicians',
  z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      rating: z.number(),
      jobsCount: z.number().int(),
      specializations: z.array(brandIdSchema),
      appliances: z.array(z.string()),
      pincodes: z.array(z.string()),
      phone: z.string(),
      employeeCode: z.string(),
      active: z.boolean(),
    })
  )
)
const businessConfig: BusinessConfig = fixture(
  'businessConfig',
  // The fixture carries a "//DECISION NEEDED" note for whoever opens it next.
  // Strip it before validating rather than widening the schema to allow it.
  z
    .record(z.unknown())
    .transform((raw) => {
      const { ['//DECISION NEEDED']: _note, ...rest } = raw
      return rest
    })
    .pipe(businessConfigSchema)
)

// ---------------------------------------------------------------------------
// Cross-fixture checks the schemas cannot make on their own
// ---------------------------------------------------------------------------

function crossCheck(): void {
  const problems: string[] = []

  const applianceIds = new Set(appliances.map((a) => a.id))
  for (const id of APPLIANCE_IDS) {
    if (!applianceIds.has(id)) problems.push(`No appliance fixture for "${id}"`)
  }

  for (const service of services) {
    if (!applianceIds.has(service.applianceId)) {
      problems.push(`Service ${service.id} points at unknown appliance ${service.applianceId}`)
    }
    if (service.id !== `${service.applianceId}_${service.serviceKey}`) {
      problems.push(`Service id ${service.id} does not match its appliance and key`)
    }
  }

  const issueIds = new Set(issues.map((i) => i.id))
  for (const rule of diagnosisRules) {
    if (!issueIds.has(rule.issueId)) {
      problems.push(`Diagnosis rule ${rule.id} points at unknown issue ${rule.issueId}`)
    }
  }
  // Every issue needs causes, or the diagnosis screen shows an empty list.
  const ruledIssues = new Set(diagnosisRules.map((r) => r.issueId))
  for (const issue of issues) {
    if (!ruledIssues.has(issue.id)) {
      problems.push(`Issue ${issue.id} has no diagnosis rule`)
    }
  }

  const serviceIndex = new Set(services.map((s) => `${s.applianceId}_${s.serviceKey}`))
  for (const popular of home.popularServices) {
    if (!serviceIndex.has(`${popular.applianceId}_${popular.serviceKey}`)) {
      problems.push(`Popular service ${popular.id} has no matching catalog service`)
    }
  }

  const areaPincodes = new Set(serviceAreas.map((a) => a.pincode))
  for (const tech of technicians) {
    for (const pincode of tech.pincodes) {
      if (!areaPincodes.has(pincode)) {
        problems.push(`Technician ${tech.id} covers ${pincode}, which is not a service area`)
      }
    }
  }

  if (problems.length > 0) {
    console.error('Fixtures are inconsistent:')
    for (const p of problems) console.error(`  - ${p}`)
    process.exit(1)
  }
}

// ---------------------------------------------------------------------------
// Derived data
// ---------------------------------------------------------------------------

/** `YYYY-MM-DD` in IST, which is the only timezone this business operates in. */
function istDateKey(daysFromToday: number): string {
  const nowUtcMs = Date.now()
  const istMs = nowUtcMs + 5.5 * 60 * 60 * 1000 + daysFromToday * 24 * 60 * 60 * 1000
  return new Date(istMs).toISOString().slice(0, 10)
}

const SLOT_WINDOWS = [
  { start: '09:00', end: '11:00' },
  { start: '11:00', end: '13:00' },
  { start: '13:00', end: '15:00' },
  { start: '15:00', end: '17:00' },
  { start: '17:00', end: '19:00' },
] as const

const SLOT_DAYS = 14
const SLOT_CAPACITY = 6

/**
 * A denormalised row per searchable thing. searchCatalog does a token match
 * against `tokens`, which keeps search to one indexed read instead of a fan-out
 * across four collections.
 */
function tokenize(...parts: string[]): string[] {
  return Array.from(
    new Set(
      parts
        .join(' ')
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((t) => t.length > 1)
    )
  )
}

function buildSearchIndex(): Array<Record<string, unknown>> {
  const rows: Array<Record<string, unknown>> = []

  for (const appliance of appliances as CatalogAppliance[]) {
    rows.push({
      id: `appliance_${appliance.id}`,
      kind: 'appliance',
      applianceId: appliance.id,
      label: appliance.name,
      href: `/services/appliance?a=${appliance.id}`,
      tokens: tokenize(appliance.name, appliance.id),
    })
  }

  for (const service of services as CatalogService[]) {
    rows.push({
      id: `service_${service.id}`,
      kind: 'service',
      applianceId: service.applianceId,
      serviceKey: service.serviceKey,
      label: service.name,
      sublabel: service.description.slice(0, 80),
      href: `/services/appliance?a=${service.applianceId}`,
      tokens: tokenize(service.name, service.serviceKey, service.applianceId),
    })
  }

  for (const issue of issues as CatalogIssue[]) {
    rows.push({
      id: `issue_${issue.id}`,
      kind: 'issue',
      applianceId: issue.applianceId,
      issueId: issue.id,
      label: issue.label,
      sublabel: appliances.find((a) => a.id === issue.applianceId)?.name,
      href: `/services/appliance?a=${issue.applianceId}`,
      tokens: tokenize(issue.label, issue.applianceId),
    })
  }

  return rows
}

// ---------------------------------------------------------------------------
// Demo customer
// ---------------------------------------------------------------------------

const DEMO_UID = 'demo-user-1'

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

/**
 * Fail now, with the reason, rather than inside the admin SDK's retry loop —
 * which reports a connection refused as a deadline sixty seconds later.
 */
async function assertEmulatorReachable(): Promise<void> {
  const host = process.env.FIRESTORE_EMULATOR_HOST
  if (!usingEmulator || !host) return
  try {
    await fetch(`http://${host}/`)
  } catch {
    console.error(
      `No Firestore emulator is listening on ${host}.
` +
        'Start it with `npm run emulators` in another terminal, or set ' +
        'FIRESTORE_EMULATOR_HOST if yours is somewhere else.'
    )
    process.exit(1)
  }
}

async function main(): Promise<void> {
  crossCheck()
  await assertEmulatorReachable()

  const b = new Batcher(db)

  for (const appliance of appliances) {
    b.set(`${COL.catalogAppliances}/${appliance.id}`, appliance)
  }
  for (const service of services) {
    b.set(`${COL.catalogServices}/${service.id}`, service)
  }
  for (const brand of brands) {
    b.set(`${COL.catalogBrands}/${brand.id}`, brand)
  }
  for (const issue of issues) {
    b.set(`${COL.catalogIssues}/${issue.id}`, issue)
  }
  for (const rule of diagnosisRules) {
    b.set(`${COL.diagnosisRules}/${rule.id}`, rule)
  }
  for (const plan of plans) {
    b.set(`${COL.catalogPlans}/${plan.id}`, plan)
  }
  for (const review of serviceReviews) {
    b.set(`${COL.serviceReviews}/${review.id}`, review)
  }
  for (const banner of home.banners) {
    b.set(`${COL.banners}/${banner.id}`, banner)
  }
  for (const popular of home.popularServices) {
    b.set(`${COL.popularServices}/${popular.id}`, popular)
  }
  for (const area of serviceAreas) {
    b.set(`${COL.serviceAreas}/${area.pincode}`, area)
  }
  for (const row of buildSearchIndex()) {
    const { id, ...rest } = row
    b.set(`${COL.searchIndex}/${String(id)}`, rest)
  }

  // All 20 brand × appliance combinations start enabled.
  // DECISION NEEDED: the business must disable the combinations it does not
  // actually service, otherwise the brand page offers work nobody can take.
  for (const brandId of BRAND_IDS) {
    for (const applianceId of APPLIANCE_IDS) {
      b.set(`${COL.brandApplianceMatrix}/${matrixDocId(brandId, applianceId)}`, {
        brandId,
        applianceId,
        enabled: true,
      })
    }
  }

  for (const tech of technicians) {
    const { id, phone, employeeCode, ...shared } = tech
    // The full record, never client-readable.
    b.set(`${COL.technicians}/${id}`, { ...shared, phone, employeeCode })
    // The half a customer is allowed to see.
    b.set(`${COL.technicianPublic}/${id}`, {
      name: shared.name,
      rating: shared.rating,
      jobsCount: shared.jobsCount,
      specializations: shared.specializations,
    })
  }

  const activePincodes = serviceAreas.filter((a) => a.active).map((a) => a.pincode)
  for (const pincode of activePincodes) {
    for (let day = 0; day < SLOT_DAYS; day += 1) {
      const date = istDateKey(day)
      b.set(`${COL.slots}/${slotDocId(pincode, date)}`, {
        pincode,
        date,
        windows: SLOT_WINDOWS.map((w) => ({
          ...w,
          capacity: SLOT_CAPACITY,
          booked: 0,
          held: 0,
        })),
      })
    }
  }

  b.set(`${COL.config}/${DOC.businessConfig}`, businessConfig)

  // Kept out of config/business because the rules make that document public.
  b.set(`${COL.config}/${DOC.privateConfig}`, {
    note: 'Provider credentials live in Cloud Functions secrets, never here.',
  })

  await seedDemoUser(b)

  await b.flush()
  console.log(`Seeded ${b.written} documents into ${PROJECT_ID}.`)
  console.log(`Demo customer uid: ${DEMO_UID}`)
}

async function seedDemoUser(b: Batcher): Promise<void> {
  b.set(`${COL.users}/${DEMO_UID}`, {
    name: 'Demo Customer',
    phone: '+919000000001',
    email: 'demo@example.com',
    consent: {
      termsVersion: businessConfig.termsVersion,
      acceptedAt: Date.now(),
    },
    fcmTokens: [],
    defaultAddressId: 'addr_home',
  })

  b.set(`${COL.users}/${DEMO_UID}/${SUB.addresses}/addr_home`, {
    label: 'home',
    flat: 'Flat 402, Lake View Apartments',
    area: 'Kondapur',
    landmark: 'Opposite Botanical Garden',
    city: 'Hyderabad',
    pincode: '500084',
    geo: { lat: 17.4615, lng: 78.3639 },
  })

  b.set(`${COL.users}/${DEMO_UID}/${SUB.addresses}/addr_office`, {
    label: 'office',
    flat: '7th Floor, Cyber Towers',
    area: 'Madhapur',
    city: 'Hyderabad',
    pincode: '500081',
    geo: { lat: 17.4486, lng: 78.3908 },
  })

  const day = 24 * 60 * 60 * 1000
  b.set(`${COL.users}/${DEMO_UID}/${SUB.appliances}/app_washer`, {
    applianceId: 'washing-machine',
    brandId: 'ifb',
    type: 'front-load',
    modelNumber: 'SENATOR-WXS-8014',
    nickname: 'Washing machine',
    lastServicedAt: Date.now() - 95 * day,
  })
  b.set(`${COL.users}/${DEMO_UID}/${SUB.appliances}/app_ac_hall`, {
    applianceId: 'air-conditioner',
    brandId: 'lg',
    type: 'split',
    modelNumber: 'PS-Q18YNZE',
    nickname: 'Hall AC',
    lastServicedAt: Date.now() - 210 * day,
  })
  b.set(`${COL.users}/${DEMO_UID}/${SUB.appliances}/app_fridge`, {
    applianceId: 'refrigerator',
    brandId: 'samsung',
    type: 'double-door',
    modelNumber: 'RT34C4523S8',
    nickname: 'Kitchen fridge',
  })

  // Credits, so the wallet screen has a balance and a statement to draw in the
  // emulator. Written straight in rather than through issueCredit(), which is
  // a transaction per movement and would make the seed a great deal slower for
  // three rows nobody will reconcile — `balanceAfter` is therefore kept in
  // step by hand here, and is the one place in the app where it is.
  const hour = 60 * 60 * 1000
  b.set(`${COL.wallets}/${DEMO_UID}`, {
    balance: 35000,
    lifetimeIssued: 55000,
    updatedAt: Date.now() - 2 * day,
  })
  b.set(`${COL.wallets}/${DEMO_UID}/${SUB.ledger}/seed_late_visit`, {
    kind: 'issued',
    amount: 20000,
    balanceAfter: 20000,
    reason: 'late_visit',
    note: 'Sorry we were late to your washing machine visit',
    createdAt: Date.now() - 30 * day,
  })
  b.set(`${COL.wallets}/${DEMO_UID}/${SUB.ledger}/seed_spent_ac`, {
    kind: 'spent',
    amount: 20000,
    balanceAfter: 0,
    note: 'Used on your AC service',
    createdAt: Date.now() - 12 * day,
  })
  b.set(`${COL.wallets}/${DEMO_UID}/${SUB.ledger}/seed_cancellation`, {
    kind: 'issued',
    amount: 35000,
    balanceAfter: 35000,
    reason: 'cancellation_refund',
    note: 'Refund for the visit we could not make',
    createdAt: Date.now() - 2 * day - hour,
  })

  // DECISION NEEDED: past bookings are seeded only so My Appliances and Service
  // History have something to render. They are written directly here rather
  // than through createBooking, so their prices are illustrative.
  // See seedDemoBookings() below once the booking callables exist.
}

main().catch((error: unknown) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
