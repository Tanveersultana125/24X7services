import { LIVE } from './status'
import type { Booking, Technician } from './types'

/** Straight-line km between two points; good enough to rank who is nearest. */
export function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const x = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(x))
}

/** City traffic: roughly 3 minutes a km plus getting going. */
export const etaMin = (distanceKm: number) => Math.round(distanceKm * 1.3 * 3 + 6)

export interface Candidate {
  tech: Technician
  distance: number
  eta: number
  load: number
  busy: boolean
}

/**
 * Who can take a booking: verified, covers the brand and the appliance, and
 * not offline. Nearest first, with anyone already on a live job after the
 * free ones.
 */
export function candidates(b: Booking, techs: Technician[], bookings: Booking[]): Candidate[] {
  return techs
    .filter((t) => t.kyc === 'verified' && t.brands.includes(b.brand) && t.appliances.includes(b.appliance))
    .map((t) => {
      const distance = Math.round(km(t, b) * 1.25 * 10) / 10
      const mine = bookings.filter((x) => x.technicianId === t.id && x.id !== b.id)
      return {
        tech: t,
        distance,
        eta: etaMin(distance),
        load: mine.filter((x) => x.status === 'assigned').length,
        busy: mine.some((x) => LIVE.includes(x.status)),
      }
    })
    .sort((a, b) => Number(a.tech.presence === 'offline') - Number(b.tech.presence === 'offline') || Number(a.busy) - Number(b.busy) || a.distance - b.distance)
}
