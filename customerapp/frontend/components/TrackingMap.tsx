'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPinned } from 'lucide-react'
import type { GeoPoint } from '@app/shared'
import { cn } from '@/lib/cn'

/**
 * Where the expert is, on a map.
 *
 * The key is a browser key restricted by HTTP referrer and Android package
 * name, which is the supported way to use the Maps JavaScript API from a
 * client. That is the difference between this and geocoding, which is a web
 * service that cannot be restricted the same way and therefore has no business
 * in a bundle.
 *
 * Without a key the screen still works. The ETA, the expert and the timeline
 * are the parts a customer actually acts on; the map is where those facts are
 * pleasant to look at. So a missing key degrades to a panel that says what is
 * happening rather than an empty grey box or a broken screen.
 *
 * DECISION NEEDED: NEXT_PUBLIC_MAPS_KEY is unset, so the map below has not been
 * run. Set a referrer-restricted key and check it before relying on this.
 */

const MAPS_KEY = process.env.NEXT_PUBLIC_MAPS_KEY

/**
 * Only the handful of Maps types this component touches. The full @types
 * package is a megabyte of declarations for three constructors.
 */
interface MapMarker {
  setPosition: (position: GeoPoint) => void
}

interface MapInstance {
  fitBounds: (bounds: MapBounds, padding?: number) => void
}

interface MapBounds {
  extend: (point: GeoPoint) => void
}

interface GoogleMapsNamespace {
  maps: {
    Map: new (element: HTMLElement, options: Record<string, unknown>) => MapInstance
    Marker: new (options: Record<string, unknown>) => MapMarker
    LatLngBounds: new () => MapBounds
  }
}

let scriptPromise: Promise<void> | null = null

function loadMaps(): Promise<void> {
  if (!MAPS_KEY) return Promise.reject(new Error('No maps key'))
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise<void>((resolve, reject) => {
    if ((window as unknown as { google?: GoogleMapsNamespace }).google?.maps) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&loading=async`
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('Could not load the map'))
    }
    document.head.appendChild(script)
  })

  return scriptPromise
}

export interface TrackingMapProps {
  technician?: GeoPoint
  customer?: GeoPoint
  className?: string
}

export function TrackingMap({
  technician,
  customer,
  className,
}: TrackingMapProps) {
  const container = useRef<HTMLDivElement>(null)
  const technicianMarker = useRef<MapMarker | null>(null)
  const [failed, setFailed] = useState(!MAPS_KEY)

  useEffect(() => {
    if (!MAPS_KEY || !container.current) return
    let cancelled = false

    void loadMaps()
      .then(() => {
        if (cancelled || !container.current) return
        const google = (window as unknown as { google: GoogleMapsNamespace })
          .google

        const centre = technician ?? customer
        if (!centre) return

        const map = new google.maps.Map(container.current, {
          center: centre,
          zoom: 14,
          disableDefaultUI: true,
          // The palette is monochrome; a full-colour map inside it would be the
          // loudest thing in the app.
          styles: [
            { featureType: 'poi', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', stylers: [{ visibility: 'off' }] },
          ],
        })

        const bounds = new google.maps.LatLngBounds()
        if (customer) {
          new google.maps.Marker({ position: customer, map, title: 'Your address' })
          bounds.extend(customer)
        }
        if (technician) {
          const marker = new google.maps.Marker({
            position: technician,
            map,
            title: 'Your expert',
          })
          technicianMarker.current = marker
          bounds.extend(technician)
        }
        if (customer && technician) map.fitBounds(bounds, 60)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })

    return () => {
      cancelled = true
    }
    // Built once. Later positions move the marker rather than rebuilding a map,
    // which would reset the zoom every few seconds.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Move the existing marker as new positions arrive.
  useEffect(() => {
    if (!technician || !technicianMarker.current) return
    technicianMarker.current.setPosition(technician)
  }, [technician])

  if (failed) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-card border border-border bg-surface px-6 py-10 text-center',
          className
        )}
      >
        <MapPinned className="size-6 text-muted" aria-hidden="true" />
        <p className="text-sm font-medium text-ink">Map unavailable</p>
        <p className="max-w-xs text-xs leading-relaxed text-muted">
          The live position is below. Your expert calls before they arrive.
        </p>
      </div>
    )
  }

  return (
    <div
      ref={container}
      role="img"
      aria-label="Map showing your expert on the way to your address"
      className={cn('h-64 w-full overflow-hidden rounded-card bg-surface', className)}
    />
  )
}
