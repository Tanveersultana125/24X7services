import Link from 'next/link'
import type { Route } from 'next'
import { cn } from '@/lib/cn'

/**
 * The one surface in the system. A card is a bordered white box; `raised` adds
 * the single elevation level, and `interactive` turns it into a link or button
 * with a hover state.
 */

interface CardBaseProps {
  raised?: boolean
  className?: string
  children: React.ReactNode
}

const base =
  'rounded-card border border-border bg-bg ' +
  'transition-[border-color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-out-soft)]'

export function Card({ raised = false, className, children }: CardBaseProps) {
  return (
    <div className={cn(base, raised && 'shadow-raised', className)}>
      {children}
    </div>
  )
}

interface CardLinkProps extends CardBaseProps {
  href: Route
  /** Announced in place of the card's own text where that text is not a label. */
  ariaLabel?: string
}

export function CardLink({
  href,
  ariaLabel,
  raised = false,
  className,
  children,
}: CardLinkProps) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={cn(
        base,
        'block hover:border-brand',
        raised && 'shadow-raised',
        className
      )}
    >
      {children}
    </Link>
  )
}

interface CardButtonProps extends CardBaseProps {
  onClick: () => void
  selected?: boolean
  disabled?: boolean
  ariaLabel?: string
}

export function CardButton({
  onClick,
  selected = false,
  disabled = false,
  ariaLabel,
  raised = false,
  className,
  children,
}: CardButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={ariaLabel}
      className={cn(
        base,
        'block w-full text-left',
        disabled
          ? 'cursor-not-allowed opacity-60'
          : 'hover:border-brand',
        // Two rings of border read as a thicker edge without the box shifting
        // by a pixel when it is picked.
        selected && 'border-brand ring-1 ring-brand',
        raised && 'shadow-raised',
        className
      )}
    >
      {children}
    </button>
  )
}
