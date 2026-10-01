'use client'

import type { Route } from 'next'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { CheckCircle2, CircleDot, Eye, RotateCcw, Send } from 'lucide-react'
import { changedSections, SECTION_LABEL } from '@/components/content-shared'
import { HomepageTab, PreviewModal } from '@/components/content-home'
import { LibraryTab } from '@/components/content-library'
import { FaqsTab, TestimonialsTab } from '@/components/content-text'
import { BannersTab, BrandLogosTab, PromotionsTab, ServiceImagesTab } from '@/components/content-visuals'
import { useToast } from '@/components/toast'
import { Button, Modal, Page, PageHeader, Tabs } from '@/components/ui'
import { ago } from '@/lib/format'
import { useStore } from '@/lib/store'

const TABS = [
  { value: 'homepage', label: 'Homepage' },
  { value: 'banners', label: 'Banners' },
  { value: 'services', label: 'Service Images' },
  { value: 'brands', label: 'Brand Logos' },
  { value: 'promotions', label: 'Promotions' },
  { value: 'faqs', label: 'FAQs' },
  { value: 'testimonials', label: 'Testimonials' },
  { value: 'media', label: 'Media Library' },
] as const
type Tab = (typeof TABS)[number]['value']

/** Which draft sections each tab edits, for the per-tab "changed" dot. */
const TAB_SECTION: Partial<Record<Tab, keyof typeof SECTION_LABEL>> = {
  homepage: 'homepage',
  banners: 'banners',
  services: 'serviceImages',
  brands: 'brandLogos',
  faqs: 'faqs',
  testimonials: 'testimonials',
}

export default function ContentPage() {
  return (
    <Suspense>
      <Content />
    </Suspense>
  )
}

/**
 * Everything customers see in the app that isn't a booking — edited as a
 * draft, previewed, then published in one step so a half-made change never
 * reaches a customer.
 */
function Content() {
  const store = useStore()
  const toast = useToast()
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const tab = (TABS.some((t) => t.value === params.get('tab')) ? params.get('tab') : 'homepage') as Tab
  const [publishing, setPublishing] = useState(false)
  const [discarding, setDiscarding] = useState(false)
  const [preview, setPreview] = useState(false)

  const changed = changedSections(store.content, store.published)
  const canPublish = store.can('content', 'publish')

  const setTab = (t: Tab) => router.replace(`${pathname}?tab=${t}` as Route, { scroll: false })

  return (
    <Page>
      <PageHeader
        title="Content & Media"
        sub="Homepage, banners, images, logos, FAQs and testimonials in the customer app — change them here, no code needed."
        actions={
          <>
            <span
              className={
                changed.length
                  ? 'inline-flex h-10 items-center gap-2 rounded-lg border border-warning/30 bg-warning-soft px-3 text-[13px] font-bold text-warning'
                  : 'inline-flex h-10 items-center gap-2 rounded-lg border border-success/25 bg-success-soft px-3 text-[13px] font-bold text-success'
              }
            >
              {changed.length ? <CircleDot className="size-4" /> : <CheckCircle2 className="size-4" />}
              {changed.length ? `${changed.length} unpublished change${changed.length === 1 ? '' : 's'}` : `All changes live · published ${ago(store.contentPublishedAt)}`}
            </span>
            <Button variant="secondary" onClick={() => setPreview(true)}>
              <Eye /> Preview
            </Button>
            {changed.length > 0 && (
              <Button variant="secondary" disabled={!canPublish} onClick={() => setDiscarding(true)}>
                <RotateCcw /> Discard draft
              </Button>
            )}
            <Button disabled={!canPublish || !changed.length} onClick={() => setPublishing(true)}>
              <Send /> Publish
            </Button>
          </>
        }
      />

      <Tabs
        className="mb-5"
        value={tab}
        onChange={setTab}
        options={TABS.map((t) => {
          const sec = TAB_SECTION[t.value]
          return { value: t.value, label: sec && changed.includes(sec) ? `${t.label} •` : t.label }
        })}
      />

      {tab === 'homepage' && <HomepageTab onPublish={() => (changed.length ? setPublishing(true) : toast('Nothing to publish — the draft matches live'))} />}
      {tab === 'banners' && <BannersTab />}
      {tab === 'services' && <ServiceImagesTab />}
      {tab === 'brands' && <BrandLogosTab />}
      {tab === 'promotions' && <PromotionsTab />}
      {tab === 'faqs' && <FaqsTab />}
      {tab === 'testimonials' && <TestimonialsTab />}
      {tab === 'media' && <LibraryTab />}

      <PreviewModal open={preview} onClose={() => setPreview(false)} />

      <Modal
        open={publishing}
        onClose={() => setPublishing(false)}
        title="Publish to the customer app?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPublishing(false)}>
              Not yet
            </Button>
            <Button
              onClick={() => {
                store.publishContent()
                toast(`Published ${changed.length} section${changed.length === 1 ? '' : 's'} to the customer app`)
                setPublishing(false)
              }}
            >
              <Send /> Publish now
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">Customers see these changes the next time the app loads:</p>
        <ul className="mt-3 space-y-1.5">
          {changed.map((k) => (
            <li key={k} className="flex items-center gap-2 text-sm font-bold">
              <CircleDot className="size-3.5 text-warning" /> {SECTION_LABEL[k]}
            </li>
          ))}
        </ul>
      </Modal>

      <Modal
        open={discarding}
        onClose={() => setDiscarding(false)}
        title="Discard the draft?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDiscarding(false)}>
              Keep editing
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                store.discardContent()
                toast('Draft discarded — back to what customers see')
                setDiscarding(false)
              }}
            >
              Discard changes
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          Unpublished changes to {changed.map((k) => SECTION_LABEL[k]).join(', ')} are thrown away and the draft goes back to the live version. Uploaded media stays in the library.
        </p>
      </Modal>
    </Page>
  )
}
