import { cn } from '@/lib/cn'

/**
 * Skeletons stand in for content that is on its way, and they are shaped like
 * the thing they replace — a service card skeleton is card-shaped and
 * card-sized — so the page does not reflow when the data lands.
 *
 * Every skeleton block is aria-hidden and its container carries the live
 * region, so a screen reader hears "Loading" once instead of reading out a
 * dozen empty boxes.
 */

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'rounded-card bg-[linear-gradient(90deg,var(--color-surface)_25%,#ededed_50%,var(--color-surface)_75%)]',
        'bg-[length:200%_100%] motion-safe:animate-[shimmer_1.4s_linear_infinite]',
        className
      )}
    />
  )
}

export function SkeletonGroup({
  label = 'Loading',
  className,
  children,
}: {
  label?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}

export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          // The last line stops short, the way a paragraph actually ends.
          className={cn('h-4 rounded-md', i === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  )
}

export function ApplianceGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <SkeletonGroup
      label="Loading services"
      className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5"
    >
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-36" />
      ))}
    </SkeletonGroup>
  )
}

export function ServiceListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <SkeletonGroup label="Loading services" className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-28" />
      ))}
    </SkeletonGroup>
  )
}

export function BookingListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <SkeletonGroup label="Loading bookings" className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-40" />
      ))}
    </SkeletonGroup>
  )
}

export function TrackingSkeleton() {
  return (
    <SkeletonGroup label="Loading tracking" className="flex flex-col gap-4">
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-40 w-full" />
    </SkeletonGroup>
  )
}

export function TicketListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <SkeletonGroup label="Loading tickets" className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-24" />
      ))}
    </SkeletonGroup>
  )
}

export function ProfileSkeleton() {
  return (
    <SkeletonGroup label="Loading profile" className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Skeleton className="size-16 rounded-full" />
        <div className="flex-1">
          <SkeletonText lines={2} />
        </div>
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </SkeletonGroup>
  )
}

export function HomeSkeleton() {
  return (
    <SkeletonGroup label="Loading home" className="flex flex-col gap-8 pt-5">
      <Skeleton className="h-44 w-full" />
      <div>
        <Skeleton className="mb-3 h-6 w-40 rounded-md" />
        <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="mx-auto mt-2 h-3 w-4/5 rounded-md" />
            </div>
          ))}
        </div>
      </div>
      <div>
        <Skeleton className="mb-3 h-6 w-48 rounded-md" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-40 shrink-0">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="mt-2.5 h-4 w-full rounded-md" />
              <Skeleton className="mt-2 h-9 w-full rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </SkeletonGroup>
  )
}
