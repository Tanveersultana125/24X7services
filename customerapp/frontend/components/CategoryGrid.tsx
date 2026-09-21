'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Route } from 'next'
import { ArrowRight, ChevronRight } from 'lucide-react'
import {
  formatPaise,
  type ApplianceId,
  type CatalogAppliance,
  type CatalogService,
  type ServiceKey,
} from '@app/shared'

import { BottomSheet } from '@/components/BottomSheet'
import { durationNote } from '@/components/ServiceRail'
import { cn } from '@/lib/cn'

/**
 * The grid of everything we service, as the first thing under the banners.
 *
 * It replaced a two-up grid of photo cards. Two-up meant a customer saw two and
 * a half appliances before scrolling, which is the wrong trade on the one
 * screen whose job is to show the whole range at a glance — so the tiles got
 * smaller, the photograph became a centred icon on a plain fill, and the label
 * moved outside the tile where it can run to two lines without being cropped.
 *
 * Tapping one opens a sheet rather than leaving the screen. The question a tap
 * on "Washing machine" is asking is "what do you do for it", and that has a
 * three-line answer — a whole page navigation to deliver three lines costs the
 * customer their place on Home and makes going back the price of looking.
 * From the sheet a booking is one more tap, so the grid is now two taps from a
 * draft instead of a page load and a scroll.
 *
 * No prices on the tiles. The grid is an index: it says what we touch, and the
 * sheet says what each thing costs. A "from" price on a tile is the cheapest
 * visit fee for that appliance, which across today's catalog is the same
 * number five times over — true, and indistinguishable from a bug.
 *
 * The last cell is the way out to the full list. It sits in the grid rather
 * than as a "See all" beside the heading because at three columns it also
 * completes the row: five appliances and one door out is two clean rows, and
 * the sixth appliance simply pushes it along.
 */

export interface CategoryGridProps {
  appliances: readonly CatalogAppliance[]
  /** Every active service, of every appliance. The sheet filters its own. */
  services: readonly CatalogService[]
  /** Starts a draft and sends the customer into the booking flow. */
  onBook: (applianceId: ApplianceId, serviceKey: ServiceKey) => void
  className?: string
}

export function CategoryGrid({
  appliances,
  services,
  onBook,
  className,
}: CategoryGridProps) {
  const [openId, setOpenId] = useState<ApplianceId | null>(null)

  const open = appliances.find((appliance) => appliance.id === openId)
  const openServices = services
    .filter((service) => service.applianceId === openId)
    .sort((a, b) => a.order - b.order)

  return (
    <>
      <ul
        className={cn(
          'grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 lg:grid-cols-6',
          className
        )}
      >
        {appliances.map((appliance, index) => {
          const has = services.some(
            (service) => service.applianceId === appliance.id
          )
          const tile = (
            <>
              <span className="relative block aspect-square w-full overflow-hidden rounded-card bg-surface transition-colors duration-[var(--duration-fast)] group-hover:bg-border">
                <Image
                  src={appliance.image}
                  alt=""
                  fill
                  // Roughly a third of a phone's width, and never larger than
                  // the 132px the tile reaches on a desktop.
                  sizes="(min-width: 1024px) 132px, 30vw"
                  // The three tiles above the fold, and no others: the rest of
                  // the grid can wait for layout.
                  priority={index < 3}
                  className="object-contain p-4"
                />
              </span>
              <span className="text-center text-xs font-semibold leading-tight text-ink">
                {appliance.name}
              </span>
            </>
          )

          return (
            <li key={appliance.id}>
              {/* An appliance whose services are all inactive has nothing to
                  put in a sheet, so it keeps the old behaviour rather than
                  opening an empty one. */}
              {has ? (
                <button
                  type="button"
                  onClick={() => setOpenId(appliance.id)}
                  aria-haspopup="dialog"
                  className="group flex w-full min-w-0 flex-col items-center gap-2"
                >
                  {tile}
                </button>
              ) : (
                <Link
                  href={`/services/appliance/?a=${appliance.id}` as Route}
                  className="group flex min-w-0 flex-col items-center gap-2"
                >
                  {tile}
                </Link>
              )}
            </li>
          )
        })}

        <li>
          <Link
            href="/services"
            className="group flex min-w-0 flex-col items-center gap-2"
            aria-label="See everything we service"
          >
            <span className="flex aspect-square w-full items-center justify-center rounded-card border border-dashed border-border transition-colors duration-[var(--duration-fast)] group-hover:border-brand">
              <ArrowRight className="size-5 text-muted" aria-hidden="true" />
            </span>
            <span className="text-center text-xs font-semibold leading-tight text-ink">
              All services
            </span>
          </Link>
        </li>
      </ul>

      <BottomSheet
        open={open !== undefined}
        onClose={() => setOpenId(null)}
        title={open?.name ?? ''}
        description="What we do for it, and what the visit costs."
        footer={
          open ? (
            <Link
              href={`/services/appliance/?a=${open.id}` as Route}
              className="flex min-h-11 items-center justify-center gap-1 text-sm font-semibold text-brand"
            >
              See everything for {open.name.toLowerCase()}
              <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          ) : null
        }
      >
        {/* Rows with a thumbnail, not a grid of full-size pictures. Every
            service of an appliance shares that appliance's one photograph, so
            four of them at tile size is the same image four times under four
            captions — which reads as a loading bug. At thumbnail size it does
            what a thumbnail is for: it anchors the row and says which
            appliance you are still looking at. ServiceRail draws its cards the
            same way, from the same image, for the same reason.

            The day a service is seeded its own artwork, this is the one place
            that has to change. */}
        <ul className="divide-y divide-border">
          {openServices.map((service) => (
            <li key={service.id}>
              <button
                type="button"
                onClick={() => {
                  setOpenId(null)
                  onBook(service.applianceId, service.serviceKey)
                }}
                className="flex w-full items-center gap-3 py-3 text-left"
              >
                {open ? (
                  <span className="relative block size-12 shrink-0 overflow-hidden rounded-card bg-surface">
                    <Image
                      src={open.image}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-contain p-1.5"
                    />
                  </span>
                ) : null}

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink">
                    {service.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {[durationNote(service.durationMinutes), 'Visit fee']
                      .filter(Boolean)
                      .join(' · ')}{' '}
                    {formatPaise(service.visitFee)}
                  </span>
                </span>

                <ChevronRight
                  className="size-4 shrink-0 text-muted"
                  aria-hidden="true"
                />
              </button>
            </li>
          ))}
        </ul>
      </BottomSheet>
    </>
  )
}
