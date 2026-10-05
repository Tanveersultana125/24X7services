import { cn } from '@/lib/cn'

/**
 * The assistant's mark: a four-point spark on the brand's deep navy. Small and
 * square so it sits beside a chat bubble like an avatar, not a mascot.
 */
export function AiMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('grid shrink-0 place-items-center rounded-[30%] bg-brand-ink text-white', className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 24 24" style={{ width: size * 0.58, height: size * 0.58 }} fill="currentColor">
        <path d="M11 2.5c.3 0 .55.2.62.49l.86 3.44a5 5 0 0 0 3.64 3.64l3.44.86a.64.64 0 0 1 0 1.24l-3.44.86a5 5 0 0 0-3.64 3.64l-.86 3.44a.64.64 0 0 1-1.24 0l-.86-3.44a5 5 0 0 0-3.64-3.64l-3.44-.86a.64.64 0 0 1 0-1.24l3.44-.86a5 5 0 0 0 3.64-3.64l.86-3.44A.64.64 0 0 1 11 2.5Z" />
        <circle cx="19" cy="5" r="1.6" opacity=".7" />
      </svg>
    </span>
  )
}

/** A phone handset on the same tile, for the call agent. */
export function CallMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <span aria-hidden className={cn('grid shrink-0 place-items-center rounded-[30%] bg-success text-white', className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" style={{ width: size * 0.5, height: size * 0.5 }} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z" />
        <path d="M15 5a5 5 0 0 1 4 4M15 1.5a8.5 8.5 0 0 1 7.5 7.5" />
      </svg>
    </span>
  )
}
