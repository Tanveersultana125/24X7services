'use client'

import type { Route } from 'next'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useMemo, useState } from 'react'
import { CircleCheck, RotateCcw, UploadCloud } from 'lucide-react'
import { AreasTab, AvailabilityTab } from '@/components/catalog-areas'
import { EmergencyTab, PricingTab } from '@/components/catalog-pricing'
import { BrandsTab, ServicesTab } from '@/components/catalog-services'
import { catalogDiff } from '@/components/catalog-shared'
import { useToast } from '@/components/toast'
import { Button, Modal, Page, PageHeader, Tabs } from '@/components/ui'
import { ago } from '@/lib/format'
import { useStore, useTick } from '@/lib/store'

const TABS = [
  { value: 'services', label: 'Services' },
  { value: 'brands', label: 'Brands' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'emergency', label: 'Emergency Pricing' },
  { value: 'areas', label: 'Service Areas' },
  { value: 'availability', label: 'Availability' },
] as const

type Tab = (typeof TABS)[number]['value']

export default function CatalogPage() {
  return (
    <Suspense>
      <Catalog />
    </Suspense>
  )
}

/**
 * What the network sells and at what price. Services, brands and prices are
 * edited as a draft and published to the customer app in one step; service
 * areas and the availability matrix switch immediately.
 */
function Catalog() {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const raw = params.get('tab')
  const tab: Tab = TABS.some((t) => t.value === raw) ? (raw as Tab) : 'services'

  return (
    <Page>
      <PageHeader title="Services & Pricing" sub="Services, brands, prices and where customers can book — no code changes needed." />
      <PublishBar />
      <Tabs
        className="mb-5"
        value={tab}
        onChange={(v) => router.replace(`${pathname}?tab=${v}` as Route, { scroll: false })}
        options={TABS.map((t) => ({ value: t.value, label: t.label }))}
      />
      {tab === 'services' && <ServicesTab />}
      {tab === 'brands' && <BrandsTab />}
      {tab === 'pricing' && <PricingTab />}
      {tab === 'emergency' && <EmergencyTab />}
      {tab === 'areas' && <AreasTab />}
      {tab === 'availability' && <AvailabilityTab />}
    </Page>
  )
}

/** Draft vs live: how many changes are waiting, and the one button that ships them. */
function PublishBar() {
  const store = useStore()
  const toast = useToast()
  useTick(60_000)
  const [confirm, setConfirm] = useState<'publish' | 'discard' | null>(null)
  const changes = useMemo(() => catalogDiff(store.catalog, store.catalogPublished), [store.catalog, store.catalogPublished])
  const canPublish = store.can('catalog', 'publish')
  const n = changes.length

  return (
    <>
      {n === 0 ? (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-card border border-line bg-card px-4 py-3 shadow-card">
          <CircleCheck className="size-5 text-success" aria-hidden />
          <p className="text-sm font-bold">
            Live <span className="font-semibold text-muted">· customer app matches · published {ago(store.catalogPublishedAt)}</span>
          </p>
        </div>
      ) : (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-card border border-warning/40 bg-warning-soft px-4 py-3 shadow-card">
          <span className="size-2.5 rounded-full bg-warning" aria-hidden />
          <p className="min-w-0 flex-1 text-sm font-bold">
            {n} unpublished change{n === 1 ? '' : 's'}
            <span className="block font-semibold text-muted sm:inline"> · Customers see the live version until you publish</span>
          </p>
          {canPublish && (
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setConfirm('discard')}>
                <RotateCcw /> Discard
              </Button>
              <Button size="sm" onClick={() => setConfirm('publish')}>
                <UploadCloud /> Publish to customer app
              </Button>
            </div>
          )}
        </div>
      )}

      <Modal
        open={confirm === 'publish'}
        onClose={() => setConfirm(null)}
        title={`Publish ${n} change${n === 1 ? '' : 's'}?`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                store.publishCatalog()
                toast(`${n} change${n === 1 ? '' : 's'} published to the customer app`)
                setConfirm(null)
              }}
            >
              <UploadCloud /> Publish now
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm font-medium text-muted">New bookings use these from the moment you publish. Bookings already made keep their price.</p>
        <ul className="max-h-[45dvh] space-y-1.5 overflow-y-auto rounded-lg border border-line bg-canvas/60 p-3">
          {changes.map((c) => (
            <li key={c} className="flex gap-2 text-[13px] font-semibold text-ink-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-warning" aria-hidden />
              {c}
            </li>
          ))}
        </ul>
      </Modal>

      <Modal
        open={confirm === 'discard'}
        onClose={() => setConfirm(null)}
        title="Discard the draft?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(null)}>
              Keep editing
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                store.discardCatalog()
                toast('Draft discarded — back to the live catalogue')
                setConfirm(null)
              }}
            >
              <RotateCcw /> Discard {n} change{n === 1 ? '' : 's'}
            </Button>
          </>
        }
      >
        <p className="text-sm font-medium text-muted">Every unpublished change to services, brands and prices goes back to what customers see now.</p>
      </Modal>
    </>
  )
}
