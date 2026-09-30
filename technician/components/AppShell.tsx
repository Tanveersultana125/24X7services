'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Bell,
  ChevronRight,
  BriefcaseBusiness,
  Headset,
  History,
  House,
  LogOut,
  Map as MapIcon,
  Settings,
  Siren,
  Sparkles,
  Star,
  UserRound,
  Wallet,
  X,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { LANG_CODE, useT } from '@/lib/i18n'
import { recordPath } from '@/lib/nav'
import { useStore } from '@/lib/store'
import { Avatar, Toggle } from './ui'
import { AvailabilityToast } from './Availability'
import { IncomingRequest } from './IncomingRequest'
import { Logo } from './Logo'
import { MenuContext } from './menu'
import { TechnicianSheet } from './TechnicianSheet'

const TABS = [
  { href: '/home', label: 'Home', icon: House },
  { href: '/jobs', label: 'Jobs', icon: BriefcaseBusiness },
  { href: '/ai', label: 'AI Assist', icon: Sparkles },
  { href: '/earnings', label: 'Earnings', icon: Wallet },
  { href: '/profile', label: 'Profile', icon: UserRound },
] as const satisfies ReadonlyArray<{ href: Route; label: string; icon: typeof House }>

const SIDE = [
  { href: '/home', label: 'Dashboard', icon: House },
  { href: '/jobs', label: 'Jobs', icon: BriefcaseBusiness },
  { href: '/emergency', label: 'Emergency', icon: Siren },
  { href: '/ai', label: 'AI Assist', icon: Sparkles },
  { href: '/map', label: 'Map', icon: MapIcon },
  { href: '/earnings', label: 'Earnings', icon: Wallet },
  { href: '/history', label: 'Job history', icon: History },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/profile', label: 'Profile', icon: UserRound },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/support', label: 'Help & Support', icon: Headset },
] as const satisfies ReadonlyArray<{ href: Route; label: string; icon: typeof House }>

/** Which tab a screen belongs to, so /jobs/detail still lights up Jobs. */
function section(pathname: string): string {
  if (pathname.startsWith('/jobs') || pathname.startsWith('/request') || pathname.startsWith('/history') || pathname.startsWith('/map')) return '/jobs'
  if (pathname.startsWith('/settings') || pathname.startsWith('/support')) return '/profile'
  if (pathname.startsWith('/emergency') || pathname.startsWith('/notifications')) return '/home'
  return '/' + (pathname.split('/')[1] ?? '')
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const store = useStore()
  const bare = pathname === '/' || pathname.startsWith('/login')
  const [menuOpen, setMenuOpen] = useState(false)
  const t = useT()
  const lang = store.settings.language

  useEffect(() => {
    document.documentElement.lang = LANG_CODE[lang]
  }, [lang])

  useEffect(() => {
    recordPath(pathname, bare)
  }, [pathname, bare])

  useEffect(() => {
    if (store.ready && !store.signedIn && !bare) router.replace('/login')
  }, [store.ready, store.signedIn, bare, router])

  if (!store.ready) return <Splash />
  if (bare) return <>{children}</>
  if (!store.signedIn) return <Splash />

  const current = section(pathname)
  return (
    <MenuContext.Provider value={setMenuOpen}>
    <div className="lg:flex">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-card lg:flex">
        <SidebarBody />
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-[65] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-ink/50" onClick={() => setMenuOpen(false)} />
          <aside className="animate-drawer absolute inset-y-0 left-0 flex w-[82%] max-w-[300px] flex-col bg-card pt-[var(--safe-top)] pb-[var(--safe-bottom)] shadow-float">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
              className="absolute right-2 top-[calc(var(--safe-top)+0.75rem)] z-10 grid size-10 place-items-center rounded-full text-muted hover:bg-canvas"
            >
              <X className="size-5" />
            </button>
            <SidebarBody onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      <div className="min-w-0 flex-1">{children}</div>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card pb-[var(--safe-bottom)] lg:hidden"
      >
        <ul className="mx-auto flex max-w-lg">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = current === href
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-bold',
                    active ? 'text-brand' : 'text-faint'
                  )}
                >
                  {active && <span className="absolute inset-x-5 top-0 h-[3px] rounded-b-full bg-brand" />}
                  <Icon className="size-[22px]" strokeWidth={active ? 2.3 : 1.8} aria-hidden />
                  {t(label)}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <IncomingRequest />
      <AvailabilityToast />
    </div>
    </MenuContext.Provider>
  )
}

/** Logo, technician, every destination and the availability switch. */
function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const store = useStore()
  const emergencies = store.jobs.filter((j) => j.status === 'request' && j.priority === 'emergency').length
  const unread = store.notices.filter((n) => !n.read).length
  const [details, setDetails] = useState(false)
  const t = useT()
  return (
    <>
        <div className="flex h-16 items-center border-b border-line px-5">
          <Logo />
        </div>
        <button
          type="button"
          onClick={() => setDetails(true)}
          aria-label="Show technician details"
          className="group flex w-full items-center gap-3 border-b border-line px-5 py-4 text-left transition-colors hover:bg-canvas"
        >
          <span className="relative">
            <Avatar name={store.tech.name} photo={store.tech.photo} size={40} />
            <span className={cn('absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-card', store.online ? 'bg-success' : 'bg-faint')} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-extrabold">{store.tech.name}</span>
            <span className="num block text-xs font-semibold text-muted">{store.tech.id}</span>
            <span className="mt-0.5 flex items-center gap-1 text-[11px] font-bold text-muted">
              <Star className="size-3 fill-warning text-warning" aria-hidden />
              {store.tech.rating.toFixed(2)} · {store.tech.experienceYears} yrs exp.
            </span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-faint transition-transform group-hover:translate-x-0.5" aria-hidden />
        </button>
        <TechnicianSheet open={details} onClose={() => setDetails(false)} onProfile={onNavigate} />
        <nav aria-label="Primary" className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-0.5">
            {SIDE.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`)
              const badge = href === '/emergency' ? emergencies : href === '/notifications' ? unread : 0
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors',
                      active ? 'bg-brand-soft text-brand' : 'text-ink-2 hover:bg-canvas'
                    )}
                  >
                    <Icon className="size-[18px]" strokeWidth={active ? 2.3 : 1.9} aria-hidden />
                    <span className="flex-1">{t(label)}</span>
                    {badge > 0 && (
                      <span
                        className={cn(
                          'num grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-bold text-white',
                          href === '/emergency' ? 'bg-danger' : 'bg-brand'
                        )}
                      >
                        {badge}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
        <div className="border-t border-line p-4">
          <div
            className={cn(
              'flex items-center gap-2.5 rounded-xl border py-2 pl-3 pr-2',
              store.online ? 'border-success/30 bg-success-soft' : 'border-line-strong bg-canvas'
            )}
          >
            <span className={cn('size-2.5 shrink-0 rounded-full', store.online ? 'animate-blink bg-success' : 'bg-faint')} />
            <span className="min-w-0 flex-1">
              <span className={cn('block text-[10.5px] font-extrabold tracking-[0.12em]', store.online ? 'text-success' : 'text-muted')}>
                {t(store.online ? 'ONLINE' : 'OFFLINE')}
              </span>
              <span className="block truncate text-xs font-semibold text-ink-2">{t(store.online ? 'Receiving jobs' : 'Not receiving jobs')}</span>
            </span>
            <Toggle checked={store.online} onChange={store.setOnline} label="Availability" tone="success" />
          </div>
          <button
            type="button"
            onClick={() => {
              onNavigate?.()
              store.setOnline(false)
              store.signOut()
              router.replace('/login')
            }}
            className="mt-2 flex h-11 w-full items-center gap-2.5 rounded-xl px-3 text-left text-sm font-bold text-danger hover:bg-danger-soft"
          >
            <LogOut className="size-[18px]" aria-hidden />
            {t('Logout')}
          </button>
        </div>
    </>
  )
}

function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center bg-brand-ink">
      <div className="flex flex-col items-center gap-4">
        <Logo inverted large />
        <div className="h-1 w-24 overflow-hidden rounded-full bg-white/15">
          <div className="h-full w-1/2 animate-loader rounded-full bg-white/70" />
        </div>
      </div>
    </div>
  )
}
