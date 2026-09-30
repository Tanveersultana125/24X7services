'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { useRouter } from 'next/navigation'
import { useRef } from 'react'
import { Award, BadgeCheck, Camera, ChevronRight, Headset, History, LogOut, Mail, MapPin, Phone, Settings, ShieldCheck, Star } from 'lucide-react'
import { ApplianceGlyph } from '@/components/glyphs'
import { Avatar, Card, Page, ScreenHeader, SectionTitle, Toggle } from '@/components/ui'
import { APPLIANCES, APPLIANCE_LABEL, BRAND_LABEL, applianceTitle } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { shortDate, thisMonth } from '@/lib/format'
import { useStore } from '@/lib/store'

export default function ProfilePage() {
  const { tech, online, setOnline, updateTech, jobs, signOut } = useStore()
  const router = useRouter()
  const file = useRef<HTMLInputElement>(null)
  const closedHere = jobs.filter((j) => j.status === 'closed').length

  return (
    <>
      <ScreenHeader
        back="/home"
        title="Profile"
        right={
          <Link href="/settings" aria-label="Settings" className="grid size-11 place-items-center rounded-full hover:bg-canvas">
            <Settings className="size-5" />
          </Link>
        }
      />
      <Page className="space-y-5">
        <Card className="overflow-hidden">
          <div className="h-20 bg-brand-ink" />
          <div className="-mt-12 px-4 pb-4">
            <div className="flex items-end justify-between">
              <div className="relative">
                <Avatar name={tech.name} photo={tech.photo} size={88} className="ring-4 ring-card" />
                <button
                  type="button"
                  onClick={() => file.current?.click()}
                  aria-label="Change profile photo"
                  className="absolute bottom-0 right-0 grid size-8 place-items-center rounded-full border-2 border-card bg-brand text-white"
                >
                  <Camera className="size-4" />
                </button>
                <input
                  ref={file}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (!f) return
                    const r = new FileReader()
                    r.onload = () => {
                      const img = new Image()
                      img.onload = () => {
                        const c = document.createElement('canvas')
                        c.width = c.height = 240
                        const s = Math.min(img.width, img.height)
                        c.getContext('2d')!.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 240, 240)
                        updateTech({ photo: c.toDataURL('image/jpeg', 0.8) })
                      }
                      img.src = r.result as string
                    }
                    r.readAsDataURL(f)
                  }}
                />
              </div>
              <span className="mb-1 flex items-center gap-1 rounded-pill bg-success-soft px-2.5 py-1 text-xs font-extrabold text-success">
                <BadgeCheck className="size-4" /> Verified partner
              </span>
            </div>
            <h2 className="mt-3 text-xl font-extrabold tracking-tight">{tech.name}</h2>
            <p className="num text-sm font-bold text-muted">{tech.id}</p>
            <p className="mt-1 text-sm font-medium text-muted">Appliance service technician · since {tech.joined}</p>
          </div>
          <dl className="grid grid-cols-3 divide-x divide-line border-t border-line">
            <div className="p-3 text-center">
              <dd className="num flex items-center justify-center gap-1 text-lg font-extrabold">
                {tech.rating.toFixed(2)} <Star className="size-4 fill-warning text-warning" />
              </dd>
              <dt className="text-[11px] font-bold uppercase tracking-wide text-muted">Rating</dt>
            </div>
            <div className="p-3 text-center">
              <dd className="num text-lg font-extrabold">{(tech.completedJobs + closedHere).toLocaleString('en-IN')}</dd>
              <dt className="text-[11px] font-bold uppercase tracking-wide text-muted">Jobs done</dt>
            </div>
            <div className="p-3 text-center">
              <dd className="num text-lg font-extrabold">{tech.experienceYears} yrs</dd>
              <dt className="text-[11px] font-bold uppercase tracking-wide text-muted">Experience</dt>
            </div>
          </dl>
        </Card>

        <Card className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-extrabold">Availability</p>
            <p className={cn('text-xs font-bold', online ? 'text-success' : 'text-muted')}>{online ? 'ONLINE — receiving requests' : 'OFFLINE'}</p>
          </div>
          <Toggle checked={online} onChange={setOnline} label="Availability" tone="success" size="lg" />
        </Card>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <section>
            <SectionTitle>Contact & area</SectionTitle>
            <Card className="divide-y divide-line">
              <Row icon={<Phone className="size-4" />} label="Mobile" value={tech.phone} />
              <Row icon={<Mail className="size-4" />} label="Email" value={tech.email} />
              <Row icon={<MapPin className="size-4" />} label="Service area" value={tech.area} />
              <Row icon={<ShieldCheck className="size-4" />} label="Base" value={tech.base} />
            </Card>
          </section>

          <section>
            <SectionTitle>Certified for</SectionTitle>
            <Card className="p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-faint">Brands</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {tech.brands.map((b) => (
                  <span key={b} className="rounded-lg border border-line-strong px-3 py-1.5 text-sm font-extrabold">
                    {BRAND_LABEL[b]}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-faint">Appliances</p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {APPLIANCES.filter((a) => tech.appliances.includes(APPLIANCE_LABEL[a])).map((a) => (
                  <span key={a} className="flex items-center gap-2 rounded-lg bg-canvas px-3 py-2 text-sm font-bold">
                    <ApplianceGlyph appliance={a} className="size-4 text-brand" />
                    {APPLIANCE_LABEL[a]}
                  </span>
                ))}
              </div>
              <p className="mt-4 flex items-center gap-2 rounded-lg bg-brand-soft px-3 py-2 text-xs font-bold text-brand">
                <Award className="size-4" /> Inverter AC & front-load washer certified · valid till Mar 2027
              </p>
            </Card>
          </section>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Performance />
          <Reviews />
        </div>

        <Card className="divide-y divide-line">
          {(
            [
              ['/history', 'Job history', History],
              ['/settings', 'Settings', Settings],
              ['/support', 'Help & Support', Headset],
            ] as [Route, string, typeof History][]
          ).map(([href, label, Icon]) => (
            <Link key={href} href={href} className="flex items-center gap-3 p-4 hover:bg-canvas">
              <Icon className="size-5 text-ink-2" />
              <span className="flex-1 text-sm font-extrabold">{label}</span>
              <ChevronRight className="size-4 text-faint" />
            </Link>
          ))}
        </Card>
        <button
          type="button"
          onClick={() => {
            setOnline(false)
            signOut()
            router.replace('/login')
          }}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-xl border-2 border-danger/30 bg-card text-base font-extrabold text-danger hover:bg-danger-soft"
        >
          <LogOut className="size-5" /> Logout
        </button>
      </Page>
    </>
  )
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-canvas text-ink-2">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-faint">{label}</p>
        <p className="num truncate text-sm font-bold">{value}</p>
      </div>
    </div>
  )
}

/**
 * This month at a glance, worked out from the jobs on the device: how much
 * was finished, how punctual the arrivals were, how often offers were taken.
 */
function Performance() {
  const { jobs, tech } = useStore()
  const month = jobs.filter((j) => thisMonth(j.scheduledAt))
  const done = month.filter((j) => j.status === 'closed')
  const arrived = month.filter((j) => j.log.arrived)
  const onTime = arrived.filter((j) => new Date(j.log.arrived!).getTime() <= new Date(j.scheduledAt).getTime() + 15 * 60_000)
  const decided = jobs.filter((j) => j.log.accepted || j.status === 'rejected')
  const accepted = decided.filter((j) => j.status !== 'rejected')
  const rated = done.filter((j) => j.confirmation?.rating)
  const avg = rated.length ? rated.reduce((s, j) => s + j.confirmation!.rating, 0) / rated.length : tech.rating
  const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '—')
  const tiles: [string, string][] = [
    ['Jobs this month', String(done.length)],
    ['Avg rating', avg.toFixed(2)],
    ['On-time arrival', pct(onTime.length, arrived.length)],
    ['Acceptance rate', pct(accepted.length, decided.length)],
  ]
  return (
    <section>
      <SectionTitle>Performance</SectionTitle>
      <Card className="grid grid-cols-2 gap-px overflow-hidden bg-line">
        {tiles.map(([label, value]) => (
          <div key={label} className="bg-card p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-faint">{label}</p>
            <p className="num mt-1 text-xl font-extrabold">{value}</p>
          </div>
        ))}
      </Card>
    </section>
  )
}

function Reviews() {
  const { jobs, tech } = useStore()
  const reviews = jobs
    .filter((j) => j.confirmation?.review?.trim())
    .sort((a, b) => (b.confirmation!.at ?? b.scheduledAt).localeCompare(a.confirmation!.at ?? a.scheduledAt))
    .slice(0, 3)
  return (
    <section>
      <SectionTitle action={<span className="num text-xs font-bold text-muted">★ {tech.rating.toFixed(2)} · {tech.ratingCount.toLocaleString('en-IN')} ratings</span>}>
        Customer reviews
      </SectionTitle>
      <Card className="divide-y divide-line">
        {reviews.length === 0 ? (
          <p className="p-4 text-sm font-medium text-muted">Reviews customers leave at sign-off appear here.</p>
        ) : (
          reviews.map((j) => (
            <figure key={j.id} className="p-4">
              <div className="flex items-center gap-0.5" aria-label={`${j.confirmation!.rating} out of 5`}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={cn('size-3.5', n <= j.confirmation!.rating ? 'fill-warning text-warning' : 'text-line-strong')} aria-hidden />
                ))}
              </div>
              <blockquote className="mt-1.5 text-sm font-semibold text-ink">&ldquo;{j.confirmation!.review}&rdquo;</blockquote>
              <figcaption className="mt-1 text-xs font-medium text-muted">
                {j.customer.name} · {applianceTitle(j.brand, j.appliance)} · {shortDate(j.confirmation!.at ?? j.scheduledAt)}
              </figcaption>
            </figure>
          ))
        )}
      </Card>
    </section>
  )
}
