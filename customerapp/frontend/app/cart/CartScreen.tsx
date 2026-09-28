'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Route } from 'next'
import { ShoppingCart, Trash2 } from 'lucide-react'
import type { CatalogAppliance, CatalogService } from '@app/shared'

import { AppShell } from '@/components/AppShell'
import { Header } from '@/components/Header'
import { ServiceClip } from '@/components/ServiceClip'
import { ServiceScore } from '@/components/ServiceScore'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import { fetchAllServices, fetchAppliances } from '@/lib/catalog'
import { removeFromCart, useCart, type CartItem } from '@/lib/cart'
import { startDraft } from '@/lib/bookingDraft'
import { formatPaise } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'

/**
 * The services a customer set aside, each with its own way to book.
 *
 * One booking is one service and one visit — the brand, the problem and the
 * slot all belong to that one appliance — so there is no single checkout here.
 * "Book" starts the booking for that item, and the item leaves the cart when
 * the booking is made (PaymentScreen), not when the flow is merely started.
 *
 * Prices come from the catalog, not the cart, so what is shown is today's fee.
 * An item whose service has since been withdrawn is dropped from view rather
 * than offered for a booking that would be refused.
 */
export function CartScreen() {
  const router = useRouter()
  const cart = useCart()

  const load = useCallback(async () => {
    const [appliances, services] = await Promise.all([
      fetchAppliances(),
      fetchAllServices(),
    ])
    return { appliances, services }
  }, [])
  const catalog = useAsync(load)

  const rows = (catalog.data?.services ?? [])
    .map((service) => ({
      service,
      index: cart.findIndex(
        (item) =>
          item.applianceId === service.applianceId &&
          item.serviceKey === service.serviceKey
      ),
    }))
    .filter((row) => row.index !== -1)
    .sort((a, b) => a.index - b.index)
    .map((row) => row.service)

  const total = rows.reduce((sum, service) => sum + service.visitFee, 0)

  function book(item: CartItem): void {
    startDraft({
      applianceId: item.applianceId,
      serviceKey: item.serviceKey,
      issueIds: [],
      techPreference: 'any',
    })
    router.push('/book/brand')
  }

  return (
    <AppShell
      mobileHeader={<Header title="Cart" showBack backFallback="/home" />}
    >
      {cart.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Add a service from search or the services list, and it waits here until you book it."
          action={{ label: 'Browse services', href: '/services' }}
        />
      ) : catalog.status === 'loading' ? (
        <SkeletonGroup label="Loading" className="mt-5 flex flex-col gap-4">
          {cart.map((item) => (
            <Skeleton key={`${item.applianceId}-${item.serviceKey}`} className="h-24" />
          ))}
        </SkeletonGroup>
      ) : catalog.status === 'error' ? (
        <ErrorState onRetry={catalog.reload} retrying={catalog.refreshing} />
      ) : (
        <div className="mt-5">
          <p className="text-sm text-muted">
            Each service is its own visit, so each one is booked on its own.
          </p>

          <ul className="mt-2 divide-y divide-border">
            {rows.map((service) => (
              <li key={service.id}>
                <CartRow
                  service={service}
                  appliance={catalog.data?.appliances.find(
                    (appliance) => appliance.id === service.applianceId
                  )}
                  onBook={book}
                />
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
            <span className="text-sm text-muted">
              Visit fees, {rows.length} {rows.length === 1 ? 'service' : 'services'}
            </span>
            <span className="text-base font-bold text-ink">
              {formatPaise(total)}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Any repair beyond the visit is quoted on site and starts only after
            you approve it.
          </p>

          <Link
            href="/services"
            className="mt-6 flex min-h-11 items-center justify-center text-sm font-semibold text-brand"
          >
            Add more services
          </Link>
        </div>
      )}
    </AppShell>
  )
}

function CartRow({
  service,
  appliance,
  onBook,
}: {
  service: CatalogService
  appliance?: CatalogAppliance
  onBook: (item: CartItem) => void
}) {
  const item = {
    applianceId: service.applianceId,
    serviceKey: service.serviceKey,
  }
  const still = service.photo ?? service.poster ?? appliance?.image

  return (
    <div className="flex items-start gap-4 py-4">
      <Link
        href={
          `/services/detail/?a=${service.applianceId}&s=${service.serviceKey}` as Route
        }
        className="shrink-0"
        aria-label={service.name}
      >
        {still ? (
          <ServiceClip
            still={still}
            cover={Boolean(service.photo ?? service.poster)}
            motion={false}
            sizes="80px"
            containClassName="p-2"
            className="size-20 rounded-card"
          />
        ) : (
          <span className="block size-20 rounded-card bg-surface" />
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <p className="text-base font-medium leading-snug text-ink">
          {service.name}
        </p>
        <ServiceScore
          rating={service.rating}
          reviewCount={service.reviewCount}
          variant="compact"
          className="mt-1"
        />
        <p className="mt-1 text-sm text-ink">
          {formatPaise(service.visitFee)}{' '}
          <span className="text-muted">visit fee</span>
        </p>

        <div className="mt-3 flex items-center gap-2">
          <Button size="sm" onClick={() => onBook(item)}>
            Book
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => removeFromCart(item)}
            aria-label={`Remove ${service.name} from cart`}
            iconLeft={<Trash2 className="size-4" aria-hidden="true" />}
          >
            Remove
          </Button>
        </div>
      </div>
    </div>
  )
}
