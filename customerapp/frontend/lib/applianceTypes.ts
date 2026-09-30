import type { ApplianceId } from '@app/shared'

/**
 * A photograph of each kind of machine, for the "which one is yours" tiles in
 * an appliance page's Menu.
 *
 * Keyed by the options of the appliance's `type` detail field in the catalog
 * (`front-load`, `split`, …), so a kind the catalog adds shows up at once and
 * falls back to the appliance's own picture until somebody photographs it.
 */
const TYPE_PHOTOS: Partial<Record<ApplianceId, Record<string, string>>> = {
  'washing-machine': {
    'front-load': '/photos/washing-machine/1.jpg',
    'top-load': '/photos/washing-machine/2.jpg',
    'semi-automatic': '/photos/types/semi-automatic.jpg',
  },
  'air-conditioner': {
    split: '/photos/air-conditioner/1.jpg',
    window: '/photos/types/window-ac.jpg',
    cassette: '/photos/types/cassette-ac.jpg',
  },
  refrigerator: {
    'single-door': '/photos/refrigerator/7.jpg',
    'double-door': '/photos/refrigerator/3.jpg',
    'side-by-side': '/photos/refrigerator/1.jpg',
  },
  geyser: {
    storage: '/photos/geyser/1.jpg',
    instant: '/photos/geyser/4.jpg',
  },
  microwave: {
    solo: '/photos/microwave/6.jpg',
    grill: '/photos/microwave/3.jpg',
    convection: '/photos/microwave/2.jpg',
  },
}

export function typePhoto(
  applianceId: ApplianceId,
  type: string
): string | undefined {
  return TYPE_PHOTOS[applianceId]?.[type]
}

/** "front-load" → "Front-load", "split" → "Split". */
export function typeLabel(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1)
}
