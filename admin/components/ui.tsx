'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowDownRight, ArrowLeft, ArrowUpRight, Check, ChevronDown, Search, Star, UserRound, Wrench, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { BOOKING_STATUS, PRIORITY, type Tone } from '@/lib/status'
import type { BookingStatus, Priority } from '@/lib/types'
import { initials } from '@/lib/format'

/* ---------------------------------------------------------------- Buttons */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'subtle'

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-deep active:bg-brand-ink disabled:bg-line-strong disabled:text-muted',
  secondary: 'bg-card text-ink border border-line-strong hover:border-ink-2 hover:bg-canvas/60 disabled:text-faint',
  ghost: 'text-brand hover:bg-brand-soft',
  subtle: 'text-ink-2 hover:bg-canvas',
  danger: 'bg-danger text-white hover:brightness-95 active:brightness-90 disabled:opacity-50',
  success: 'bg-success text-white hover:brightness-95 active:brightness-90 disabled:bg-line-strong disabled:text-muted',
}

const sizes = {
  xs: 'h-7 px-2.5 text-xs gap-1 rounded-md',
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg',
}

export function buttonClass(variant: Variant = 'primary', size: keyof typeof sizes = 'md', className?: string) {
  return cn(
    'inline-flex shrink-0 items-center justify-center whitespace-nowrap font-bold transition-[background-color,border-color,filter] duration-150 select-none disabled:cursor-not-allowed [&_svg]:size-4',
    variants[variant],
    sizes[size],
    className
  )
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: keyof typeof sizes }) {
  return <button type="button" className={buttonClass(variant, size, className)} {...props} />
}

/* ----------------------------------------------------------------- Chips */

const toneClass: Record<Tone, { chip: string; dot: string; soft: string; text: string }> = {
  brand: { chip: 'bg-brand-soft text-brand border-brand/15', dot: 'bg-brand', soft: 'bg-brand-soft', text: 'text-brand' },
  warning: { chip: 'bg-warning-soft text-warning border-warning/20', dot: 'bg-warning', soft: 'bg-warning-soft', text: 'text-warning' },
  info: { chip: 'bg-info-soft text-info border-info/20', dot: 'bg-info', soft: 'bg-info-soft', text: 'text-info' },
  violet: { chip: 'bg-violet-soft text-violet border-violet/20', dot: 'bg-violet', soft: 'bg-violet-soft', text: 'text-violet' },
  success: { chip: 'bg-success-soft text-success border-success/20', dot: 'bg-success', soft: 'bg-success-soft', text: 'text-success' },
  danger: { chip: 'bg-danger-soft text-danger border-danger/20', dot: 'bg-danger', soft: 'bg-danger-soft', text: 'text-danger' },
  neutral: { chip: 'bg-canvas text-muted border-line', dot: 'bg-faint', soft: 'bg-canvas', text: 'text-muted' },
}

export const tone = (t: Tone) => toneClass[t]

export function Chip({ tone: t, children, live, className, dot = true }: { tone: Tone; children: React.ReactNode; live?: boolean; className?: string; dot?: boolean }) {
  const c = toneClass[t]
  return (
    <span className={cn('inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-pill border px-2 text-[11px] font-bold', c.chip, className)}>
      {dot && <span className={cn('size-1.5 rounded-full', c.dot, live && 'animate-blink')} aria-hidden />}
      {children}
    </span>
  )
}

export function StatusChip({ status, className }: { status: BookingStatus; className?: string }) {
  const s = BOOKING_STATUS[status]
  return (
    <Chip tone={s.tone} live={status === 'en_route' || status === 'in_progress'} className={className}>
      {s.label}
    </Chip>
  )
}

export function PriorityTag({ priority }: { priority: Priority }) {
  if (priority === 'normal') return <span className="text-xs font-semibold text-faint">Normal</span>
  const p = PRIORITY[priority]
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center rounded px-1.5 text-[10px] font-extrabold uppercase tracking-wider',
        priority === 'emergency' ? 'bg-danger text-white' : 'border border-warning/30 bg-warning-soft text-warning'
      )}
    >
      {p.label}
    </span>
  )
}

export function Rating({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn('num inline-flex items-center gap-1 text-[13px] font-bold', className)}>
      <Star className="size-3.5 fill-warning text-warning" aria-hidden />
      {value ? value.toFixed(2) : '—'}
    </span>
  )
}

/* ------------------------------------------------------------- Surfaces */

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('rounded-card border border-line bg-card shadow-card', className)} {...rest}>
      {children}
    </div>
  )
}

export function CardHeader({ title, sub, action, className }: { title: React.ReactNode; sub?: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-start justify-between gap-3 border-b border-line px-5 py-4', className)}>
      <div className="min-w-0">
        <h2 className="text-[15px] font-extrabold tracking-tight">{title}</h2>
        {sub && <p className="mt-0.5 text-xs font-medium text-muted">{sub}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  )
}

/** Title row every screen opens with: what it is, then what you can do. */
export function PageHeader({ title, sub, actions, side }: { title: string; sub?: React.ReactNode; actions?: React.ReactNode; side?: Side }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {side && <SideTag side={side} className="mb-2" />}
        <h1 className="text-[22px] font-extrabold tracking-tight sm:text-2xl">{title}</h1>
        {sub && <p className="mt-1 text-sm font-medium text-muted">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Page({ children, className }: { children: React.ReactNode; className?: string }) {
  return <main className={cn('mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8', className)}>{children}</main>
}

export function StatCard({
  label,
  value,
  icon,
  toneName = 'brand',
  delta,
  hint,
  href,
}: {
  label: string
  value: React.ReactNode
  icon: React.ReactNode
  toneName?: Tone
  /** Percent change against the comparison period; positive is good unless `invert`. */
  delta?: { value: number; label: string; invert?: boolean }
  hint?: React.ReactNode
  href?: Route
}) {
  const t = toneClass[toneName]
  const good = delta ? (delta.invert ? delta.value <= 0 : delta.value >= 0) : true
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-bold text-muted">{label}</p>
        <span className={cn('grid size-9 shrink-0 place-items-center rounded-lg [&_svg]:size-[18px]', t.soft, t.text)}>{icon}</span>
      </div>
      <p className="num mt-1 text-[26px] font-extrabold leading-tight tracking-tight">{value}</p>
      <div className="mt-2 flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-muted">
        {delta && (
          <span className={cn('num inline-flex items-center gap-0.5 rounded px-1 py-0.5 font-bold', good ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger')}>
            {delta.value >= 0 ? <ArrowUpRight className="size-3.5" aria-hidden /> : <ArrowDownRight className="size-3.5" aria-hidden />}
            {Math.abs(delta.value).toFixed(0)}%
          </span>
        )}
        {delta && <span>{delta.label}</span>}
        {hint}
      </div>
    </>
  )
  const cls = 'block rounded-card border border-line bg-card p-4 shadow-card sm:p-5'
  return href ? (
    <Link href={href} className={cn(cls, 'transition-colors hover:border-line-strong')}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  )
}

/* ---------------------------------------------------------------- Inputs */

export function Toggle({ checked, onChange, label, size = 'md', disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; size?: 'sm' | 'md'; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'h-5 w-9' : 'h-6 w-11',
        checked ? 'bg-brand' : 'bg-line-strong'
      )}
    >
      <span
        className={cn(
          'absolute left-0.5 rounded-full bg-white shadow transition-transform duration-200',
          size === 'sm' ? 'size-4' : 'size-5',
          checked && (size === 'sm' ? 'translate-x-4' : 'translate-x-5')
        )}
      />
    </button>
  )
}

export const inputClass =
  'w-full rounded-lg border border-line-strong bg-card px-3 py-2 text-sm text-ink transition-[border-color,box-shadow] focus:border-brand focus:shadow-[0_0_0_3px_rgba(37,71,208,0.15)]'

export function Field({ label, hint, children, className }: { label: string; hint?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block text-[13px] font-bold text-ink-2">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

export function SearchInput({ value, onChange, placeholder, className }: { value: string; onChange: (v: string) => void; placeholder: string; className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(inputClass, 'h-10 pl-9')}
      />
    </div>
  )
}

/**
 * A dropdown that fits a phone. The browser's own list opens as a tall panel
 * that runs off small screens, so this draws its own: a bottom sheet below
 * `sm`, a popover beside the button above it. Same props as a <select>.
 */
export function Select<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
  disabled,
  full,
}: {
  value: T
  onChange: (v: T) => void
  options: readonly { value: T; label: string }[]
  label: string
  className?: string
  disabled?: boolean
  /** Form-field style: full width, regular weight. */
  full?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [active, setActive] = useState(0)
  const btn = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const current = options.find((o) => o.value === value)

  const show = () => {
    if (disabled || !btn.current) return
    setRect(btn.current.getBoundingClientRect())
    setActive(Math.max(0, options.findIndex((o) => o.value === value)))
    setOpen(true)
  }
  const pick = (v: T) => {
    onChange(v)
    setOpen(false)
    btn.current?.focus()
  }

  useEffect(() => {
    if (!open) return
    const close = (e: Event) => {
      if (list.current?.contains(e.target as Node) || btn.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    const onResize = () => setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('scroll', close, true)
    window.addEventListener('resize', onResize)
    list.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', onResize)
    }
  }, [open])

  const onKey = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        show()
      }
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const next = (active + (e.key === 'ArrowDown' ? 1 : options.length - 1)) % options.length
      setActive(next)
      list.current?.children[next]?.scrollIntoView({ block: 'nearest' })
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const o = options[active]
      if (o) pick(o.value)
    }
  }

  const phone = typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches
  const below = rect ? window.innerHeight - rect.bottom : 0
  const up = rect ? below < 300 && rect.top > below : false

  const items = (
    <ul ref={list} role="listbox" aria-label={label} className={cn('overflow-y-auto overscroll-contain', phone ? 'max-h-[60dvh] px-2 pb-2' : 'max-h-72 p-1')}>
      {options.map((o, i) => {
        const on = o.value === value
        return (
          <li
            key={o.value}
            role="option"
            aria-selected={on}
            onMouseEnter={() => setActive(i)}
            onClick={() => pick(o.value)}
            className={cn(
              'flex cursor-pointer items-center gap-2 rounded-lg px-3 text-sm',
              phone ? 'h-12 font-semibold' : 'h-9 font-medium',
              i === active && 'bg-canvas',
              on ? 'font-bold text-brand' : 'text-ink'
            )}
          >
            <span className="min-w-0 flex-1 truncate">{o.label}</span>
            {on && <Check className="size-4 shrink-0" aria-hidden />}
          </li>
        )
      })}
    </ul>
  )

  return (
    <>
      <button
        ref={btn}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${current?.label ?? ''}`}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKey}
        className={cn(
          inputClass,
          'flex h-10 items-center gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60',
          full ? 'w-full font-medium' : 'w-auto font-semibold',
          open && 'border-brand shadow-[0_0_0_3px_rgba(37,71,208,0.15)]',
          className
        )}
      >
        <span className="min-w-0 flex-1 truncate">{current?.label ?? label}</span>
        <ChevronDown className={cn('size-4 shrink-0 text-muted transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open &&
        rect &&
        createPortal(
          phone ? (
            <div className="fixed inset-0 z-[95] flex items-end" onKeyDown={onKey}>
              <button type="button" aria-label="Close" className="animate-fade absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
              <div className="animate-slide-up relative w-full rounded-t-2xl bg-card pb-[env(safe-area-inset-bottom)] shadow-float">
                <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-line-strong" aria-hidden />
                <div className="flex items-center justify-between px-5 pb-2 pt-3">
                  <p className="text-[15px] font-extrabold">{label}</p>
                  <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="-mr-2 grid size-9 place-items-center rounded-lg text-muted hover:bg-canvas">
                    <X className="size-5" />
                  </button>
                </div>
                {items}
              </div>
            </div>
          ) : (
            <div
              className="animate-fade fixed z-[95] rounded-xl border border-line bg-card shadow-float"
              style={{
                left: Math.min(rect.left, window.innerWidth - Math.max(rect.width, 200) - 8),
                minWidth: Math.max(rect.width, 200),
                ...(up ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }),
              }}
            >
              {items}
            </div>
          ),
          document.body
        )}
    </>
  )
}

/** Underlined tabs with counts — the status filter on every list. */
export function Tabs<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T
  onChange: (v: T) => void
  options: readonly { value: T; label: string; count?: number; alert?: boolean }[]
  className?: string
}) {
  return (
    <div role="tablist" className={cn('no-scrollbar flex gap-1 overflow-x-auto border-b border-line', className)}>
      {options.map((o) => {
        const on = value === o.value
        return (
          <button
            key={o.value}
            role="tab"
            type="button"
            aria-selected={on}
            onClick={() => onChange(o.value)}
            className={cn(
              'relative flex h-11 shrink-0 items-center gap-2 px-3 text-sm font-bold transition-colors',
              on ? 'text-brand' : 'text-muted hover:text-ink'
            )}
          >
            {o.label}
            {o.count !== undefined && (
              <span
                className={cn(
                  'num rounded-md px-1.5 py-0.5 text-[11px] font-bold',
                  o.alert && o.count > 0 ? 'bg-danger text-white' : on ? 'bg-brand-soft text-brand' : 'bg-canvas text-muted'
                )}
              >
                {o.count}
              </span>
            )}
            {on && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand" />}
          </button>
        )
      })}
    </div>
  )
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T
  onChange: (v: T) => void
  options: readonly { value: T; label: React.ReactNode }[]
  className?: string
}) {
  return (
    <div role="tablist" className={cn('inline-flex rounded-lg bg-ink/[0.06] p-0.5', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          type="button"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'h-8 rounded-md px-3 text-[13px] font-bold transition-colors',
            value === o.value ? 'bg-card text-ink shadow-card' : 'text-muted hover:text-ink'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* ---------------------------------------------------------------- Tables */

export function TableWrap({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">{children}</table>
    </div>
  )
}

export const th = 'whitespace-nowrap border-b border-line bg-canvas/60 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.06em] text-faint first:pl-5 last:pr-5'
export const td = 'border-b border-line px-4 py-3 align-middle first:whitespace-nowrap first:pl-5 last:pr-5'
export const tr = 'transition-colors hover:bg-canvas/70'

/* ---------------------------------------------------------------- Overlays */

/**
 * How many overlays hold the page still. A count, not a saved "previous"
 * value: a drawer and the modal on top of it re-run their effects in an
 * order React does not promise, and restoring a saved value left the page
 * stuck at overflow:hidden — no scrolling at all on a phone.
 */
let locks = 0

function lockScroll() {
  locks++
  document.body.style.overflow = 'hidden'
  return () => {
    locks = Math.max(0, locks - 1)
    if (locks === 0) document.body.style.overflow = ''
  }
}

function useEscape(open: boolean, onClose: () => void) {
  const close = useRef(onClose)
  useEffect(() => {
    close.current = onClose
  })
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close.current()
    document.addEventListener('keydown', onKey)
    const unlock = lockScroll()
    return () => {
      document.removeEventListener('keydown', onKey)
      unlock()
    }
  }, [open])
}

/** A record's detail, slid in from the right so the list stays in view. */
export function Drawer({
  open,
  onClose,
  title,
  sub,
  children,
  footer,
  width = 'max-w-xl',
}: {
  open: boolean
  onClose: () => void
  title: React.ReactNode
  sub?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  width?: string
}) {
  useEscape(open, onClose)
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true">
      <button type="button" aria-label="Close" className="animate-fade absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className={cn('animate-panel absolute inset-y-0 right-0 flex w-full flex-col bg-card shadow-float', width)}>
        <div className="flex items-start gap-2 border-b border-line px-3 py-3 sm:gap-3 sm:px-5 sm:py-4">
          {/* On a phone the drawer fills the screen, so it leads with Back like any page. */}
          <button type="button" onClick={onClose} aria-label="Back" className="grid size-10 shrink-0 place-items-center rounded-lg text-ink hover:bg-canvas sm:hidden">
            <ArrowLeft className="size-5" />
          </button>
          <div className="min-w-0 flex-1 pt-1.5 sm:pt-0">
            <h2 className="truncate text-lg font-extrabold tracking-tight">{title}</h2>
            {sub && <div className="mt-0.5 text-[13px] font-medium text-muted">{sub}</div>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 hidden size-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-canvas hover:text-ink sm:grid">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-canvas/50 px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  useEscape(open, onClose)
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <button type="button" aria-label="Close" className="animate-fade absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="animate-slide-up relative max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl bg-card shadow-float sm:max-w-md sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-base font-extrabold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 grid size-9 place-items-center rounded-lg text-muted hover:bg-canvas">
            <X className="size-5" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body
  )
}

export function Empty({ icon, title, body }: { icon: React.ReactNode; title: string; body?: string }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-3 grid size-12 place-items-center rounded-full bg-canvas text-muted [&_svg]:size-5">{icon}</div>
      <p className="font-bold">{title}</p>
      {body && <p className="mt-1 max-w-xs text-sm text-muted">{body}</p>}
    </div>
  )
}

const AVATAR_BG = ['from-[#3b5ce0] to-[#152a7a]', 'from-[#0e8f8f] to-[#0b4f5c]', 'from-[#7a4fd8] to-[#3c1f86]', 'from-[#d0702c] to-[#8a3a12]', 'from-[#2f8a4f] to-[#12502a]']

export type Side = 'customer' | 'technician'

const SIDE_BG: Record<Side, string> = {
  customer: 'from-[#0ea5e9] to-[#075985]',
  technician: 'from-[#10b981] to-[#065f46]',
}

/** Initials in a circle: blue for a customer, green for a technician, mixed for staff. */
export function Avatar({ name, size = 36, className, side }: { name: string; size?: number; className?: string; side?: Side }) {
  const h = [...name].reduce((s, c) => s + c.charCodeAt(0), 0)
  return (
    <span
      aria-hidden
      className={cn('grid shrink-0 place-items-center rounded-full bg-gradient-to-br font-extrabold text-white', side ? SIDE_BG[side] : AVATAR_BG[h % AVATAR_BG.length], className)}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(name)}
    </span>
  )
}

/** Names which side of the network a record belongs to. */
export function SideTag({ side, className, label }: { side: Side; className?: string; label?: string }) {
  const Icon = side === 'customer' ? UserRound : Wrench
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1 rounded-md px-2 text-[11px] font-extrabold uppercase tracking-[0.06em]',
        side === 'customer' ? 'bg-cust-soft text-cust' : 'bg-tech-soft text-tech',
        className
      )}
    >
      <Icon className="size-3.5" strokeWidth={2.4} aria-hidden />
      {label ?? (side === 'customer' ? 'Customer side' : 'Technician side')}
    </span>
  )
}

/** A label/value pair inside a drawer. */
export function Detail({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-[11px] font-bold uppercase tracking-[0.06em] text-faint">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-ink">{children}</dd>
    </div>
  )
}

export function SectionLabel({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-2.5 mt-6 flex items-center justify-between first:mt-0">
      <h3 className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-faint">{children}</h3>
      {action}
    </div>
  )
}

/** Simple previous/next pager under a long table. */
export function Pager({ page, pages, total, onPage }: { page: number; pages: number; total: number; onPage: (p: number) => void }) {
  if (pages <= 1) return <p className="px-5 py-3 text-xs font-semibold text-muted">{total.toLocaleString('en-IN')} results</p>
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3">
      <p className="text-xs font-semibold text-muted">
        Page <span className="num font-bold text-ink">{page + 1}</span> of <span className="num">{pages}</span> · {total.toLocaleString('en-IN')} results
      </p>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" disabled={page === 0} onClick={() => onPage(page - 1)}>
          Previous
        </Button>
        <Button size="sm" variant="secondary" disabled={page >= pages - 1} onClick={() => onPage(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  )
}
