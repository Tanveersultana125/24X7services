/**
 * Writes the catalog the demo build reads, as a Firestore data bundle.
 *
 * The demo build (NEXT_PUBLIC_DEMO_MODE=true) has no backend. It loads this
 * file into Firestore's on-device cache with the network switched off, and
 * every screen then reads through the same Firestore calls it always makes —
 * they are simply answered from the cache.
 *
 * Only what the security rules already let anyone read goes in. No customer,
 * wallet, booking or slot document is ever written to a file served publicly.
 *
 * Run it with `npm run demo:bundle` from the repo root, which seeds a throwaway
 * emulator first, so the bundle is always exactly the seed fixtures.
 */

import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { COL, DOC } from '@app/shared'

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  throw new Error(
    'demoBundle reads the seeded emulator. Run it through `npm run demo:bundle`.'
  )
}

initializeApp({ projectId: process.env.GCLOUD_PROJECT ?? 'demo-customerapp' })
const db = getFirestore()

/** Every collection the rules open to `allow read: if true`. */
const PUBLIC_COLLECTIONS = [
  COL.catalogAppliances,
  COL.catalogServices,
  COL.catalogBrands,
  COL.brandApplianceMatrix,
  COL.catalogIssues,
  COL.diagnosisRules,
  COL.banners,
  COL.popularServices,
  COL.serviceAreas,
  COL.searchIndex,
  COL.catalogPlans,
  COL.technicianPublic,
  COL.serviceReviews,
] as const

const OUT = join(__dirname, '../../frontend/public/demo-data.bundle')

async function main(): Promise<void> {
  const bundle = db.bundle('demo')
  let count = 0

  for (const name of PUBLIC_COLLECTIONS) {
    const snap = await db.collection(name).get()
    bundle.add(name, snap)
    count += snap.size
  }

  const business = await db.collection(COL.config).doc(DOC.businessConfig).get()
  if (business.exists) {
    bundle.add(business)
    count += 1
  }

  writeFileSync(OUT, bundle.build())
  console.log(`Wrote ${count} documents to ${OUT}`)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
