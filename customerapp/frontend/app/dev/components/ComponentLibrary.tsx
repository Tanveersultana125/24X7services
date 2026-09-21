'use client'

import { useState } from 'react'
import {
  BOOKING_STATUSES,
  type CatalogBrand,
  type SlotOption,
  type TechnicianPublic,
} from '@app/shared'
import {
  CalendarX,
  Inbox,
  MapPinOff,
  PackageOpen,
  Star,
  Bell,
} from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Field'
import { Chip, Tag } from '@/components/ui/Chip'

import { Header, HeaderAction } from '@/components/Header'
import { BottomNavigation } from '@/components/BottomNavigation'
import { DesktopNav } from '@/components/DesktopNav'
import { LocationSelector } from '@/components/LocationSelector'
import { SearchBar } from '@/components/SearchBar'
import { PromotionalBanner } from '@/components/PromotionalBanner'
import { ApplianceCard } from '@/components/ApplianceCard'
import { ServiceCard } from '@/components/ServiceCard'
import { BrandCard, BrandDisclaimer } from '@/components/BrandCard'
import { BookingCard } from '@/components/BookingCard'
import { TechnicianCard } from '@/components/TechnicianCard'
import { TimeSlot } from '@/components/TimeSlot'
import { DateStrip } from '@/components/DateStrip'
import { AddressCard } from '@/components/AddressCard'
import { PriceSummary } from '@/components/PriceSummary'
import { StatusTimeline } from '@/components/StatusTimeline'
import { SupportCard } from '@/components/SupportCard'
import { ReviewCard, Stars } from '@/components/ReviewCard'
import { WarrantyCard } from '@/components/WarrantyCard'
import { InvoiceView } from '@/components/InvoiceView'
import { Modal, ConfirmModal } from '@/components/Modal'
import { BottomSheet } from '@/components/BottomSheet'
import { StickyCTA } from '@/components/StickyCTA'
import { MediaUploader, type MediaDraftItem } from '@/components/MediaUploader'
import { OtpInput, OtpDisplay } from '@/components/OtpInput'
import { StatusBadge } from '@/components/StatusBadge'
import { ConsentCheckbox } from '@/components/ConsentCheckbox'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState, OfflineBanner } from '@/components/ErrorState'
import { ToastProvider, useToast } from '@/components/Toast'
import {
  ApplianceGridSkeleton,
  BookingListSkeleton,
  HomeSkeleton,
  ProfileSkeleton,
  ServiceListSkeleton,
  TicketListSkeleton,
  TrackingSkeleton,
} from '@/components/SkeletonLoader'

import * as fx from './fixtures'

export function ComponentLibrary() {
  return (
    <ToastProvider>
      <Library />
    </ToastProvider>
  )
}

function Library() {
  return (
    <div className="min-h-dvh bg-surface pb-24">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-ink">Component library</h1>
          <p className="mt-1 text-sm text-muted">
            Every component, in every state. Nothing here reads from Firestore —
            the fixtures are shaped like what the services return, so what
            renders here is what renders in the app.
          </p>
        </header>

        <Typography />
        <Colour />
        <Buttons />
        <Inputs />
        <Chips />
        <Badges />
        <Navigation />
        <Discovery />
        <BookingPieces />
        <Money />
        <Lifecycle />
        <Support />
        <Overlays />
        <States />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function Section({
  title,
  note,
  children,
}: {
  title: string
  note?: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-10">
      <h2 className="mb-1 text-xl font-bold text-ink">{title}</h2>
      {note ? <p className="mb-3 text-sm text-muted">{note}</p> : null}
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  )
}

function Case({
  label,
  full = false,
  children,
}: {
  label: string
  /** Bleeds to the full width, for things that are meant to span the screen. */
  full?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <div
        className={
          full
            ? 'overflow-hidden rounded-card border border-border bg-bg'
            : 'rounded-card border border-border bg-bg p-4'
        }
      >
        {children}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function Typography() {
  const steps = [
    ['34 / text-3xl', 'text-3xl font-extrabold'],
    ['28 / text-2xl', 'text-2xl font-bold'],
    ['22 / text-xl', 'text-xl font-bold'],
    ['18 / text-lg', 'text-lg font-semibold'],
    ['16 / text-base', 'text-base'],
    ['14 / text-sm', 'text-sm'],
    ['12 / text-xs', 'text-xs'],
  ] as const

  return (
    <Section
      title="Type"
      note="Manrope, seven steps. Anything not on the scale is a mistake, not a decision."
    >
      <Case label="Scale">
        <div className="flex flex-col gap-2">
          {steps.map(([label, cls]) => (
            <div key={label} className="flex items-baseline gap-4">
              <span className="w-28 shrink-0 text-xs text-muted">{label}</span>
              <span className={cls}>Fixed in one visit</span>
            </div>
          ))}
        </div>
      </Case>
    </Section>
  )
}

function Colour() {
  const tokens = [
    ['--color-ink', 'bg-ink'],
    ['--color-bg', 'bg-bg border border-border'],
    ['--color-surface', 'bg-surface'],
    ['--color-border', 'bg-border'],
    ['--color-muted', 'bg-muted'],
    ['--color-brand', 'bg-brand'],
    ['--color-brand-deep', 'bg-brand-deep'],
    ['--color-brand-soft', 'bg-brand-soft'],
    ['--color-success', 'bg-success'],
    ['--color-warning', 'bg-warning'],
    ['--color-error', 'bg-error'],
  ] as const

  return (
    <Section
      title="Colour"
      note="Brand blue is the app talking — anything tappable, anything chosen. The three semantic hues are the job talking, and stay on badges, dots and alerts."
    >
      <Case label="Tokens">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {tokens.map(([name, cls]) => (
            <li key={name} className="flex flex-col gap-1.5">
              <span className={`h-12 rounded-card ${cls}`} />
              <code className="text-[11px] text-muted">{name}</code>
            </li>
          ))}
        </ul>
      </Case>
    </Section>
  )
}

function Buttons() {
  return (
    <Section title="Button">
      <Case label="Variants">
        <div className="flex flex-wrap gap-2">
          <Button>Pay &amp; Confirm</Button>
          <Button variant="secondary">Reschedule</Button>
          <Button variant="ghost">Skip</Button>
          <Button variant="danger">Cancel booking</Button>
        </div>
      </Case>
      <Case label="Sizes">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </Case>
      <Case label="Loading and disabled">
        <div className="flex flex-wrap gap-2">
          <Button loading>Confirming</Button>
          <Button variant="secondary" loading>
            Checking
          </Button>
          <Button disabled>Unavailable</Button>
        </div>
      </Case>
      <Case label="Full width">
        <Button fullWidth size="lg">
          Confirm Booking
        </Button>
      </Case>
    </Section>
  )
}

function Inputs() {
  const [otp, setOtp] = useState('')
  const [consent, setConsent] = useState(false)

  return (
    <Section title="Inputs">
      <Case label="Text, hint, error, disabled">
        <div className="flex flex-col gap-4">
          <Input label="Full name" placeholder="Your name" />
          <Input
            label="Pincode"
            placeholder="500084"
            inputMode="numeric"
            hint="We use this to check whether we cover your area."
          />
          <Input
            label="Mobile number"
            defaultValue="98765"
            error="Enter a valid 10-digit Indian mobile number"
          />
          <Input label="Email" defaultValue="demo@example.com" disabled />
          <Textarea
            label="Describe the problem"
            placeholder="It makes a loud noise during the spin cycle."
          />
        </div>
      </Case>

      <Case label="OtpInput — empty, partial, error">
        <div className="flex flex-col gap-5">
          <OtpInput value={otp} onChange={setOtp} />
          <OtpInput value="1234" onChange={() => {}} />
          <OtpInput
            value="999999"
            onChange={() => {}}
            error="That code is not right. Try again."
          />
        </div>
      </Case>

      <Case label="OtpDisplay — the job OTPs">
        <div className="grid gap-3 sm:grid-cols-2">
          <OtpDisplay otp="4827" caption="Start OTP" />
          <OtpDisplay otp="9143" caption="Completion OTP" />
        </div>
      </Case>

      <Case label="ConsentCheckbox — unchecked, checked, error">
        <div className="flex flex-col gap-4">
          <ConsentCheckbox checked={consent} onChange={setConsent} />
          <ConsentCheckbox checked onChange={() => {}} />
          <ConsentCheckbox
            checked={false}
            onChange={() => {}}
            error="Please accept the Terms and Privacy Policy to continue."
          />
        </div>
      </Case>
    </Section>
  )
}

function Chips() {
  const [selected, setSelected] = useState<string[]>(['Not draining water'])
  const issues = [
    'Not draining water',
    'Drum not spinning',
    'Leaking water',
    'Loud noise or shaking',
  ]

  return (
    <Section title="Chip and Tag">
      <Case label="Multi-select, with a tick">
        <div className="flex flex-wrap gap-2">
          {issues.map((issue) => (
            <Chip
              key={issue}
              showCheck
              selected={selected.includes(issue)}
              onClick={() =>
                setSelected((current) =>
                  current.includes(issue)
                    ? current.filter((i) => i !== issue)
                    : [...current, issue]
                )
              }
            >
              {issue}
            </Chip>
          ))}
        </div>
      </Case>
      <Case label="Single-select and disabled">
        <div className="flex flex-wrap gap-2">
          <Chip selected>Front load</Chip>
          <Chip>Top load</Chip>
          <Chip disabled>Semi automatic</Chip>
        </div>
      </Case>
      <Case label="Tag — read only">
        <div className="flex flex-wrap gap-2">
          <Tag>On time</Tag>
          <Tag>Samsung · LG</Tag>
          <Tag>Default</Tag>
        </div>
      </Case>
    </Section>
  )
}

function Badges() {
  return (
    <Section
      title="StatusBadge"
      note="Every booking status. The label is always text, so the colour is reinforcement and never the only signal."
    >
      <Case label="All statuses">
        <div className="flex flex-wrap gap-2">
          {BOOKING_STATUSES.map((status) => (
            <StatusBadge key={status} status={status} />
          ))}
        </div>
      </Case>
      <Case label="Stars">
        <div className="flex flex-col gap-2">
          <Stars value={5} label="Service rating" />
          <Stars value={4} label="Service rating" />
          <Stars value={3} label="Service rating" size="sm" />
        </div>
      </Case>
    </Section>
  )
}

function Navigation() {
  return (
    <Section title="Navigation">
      <Case label="Header — plain, with back, with actions" full>
        <Header title="Bookings" />
        <Header title="Review booking" subtitle="Step 8 of 9" showBack />
        <Header
          title="Washing Machine Repair"
          subtitle="#AP10428"
          showBack
          right={
            <HeaderAction label="Notifications" badge>
              <Bell className="size-5" aria-hidden="true" />
            </HeaderAction>
          }
        />
      </Case>

      <Case label="LocationSelector — unset, loading, chosen">
        <div className="flex flex-col items-start gap-2">
          <LocationSelector onClick={() => {}} />
          <LocationSelector onClick={() => {}} loading />
          <LocationSelector
            onClick={() => {}}
            area="Kondapur"
            detail="Hyderabad 500084"
          />
        </div>
      </Case>

      <Case label="SearchBar — read-only (Home) and live (/search)">
        <div className="flex flex-col gap-3">
          <SearchBar readOnly onOpen={() => {}} />
          <LiveSearchBar />
        </div>
      </Case>

      <Case
        label="BottomNavigation and DesktopNav — fixed, shown in place"
        full
      >
        <div className="relative h-40 overflow-hidden">
          <DesktopNav locationLabel="Home · Kondapur" unreadCount={2} />
          <p className="p-4 text-sm text-muted">
            The bottom bar is fixed to the viewport, so it renders at the foot
            of this page rather than inside this box.
          </p>
          <BottomNavigation />
        </div>
      </Case>
    </Section>
  )
}

function LiveSearchBar() {
  const [q, setQ] = useState('fridge')
  return <SearchBar value={q} onChange={setQ} onSubmit={() => {}} />
}

function Discovery() {
  const [brand, setBrand] = useState<CatalogBrand | null>(null)

  return (
    <Section title="Discovery">
      <Case label="PromotionalBanner — swipe, dots, autoplay" full>
        <div className="p-4">
          <PromotionalBanner banners={fx.banners} />
        </div>
      </Case>

      <Case label="ApplianceCard">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <ApplianceCard appliance={fx.appliance} from="₹299" />
          <ApplianceCard
            appliance={{
              ...fx.appliance,
              id: 'air-conditioner',
              name: 'Air Conditioner',
              image: '/appliances/air-conditioner.jpg',
            }}
            from="₹399"
          />
        </div>
      </Case>

      <Case label="ServiceCard — unselected and selected">
        <div className="flex flex-col gap-3">
          <ServiceCard service={fx.service} onSelect={() => {}} />
          <ServiceCard service={fx.service} onSelect={() => {}} selected />
        </div>
      </Case>

      <Case label="BrandCard — wordmarks, one unavailable">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {fx.brands.map((b, index) => (
            <BrandCard
              key={b.id}
              brand={b}
              onSelect={setBrand}
              selected={brand?.id === b.id}
              disabled={index === 3}
            />
          ))}
        </div>
        <BrandDisclaimer className="mt-3" />
      </Case>
    </Section>
  )
}

function BookingPieces() {
  const [slot, setSlot] = useState<SlotOption | null>(null)
  const [date, setDate] = useState(fx.todayKeyPlus(0))
  const [tech, setTech] = useState<TechnicianPublic | null>(null)
  const [media, setMedia] = useState<MediaDraftItem[]>([])

  const days = Array.from({ length: 7 }, (_, i) => ({
    date: fx.todayKeyPlus(i),
    hasAvailability: i !== 2,
  }))

  return (
    <Section title="Booking steps">
      <Case label="DateStrip — one day fully booked">
        <DateStrip days={days} value={date} onChange={setDate} />
      </Case>

      <Case label="TimeSlot — available, filling fast, unavailable, selected">
        <div className="grid grid-cols-2 gap-2">
          {fx.slots.map((s) => (
            <TimeSlot
              key={s.start}
              slot={s}
              selected={slot?.start === s.start}
              onSelect={setSlot}
            />
          ))}
        </div>
      </Case>

      <Case label="AddressCard — selectable, default, unserviceable, editable">
        <div className="flex flex-col gap-3">
          <AddressCard address={fx.address} onSelect={() => {}} selected />
          <AddressCard address={fx.officeAddress} onSelect={() => {}} />
          <AddressCard
            address={{ ...fx.address, id: 'a3', pincode: '560001', city: 'Bengaluru' }}
            onSelect={() => {}}
            serviceable={false}
          />
          <AddressCard
            address={fx.address}
            isDefault
            onEdit={() => {}}
            onDelete={() => {}}
          />
        </div>
      </Case>

      <Case label="TechnicianCard — selectable and assigned">
        <div className="flex flex-col gap-3">
          <TechnicianCard
            technician={fx.technician}
            brandNames={fx.brandNames}
            onSelect={setTech}
            selected={tech?.id === fx.technician.id}
          />
          <TechnicianCard
            technician={fx.technician}
            brandNames={fx.brandNames}
            maskedNumber="+918000247247"
            onMessage={() => {}}
          />
        </div>
      </Case>

      <Case label="MediaUploader — empty and with items">
        <MediaUploader
          items={media}
          onItemsChange={setMedia}
          limits={fx.mediaLimits}
        />
      </Case>
    </Section>
  )
}

function Money() {
  return (
    <Section title="Money">
      <Case label="PriceSummary — visit fee only">
        <PriceSummary price={fx.simplePrice} showDue={false} />
      </Case>
      <Case label="PriceSummary — with an approved repair and a balance due">
        <PriceSummary price={fx.price} />
      </Case>
      <Case label="InvoiceView">
        <InvoiceView invoice={fx.invoice} />
      </Case>
    </Section>
  )
}

function Lifecycle() {
  return (
    <Section title="Lifecycle">
      <Case label="BookingCard">
        <div className="flex flex-col gap-3">
          <BookingCard
            booking={fx.booking}
            serviceName="Washing Machine Repair"
          />
          <BookingCard
            booking={{ ...fx.booking, status: 'awaiting_approval' }}
            serviceName="Washing Machine Repair"
          />
          <BookingCard
            booking={{ ...fx.booking, status: 'completed' }}
            serviceName="Washing Machine Repair"
          />
          <BookingCard
            booking={{ ...fx.booking, status: 'cancelled' }}
            serviceName="Washing Machine Repair"
          />
        </div>
      </Case>

      <Case label="StatusTimeline — live, with the last step current">
        <StatusTimeline events={fx.events} live />
      </Case>

      <Case label="WarrantyCard — active, expiring, expired">
        <div className="flex flex-col gap-3">
          <WarrantyCard
            warranty={fx.warranty}
            serviceName="Washing Machine Repair"
            applianceName="IFB front load"
          />
          <WarrantyCard
            warranty={fx.expiringWarranty}
            serviceName="AC Service"
            applianceName="LG split, 1.5 ton"
          />
          <WarrantyCard
            warranty={fx.expiredWarranty}
            serviceName="Refrigerator Repair"
            applianceName="Samsung double door"
          />
        </div>
      </Case>

      <Case label="ReviewCard">
        <ReviewCard
          review={fx.review}
          serviceName="Washing Machine Repair"
          technicianName="Arjun Kumar"
        />
      </Case>
    </Section>
  )
}

function Support() {
  return (
    <Section title="Support">
      <Case label="SupportCard">
        <SupportCard supportPhone="+918000247247" />
      </Case>
    </Section>
  )
}

function Overlays() {
  const [modal, setModal] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [sheet, setSheet] = useState(false)
  const [cta, setCta] = useState(false)
  const toast = useToast()

  return (
    <Section title="Overlays and feedback">
      <Case label="Modal, ConfirmModal, BottomSheet">
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setModal(true)}>
            Open modal
          </Button>
          <Button variant="secondary" onClick={() => setConfirm(true)}>
            Open confirm
          </Button>
          <Button variant="secondary" onClick={() => setSheet(true)}>
            Open sheet
          </Button>
        </div>

        <Modal
          open={modal}
          onClose={() => setModal(false)}
          title="Cancellation policy"
          description="Cancelling four or more hours before your slot is free."
          footer={<Button onClick={() => setModal(false)}>Got it</Button>}
        >
          <p className="text-sm text-muted">
            Inside four hours a fee of ₹99 applies, and any refund reaches your
            account within five working days.
          </p>
        </Modal>

        <ConfirmModal
          open={confirm}
          onClose={() => setConfirm(false)}
          onConfirm={() => {
            setConfirm(false)
            toast.show('Booking cancelled', { tone: 'success' })
          }}
          title="Cancel this booking?"
          description="You are cancelling Washing Machine Repair on Tuesday, 11 AM – 1 PM."
          confirmLabel="Yes, cancel"
          destructive
        >
          <div className="rounded-card border border-border bg-surface p-3 text-sm">
            <p className="text-ink">Cancellation fee: ₹99</p>
            <p className="mt-1 text-muted">
              ₹200 will be refunded within 5 working days.
            </p>
          </div>
        </ConfirmModal>

        <BottomSheet
          open={sheet}
          onClose={() => setSheet(false)}
          title="Choose an address"
          footer={
            <Button fullWidth onClick={() => setSheet(false)}>
              Use this address
            </Button>
          }
        >
          <div className="flex flex-col gap-3">
            <AddressCard address={fx.address} onSelect={() => {}} selected />
            <AddressCard address={fx.officeAddress} onSelect={() => {}} />
          </div>
        </BottomSheet>
      </Case>

      <Case label="Toast">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => toast.show('Address saved', { tone: 'success' })}
          >
            Success
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => toast.show('Slot no longer available', { tone: 'warning' })}
          >
            Warning
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              toast.show('Payment could not be verified', { tone: 'error' })
            }
          >
            Error
          </Button>
        </div>
      </Case>

      <Case label="StickyCTA — the real one, pinned above the bottom nav">
        <Button variant="secondary" onClick={() => setCta((v) => !v)}>
          {cta ? 'Hide sticky CTA' : 'Show sticky CTA'}
        </Button>
        {cta ? (
          <StickyCTA
            aboveBottomNav
            detail={
              <>
                <p className="text-xs text-muted">Visit fee</p>
                <p className="text-base font-bold text-ink">₹299</p>
              </>
            }
          >
            <Button onClick={() => setCta(false)}>Pay &amp; Confirm</Button>
          </StickyCTA>
        ) : null}
      </Case>

      <Case label="OfflineBanner" full>
        <OfflineBanner />
      </Case>
    </Section>
  )
}

function States() {
  return (
    <Section title="Empty, error and loading">
      <Case label="EmptyState">
        <div className="grid gap-3 sm:grid-cols-2">
          <EmptyState
            icon={CalendarX}
            title="No bookings yet"
            description="When you book a service it will show up here."
            action={{ label: 'Book a service', href: '/services' }}
          />
          <EmptyState
            icon={PackageOpen}
            title="No saved appliances"
            description="Save an appliance and your next booking takes two taps."
          />
          <EmptyState
            icon={Star}
            title="No reviews yet"
            description="Reviews you leave after a job appear here."
          />
          <EmptyState
            icon={MapPinOff}
            title="We are not in your area yet"
            description="Leave your number and we will tell you the day we arrive."
            action={{ label: 'Notify me', onClick: () => {} }}
          />
          <EmptyState
            icon={Inbox}
            title="No tickets"
            description="Conversations with support show up here."
          />
        </div>
      </Case>

      <Case label="ErrorState">
        <div className="grid gap-3 sm:grid-cols-2">
          <ErrorState onRetry={() => {}} />
          <ErrorState kind="offline" onRetry={() => {}} />
          <ErrorState kind="notFound" />
          <ErrorState onRetry={() => {}} retrying />
        </div>
      </Case>

      <Case label="Skeletons">
        <div className="flex flex-col gap-6">
          <HomeSkeleton />
          <ApplianceGridSkeleton />
          <ServiceListSkeleton />
          <BookingListSkeleton />
          <TrackingSkeleton />
          <TicketListSkeleton />
          <ProfileSkeleton />
        </div>
      </Case>
    </Section>
  )
}
