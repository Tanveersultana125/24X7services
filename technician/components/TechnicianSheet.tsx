'use client'

import Link from 'next/link'
import { BadgeCheck, BriefcaseBusiness, CalendarDays, Mail, MapPin, Phone, ShieldCheck, Star } from 'lucide-react'
import { APPLIANCES, APPLIANCE_LABEL, BRAND_LABEL } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { useStore } from '@/lib/store'
import { ApplianceGlyph } from './glyphs'
import { Avatar, Sheet } from './ui'

/** The technician at a glance, opened from the menu header. */
export function TechnicianSheet({ open, onClose, onProfile }: { open: boolean; onClose: () => void; onProfile?: () => void }) {
  const { tech, online, jobs } = useStore()
  const done = tech.completedJobs + jobs.filter((j) => j.status === 'closed').length

  return (
    <Sheet open={open} onClose={onClose} title="Technician details">
      <div className="flex items-center gap-4">
        <span className="relative">
          <Avatar name={tech.name} photo={tech.photo} size={64} />
          <span className={cn('absolute bottom-0.5 right-0.5 size-3.5 rounded-full border-2 border-card', online ? 'bg-success' : 'bg-faint')} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-extrabold tracking-tight">{tech.name}</p>
          <p className="num text-sm font-bold text-muted">{tech.id}</p>
          <p className="mt-1 flex items-center gap-2 text-xs font-bold">
            <span className="flex items-center gap-1 text-success">
              <BadgeCheck className="size-3.5" /> Verified
            </span>
            <span className={online ? 'text-success' : 'text-muted'}>{online ? '● Online' : '● Offline'}</span>
          </p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-3 divide-x divide-line rounded-xl border border-line bg-canvas text-center">
        <div className="py-2.5">
          <dd className="num flex items-center justify-center gap-1 text-base font-extrabold">
            {tech.rating.toFixed(2)} <Star className="size-3.5 fill-warning text-warning" />
          </dd>
          <dt className="text-[11px] font-semibold text-muted">{tech.ratingCount.toLocaleString('en-IN')} ratings</dt>
        </div>
        <div className="py-2.5">
          <dd className="num text-base font-extrabold">{done.toLocaleString('en-IN')}</dd>
          <dt className="text-[11px] font-semibold text-muted">Jobs done</dt>
        </div>
        <div className="py-2.5">
          <dd className="num text-base font-extrabold">{tech.experienceYears} yrs</dd>
          <dt className="text-[11px] font-semibold text-muted">Experience</dt>
        </div>
      </dl>

      <ul className="mt-4 divide-y divide-line text-sm">
        {(
          [
            [Phone, 'Mobile', tech.phone],
            [Mail, 'Email', tech.email],
            [MapPin, 'Service area', tech.area],
            [ShieldCheck, 'Base', tech.base],
            [CalendarDays, 'Partner since', tech.joined],
          ] as const
        ).map(([Icon, label, value]) => (
          <li key={label} className="flex items-center gap-3 py-2.5">
            <Icon className="size-4 shrink-0 text-muted" />
            <span className="w-24 shrink-0 text-xs font-bold uppercase tracking-wider text-faint">{label}</span>
            <span className="num min-w-0 truncate font-semibold">{value}</span>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-faint">Brands</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {tech.brands.map((b) => (
          <span key={b} className="rounded-md border border-line-strong px-2 py-1 text-xs font-extrabold">
            {BRAND_LABEL[b]}
          </span>
        ))}
      </div>
      <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-faint">Appliances</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {APPLIANCES.map((a) => (
          <span key={a} className="flex items-center gap-1.5 rounded-md bg-canvas px-2 py-1 text-xs font-bold">
            <ApplianceGlyph appliance={a} className="size-3.5 text-brand" />
            {APPLIANCE_LABEL[a]}
          </span>
        ))}
      </div>

      <Link
        href="/profile"
        onClick={() => {
          onClose()
          onProfile?.()
        }}
        className="mt-5 flex h-12 items-center justify-center gap-2 rounded-xl bg-brand text-sm font-extrabold text-white hover:bg-brand-deep"
      >
        <BriefcaseBusiness className="size-4" /> View full profile
      </Link>
    </Sheet>
  )
}
