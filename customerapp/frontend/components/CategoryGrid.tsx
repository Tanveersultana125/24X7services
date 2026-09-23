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
 *
 * Tapping a service in that sheet does leave, for the appliance page, opened
 * at that service. It used to start a booking draft outright, which was one
 * tap quicker and asked the customer to commit off a tile carrying a name, a
 * price and nothing else — no description, no warranty, no note about what
 * the visit fee covers. The sheet answers "what do you do for it"; the page
 * answers "what does this one involve", and that question has to be
 * answerable before a draft exists.
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
  className?: string
}

export function CategoryGrid({
  appliances,
  services,
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
        {/* A grid of tiles, the shape every app of this kind uses for a
            picker like this, and the shape that was asked for.

            A service shows its own photograph, then a frame of its own clip,
            and falls back to the appliance's picture where it has neither —
            which is the day the pictures start repeating again, not the shape
            breaking. The
            label is stripped to the part that differs either way: the sheet's
            own title already says which appliance this is, so a tile that
            repeated it would spend three lines saying "Washing Machine" to
            distinguish itself from "Washing Machine". */}
        <ul className="grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-4">
          {openServices.map((service) => {
            const duration = durationNote(service.durationMinutes)
            return (
              <li key={service.id}>
                <Link
                  href={
                    `/services/appliance/?a=${service.applianceId}&s=${service.serviceKey}` as Route
                  }
                  onClick={() => setOpenId(null)}
                  className="group flex w-full min-w-0 flex-col items-center gap-2"
                >
                  <span className="relative block aspect-square w-full overflow-hidden rounded-card bg-surface transition-colors duration-[var(--duration-fast)] group-hover:bg-border">
                    {open ? (
                      <Image
                        src={service.photo ?? service.poster ?? open.image}
                        alt=""
                        fill
                        sizes="(min-width: 640px) 110px, 30vw"
                        className={
                          service.photo ?? service.poster
                            ? 'object-cover'
                            : 'object-contain p-3'
                        }
                      />
                    ) : null}

                    {/* How long it takes, on the picture rather than under
                        it. Below the label it would push every tile in the
                        row down by a line, including the ones with no
                        duration seeded. */}
                    {duration ? (
                      <span className="absolute inset-x-1 bottom-1 truncate rounded-sm bg-bg/95 px-1 py-0.5 text-center text-[10px] font-semibold text-success">
                        {duration.replace('About ', '')}
                      </span>
                    ) : null}
                  </span>

                  <span className="min-w-0 text-center">
                    <span className="block text-xs font-semibold leading-tight text-ink">
                      {shortServiceName(service.name, open?.name)}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-tight text-muted">
                      {formatPaise(service.visitFee)}
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </BottomSheet>
    </>
  )
}

/**
 * "Washing Machine Repair", inside a sheet already titled "Washing Machine",
 * is the word Repair wearing a hat.
 *
 * The catalog names a service in full because it is read on its own
 * elsewhere — a rail card, a booking, an invoice. Here the appliance is the
 * heading two lines above, so the prefix is dropped and a tile label that
 * would have wrapped to three lines fits on one. A name that does not start
 * with the appliance is left exactly as seeded; guessing further would mean
 * inventing a rule the catalog never agreed to.
 */
function shortServiceName(name: string, appliance: string | undefined): string {
  if (!appliance) return name
  const prefix = `${appliance.toLowerCase()} `
  if (!name.toLowerCase().startsWith(prefix)) return name

  const rest = name.slice(appliance.length).trim()
  if (rest.length === 0) return name
  return rest.charAt(0).toUpperCase() + rest.slice(1)
}
