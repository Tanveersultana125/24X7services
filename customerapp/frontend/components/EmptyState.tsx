import type { LucideIcon } from 'lucide-react'
import type { Route } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

/**
 * An empty list is not an error, and it should not read like one. Every empty
 * state names what is missing and offers the one action that fills it.
 */

export type EmptyAction =
  | { label: string; href: Route }
  | { label: string; onClick: () => void }

export interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: EmptyAction
  className?: string
}

const actionClasses =
  'mt-2 inline-flex min-h-11 items-center justify-center rounded-pill ' +
  'bg-ink px-5 text-sm font-semibold text-bg'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-14 text-center',
        className
      )}
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-surface">
        <Icon className="size-6 text-muted" aria-hidden="true" />
      </span>
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="max-w-xs text-sm text-muted">{description}</p>

      {action ? (
        'href' in action ? (
          <Link href={action.href} className={actionClasses}>
            {action.label}
          </Link>
        ) : (
          <Button className="mt-2" size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        )
      ) : null}
    </div>
  )
}
