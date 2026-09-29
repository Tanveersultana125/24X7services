'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ArrowLeft, Flame, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { STATUS, type Tone } from '@/lib/status'
import type { JobStatus, Priority } from '@/lib/types'

/* ---------------------------------------------------------------- Buttons */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'dark'

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-deep active:bg-brand-ink disabled:bg-line-strong disabled:text-muted',
  secondary: 'bg-card text-ink border border-line-strong hover:border-ink-2 active:bg-canvas disabled:text-faint',
  ghost: 'text-brand hover:bg-brand-soft active:bg-brand-soft',
  danger: 'bg-danger text-white hover:brightness-95 active:brightness-90',
  success: 'bg-success text-white hover:brightness-95 active:brightness-90 disabled:bg-line-strong disabled:text-muted',
  dark: 'bg-ink text-white hover:bg-ink-2',
}

const sizes = {
  sm: 'h-9 px-3 text-sm gap-1.5 rounded-lg',
  md: 'h-11 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-14 px-5 text-base gap-2.5 rounded-xl',
}

export function buttonClass(variant: Variant = 'primary', size: keyof typeof sizes = 'md', className?: string) {
  return cn(
    'inline-flex shrink-0 items-center justify-center font-bold transition-[background-color,border-color,filter] duration-150 select-none disabled:cursor-not-allowed',
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

const toneClass: Record<Tone, { chip: string; dot: string; rail: string }> = {
  brand: { chip: 'bg-brand-soft text-brand border-brand/15', dot: 'bg-brand', rail: 'bg-brand' },
  warning: { chip: 'bg-warning-soft text-warning border-warning/20', dot: 'bg-warning', rail: 'bg-warning' },
  info: { chip: 'bg-info-soft text-info border-info/20', dot: 'bg-info', rail: 'bg-info' },
  violet: { chip: 'bg-violet-soft text-violet border-violet/20', dot: 'bg-violet', rail: 'bg-violet' },
  success: { chip: 'bg-success-soft text-success border-success/20', dot: 'bg-success', rail: 'bg-success' },
  danger: { chip: 'bg-danger-soft text-danger border-danger/20', dot: 'bg-danger', rail: 'bg-danger' },
  neutral: { chip: 'bg-canvas text-muted border-line', dot: 'bg-faint', rail: 'bg-line-strong' },
}

export function toneRail(tone: Tone) {
  return toneClass[tone].rail
}

export function Chip({ tone, children, live, className }: { tone: Tone; children: React.ReactNode; live?: boolean; className?: string }) {
  const t = toneClass[tone]
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-pill border px-2 text-[11px] font-bold',
        t.chip,
        className
      )}
    >
      <span className={cn('size-1.5 rounded-full', t.dot, live && 'animate-blink')} aria-hidden />
      {children}
    </span>
  )
}

export function StatusChip({ status, className }: { status: JobStatus; className?: string }) {
  const s = STATUS[status]
  const live = ['on_the_way', 'diagnosis', 'repair'].includes(status)
  return (
    <Chip tone={s.tone} live={live} className={className}>
      {s.label}
    </Chip>
  )
}

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  if (priority === 'emergency')
    return (
      <span
        className={cn(
          'inline-flex h-6 items-center gap-1 rounded-md bg-danger px-2 text-[10.5px] font-extrabold uppercase tracking-wider text-white',
          className
        )}
      >
        <Flame className="size-3.5" strokeWidth={2.4} aria-hidden />
        Emergency
      </span>
    )
  if (priority === 'high')
    return (
      <span
        className={cn(
          'inline-flex h-6 items-center rounded-md border border-warning/30 bg-warning-soft px-2 text-[10.5px] font-extrabold uppercase tracking-wider text-warning',
          className
        )}
      >
        High priority
      </span>
    )
  return (
    <span className={cn('inline-flex h-6 items-center rounded-md bg-canvas px-2 text-[10.5px] font-bold uppercase tracking-wider text-muted', className)}>
      Normal
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

export function SectionTitle({
  children,
  action,
  count,
  className,
}: {
  children: React.ReactNode
  action?: React.ReactNode
  count?: number
  className?: string
}) {
  return (
    <div className={cn('mb-3 flex items-end justify-between gap-3', className)}>
      <h2 className="flex items-center gap-2 text-[15px] font-extrabold tracking-tight text-ink">
        {children}
        {count !== undefined && (
          <span className="num rounded-md bg-ink/[0.06] px-1.5 py-0.5 text-xs font-bold text-muted">{count}</span>
        )}
      </h2>
      {action}
    </div>
  )
}

export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('text-[11px] font-bold uppercase tracking-[0.08em] text-faint', className)}>{children}</div>
}

/* ---------------------------------------------------------------- Inputs */

export function Toggle({
  checked,
  onChange,
  label,
  tone = 'brand',
  size = 'md',
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  tone?: 'brand' | 'success'
  size?: 'md' | 'lg'
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200',
        size === 'lg' ? 'h-8 w-14' : 'h-6 w-11',
        checked ? (tone === 'success' ? 'bg-success' : 'bg-brand') : 'bg-line-strong'
      )}
    >
      <span
        className={cn(
          'absolute rounded-full bg-white shadow transition-transform duration-200',
          size === 'lg' ? 'left-1 size-6' : 'left-0.5 size-5',
          checked && (size === 'lg' ? 'translate-x-6' : 'translate-x-5')
        )}
      />
    </button>
  )
}

export const inputClass =
  'w-full rounded-xl border border-line-strong bg-card px-3.5 py-3 text-base text-ink transition-[border-color,box-shadow] focus:border-brand focus:shadow-[0_0_0_3px_rgba(37,71,208,0.15)]'

export function Field({ label, hint, children }: { label: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-ink-2">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = 'md',
}: {
  value: T
  onChange: (v: T) => void
  options: readonly { value: T; label: React.ReactNode }[]
  className?: string
  size?: 'sm' | 'md'
}) {
  return (
    <div role="tablist" className={cn('flex rounded-xl bg-ink/[0.06] p-1', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          type="button"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'flex-1 rounded-lg px-2 font-bold transition-colors',
            size === 'sm' ? 'h-8 text-xs' : 'h-10 text-sm',
            value === o.value ? 'bg-card text-ink shadow-card' : 'text-muted hover:text-ink'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-pill border px-3.5 text-[13px] font-bold transition-colors',
        active ? 'border-ink bg-ink text-white' : 'border-line-strong bg-card text-ink-2 hover:border-ink-2'
      )}
    >
      {children}
    </button>
  )
}

/* ---------------------------------------------------------------- Chrome */

/** The header every inner screen wears on a phone. */
export function ScreenHeader({
  title,
  subtitle,
  back,
  right,
}: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  back?: Route | true
  right?: React.ReactNode
}) {
  const router = useRouter()
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-card/95 pt-[var(--safe-top)] backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-2 lg:h-16 lg:px-8">
        {back &&
          (back === true ? (
            <button
              type="button"
              aria-label="Back"
              onClick={() => router.back()}
              className="grid size-11 place-items-center rounded-full text-ink hover:bg-canvas"
            >
              <ArrowLeft className="size-5" />
            </button>
          ) : (
            <Link href={back} aria-label="Back" className="grid size-11 place-items-center rounded-full text-ink hover:bg-canvas">
              <ArrowLeft className="size-5" />
            </Link>
          ))}
        <div className={cn('min-w-0 flex-1', !back && 'pl-2 lg:pl-0')}>
          <h1 className="truncate text-[17px] font-extrabold tracking-tight lg:text-xl">{title}</h1>
          {subtitle && <p className="truncate text-xs font-medium text-muted">{subtitle}</p>}
        </div>
        {right && <div className="flex items-center gap-1 pr-1">{right}</div>}
      </div>
    </header>
  )
}

export function Page({ children, className }: { children: React.ReactNode; className?: string }) {
  return <main className={cn('mx-auto w-full max-w-5xl px-4 pb-32 pt-4 lg:px-8 lg:pb-16 lg:pt-6', className)}>{children}</main>
}

/** Buttons pinned above the bottom nav (phone) or at the end of content (desktop). */
export function ActionDock({ children, withNav = true }: { children: React.ReactNode; withNav?: boolean }) {
  return (
    <div
      className={cn(
        'fixed inset-x-0 z-30 border-t border-line bg-card/95 px-4 py-3 backdrop-blur lg:sticky lg:bottom-0 lg:mt-6 lg:rounded-card lg:border',
        withNav ? 'bottom-[calc(64px+var(--safe-bottom))] lg:bottom-4' : 'bottom-0 pb-[calc(0.75rem+var(--safe-bottom))] lg:bottom-4'
      )}
    >
      <div className="mx-auto flex max-w-5xl gap-2.5">{children}</div>
    </div>
  )
}

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: React.ReactNode
  children: React.ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-ink/50" onClick={onClose} />
      <div className="animate-slide-up relative max-h-[88dvh] w-full overflow-y-auto rounded-t-2xl bg-card pb-[var(--safe-bottom)] sm:max-w-lg sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-card px-4 py-3">
          <h2 className="text-base font-extrabold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-10 place-items-center rounded-full hover:bg-canvas">
            <X className="size-5" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

export function Empty({ icon, title, body }: { icon: React.ReactNode; title: string; body?: string }) {
  return (
    <div className="flex flex-col items-center rounded-card border border-dashed border-line-strong bg-card px-6 py-10 text-center">
      <div className="mb-3 grid size-12 place-items-center rounded-full bg-canvas text-muted">{icon}</div>
      <p className="font-bold">{title}</p>
      {body && <p className="mt-1 max-w-xs text-sm text-muted">{body}</p>}
    </div>
  )
}

export function Avatar({ name, photo, size = 44, className }: { name: string; photo?: string; size?: number; className?: string }) {
  const letters = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
  return photo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={photo} alt="" width={size} height={size} className={cn('shrink-0 rounded-full object-cover', className)} style={{ width: size, height: size }} />
  ) : (
    <span
      aria-hidden
      className={cn('grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#3b5ce0] to-[#152a7a] font-extrabold text-white', className)}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {letters}
    </span>
  )
}
