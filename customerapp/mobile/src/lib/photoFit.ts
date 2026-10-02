/**
 * The service photographs that are product shots: the appliance alone on a
 * white sweep, straight from a catalogue.
 *
 * These cannot be cropped to fill a box the way a photograph of a room can.
 * A square shot of a washing machine cropped to a 16:9 card loses its lid and
 * its feet, and what is left reads as a dark slab rather than a machine. So
 * they are shown whole, inside the box, and the white they were shot on is
 * multiplied into the box's own colour so there is no second rectangle.
 *
 * Kept as a list rather than guessed from the pixels: the call belongs to
 * whoever adds a photograph, and it is made once. A new photograph that is a
 * product shot goes here.
 */
const PRODUCT_SHOTS = new Set([
  '/photos/air-conditioner/1.jpg',
  '/photos/air-conditioner/3.jpg',
  '/photos/geyser/1.jpg',
  '/photos/geyser/2.jpg',
  '/photos/geyser/4.jpg',
  '/photos/microwave/1.jpg',
  '/photos/microwave/2.jpg',
  '/photos/microwave/3.jpg',
  '/photos/microwave/4.jpg',
  '/photos/refrigerator/1.jpg',
  '/photos/refrigerator/3.jpg',
  '/photos/refrigerator/5.jpg',
  '/photos/refrigerator/6.jpg',
  '/photos/refrigerator/7.jpg',
  '/photos/washing-machine/1.jpg',
  '/photos/washing-machine/2.jpg',
  '/photos/washing-machine/4.jpg',
  '/photos/hero-microwave.jpg',
  '/photos/hero-refrigerator.jpg',
])

export function isProductShot(src: string | undefined): boolean {
  return src !== undefined && PRODUCT_SHOTS.has(src)
}
