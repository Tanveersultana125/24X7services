'use client'

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  type Query,
} from 'firebase/firestore'
import {
  bannerSchema,
  businessConfigSchema,
  catalogApplianceSchema,
  catalogBrandSchema,
  catalogIssueSchema,
  catalogServiceSchema,
  COL,
  DOC,
  popularServiceSchema,
  serviceAreaSchema,
  serviceReviewSchema,
  type ApplianceId,
  type Banner,
  type BusinessConfig,
  type CatalogAppliance,
  type CatalogBrand,
  type CatalogIssue,
  type CatalogService,
  type PopularService,
  type ServiceArea,
  type ServiceKey,
  type ServiceReview,
} from '@app/shared'
import type { z } from 'zod'
import { db } from './firebase'

/**
 * Every read of the catalog, in one place.
 *
 * The catalog is public and read-only, so these are direct Firestore reads
 * rather than callables. Each row is parsed on the way in: a seed that has
 * drifted from the schema drops the bad row and renders the rest, instead of
 * putting `undefined` through a price formatter halfway down a list.
 *
 * Nothing here caches. Firestore's own SDK cache covers a back-and-forth
 * between two screens, and a catalog that changed while the app was open should
 * not need a restart to show it.
 */

async function readAll<S extends z.ZodTypeAny>(
  q: Query,
  schema: S
): Promise<Array<z.infer<S>>> {
  const snap = await getDocs(q)
  const rows: Array<z.infer<S>> = []
  for (const document of snap.docs) {
    const parsed = schema.safeParse({ id: document.id, ...document.data() })
    if (parsed.success) rows.push(parsed.data)
  }
  return rows
}

// ---------------------------------------------------------------------------
// Appliances
// ---------------------------------------------------------------------------

export function fetchAppliances(): Promise<CatalogAppliance[]> {
  return readAll(
    query(
      collection(db(), COL.catalogAppliances),
      where('active', '==', true),
      orderBy('order')
    ),
    catalogApplianceSchema
  )
}

export async function fetchAppliance(
  applianceId: string
): Promise<CatalogAppliance | null> {
  const snap = await getDoc(doc(db(), COL.catalogAppliances, applianceId))
  if (!snap.exists()) return null
  const parsed = catalogApplianceSchema.safeParse({
    id: snap.id,
    ...snap.data(),
  })
  return parsed.success && parsed.data.active ? parsed.data : null
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

export function fetchServicesFor(
  applianceId: ApplianceId
): Promise<CatalogService[]> {
  return readAll(
    query(
      collection(db(), COL.catalogServices),
      where('applianceId', '==', applianceId),
      where('active', '==', true),
      orderBy('order')
    ),
    catalogServiceSchema
  )
}

/**
 * Every active service, for the "from ₹X" line under each appliance tile.
 *
 * Deliberately unordered: `active` alone rides the single-field index Firestore
 * maintains by itself, where adding `orderBy('order')` would need a composite
 * index for a sort that thirty-odd rows do fine in memory.
 */
export function fetchAllServices(): Promise<CatalogService[]> {
  return readAll(
    query(collection(db(), COL.catalogServices), where('active', '==', true)),
    catalogServiceSchema
  )
}

/** The cheapest visit fee per appliance — what "from ₹X" actually means. */
export function cheapestByAppliance(
  services: readonly CatalogService[]
): Map<string, number> {
  const cheapest = new Map<string, number>()
  for (const service of services) {
    const current = cheapest.get(service.applianceId)
    if (current === undefined || service.visitFee < current) {
      cheapest.set(service.applianceId, service.visitFee)
    }
  }
  return cheapest
}

/**
 * What stands for a whole appliance on a tile: a clip, a frame of it, and a
 * score.
 *
 * An appliance has no artwork or score of its own — both belong to the
 * services under it. The clip is the headline service's, because a tile has
 * room for one and "repair" is the one people arrive looking for; where an
 * appliance has no repair the first service in catalog order stands in.
 *
 * The score is every service under it, weighted by how many people scored
 * each — a straight mean of the averages would let a service nobody books
 * count as much as the one everybody does. Services with no score sit the
 * round out rather than being counted as zero, and an appliance where nobody
 * has a score gets none, which is what `ServiceScore` draws nothing for.
 */
export interface ApplianceSummary {
  video?: string
  poster?: string
  rating?: number
  reviewCount?: number
}

export function summaryByAppliance(
  services: readonly CatalogService[]
): Map<string, ApplianceSummary> {
  const headline = new Map<string, CatalogService>()
  const weighted = new Map<string, { score: number; count: number }>()

  for (const service of services) {
    const current = headline.get(service.applianceId)
    const better =
      current === undefined ||
      (service.serviceKey === 'repair' && current.serviceKey !== 'repair') ||
      (current.serviceKey !== 'repair' && service.order < current.order)
    if (better) headline.set(service.applianceId, service)

    if (service.rating === undefined || service.reviewCount === undefined) {
      continue
    }
    const running = weighted.get(service.applianceId) ?? { score: 0, count: 0 }
    running.score += service.rating * service.reviewCount
    running.count += service.reviewCount
    weighted.set(service.applianceId, running)
  }

  const out = new Map<string, ApplianceSummary>()
  for (const [applianceId, service] of headline) {
    const running = weighted.get(applianceId)
    out.set(applianceId, {
      video: service.video,
      poster: service.poster,
      rating: running ? running.score / running.count : undefined,
      reviewCount: running?.count,
    })
  }
  return out
}

// ---------------------------------------------------------------------------
// Brands and issues
// ---------------------------------------------------------------------------

export function fetchBrands(): Promise<CatalogBrand[]> {
  return readAll(
    query(
      collection(db(), COL.catalogBrands),
      where('active', '==', true),
      orderBy('order')
    ),
    catalogBrandSchema
  )
}

/**
 * The reviews on one service, newest first.
 *
 * The public half only — `serviceReviews`, which carries a score, the words
 * and a first name. The review itself stays private to whoever wrote it.
 * Capped at the same fifty the rules allow, because a service page is not the
 * place to ask for every review anybody has ever left.
 */
export function fetchServiceReviews(
  applianceId: ApplianceId,
  serviceKey: ServiceKey
): Promise<ServiceReview[]> {
  return readAll(
    query(
      collection(db(), COL.serviceReviews),
      where('applianceId', '==', applianceId),
      where('serviceKey', '==', serviceKey),
      orderBy('createdAt', 'desc'),
      limit(50)
    ),
    serviceReviewSchema
  )
}

export function fetchIssuesFor(
  applianceId: ApplianceId
): Promise<CatalogIssue[]> {
  return readAll(
    query(
      collection(db(), COL.catalogIssues),
      where('applianceId', '==', applianceId),
      orderBy('order')
    ),
    catalogIssueSchema
  )
}

// ---------------------------------------------------------------------------
// Home content
// ---------------------------------------------------------------------------

export function fetchBanners(): Promise<Banner[]> {
  return readAll(
    query(
      collection(db(), COL.banners),
      where('active', '==', true),
      orderBy('order')
    ),
    bannerSchema
  )
}

export function fetchPopularServices(): Promise<PopularService[]> {
  return readAll(
    query(
      collection(db(), COL.popularServices),
      where('active', '==', true),
      orderBy('order')
    ),
    popularServiceSchema
  )
}

// ---------------------------------------------------------------------------
// Serviceability and configuration
// ---------------------------------------------------------------------------

/**
 * The areas we cover, for the list a customer picks from. Serviceability for a
 * pincode they typed goes through `checkServiceability` instead — the answer
 * gates the booking flow, and a client deciding it for itself is a client that
 * can forget to check `active`.
 */
export async function fetchServiceAreas(): Promise<ServiceArea[]> {
  const rows = await readAll(
    query(collection(db(), COL.serviceAreas), where('active', '==', true)),
    serviceAreaSchema
  )
  return rows.sort((a, b) => a.area.localeCompare(b.area))
}

export async function fetchBusinessConfig(): Promise<BusinessConfig | null> {
  const snap = await getDoc(doc(db(), COL.config, DOC.businessConfig))
  if (!snap.exists()) return null
  const parsed = businessConfigSchema.safeParse(snap.data())
  return parsed.success ? parsed.data : null
}
