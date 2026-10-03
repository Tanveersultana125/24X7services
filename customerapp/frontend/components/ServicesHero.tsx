import Image from 'next/image'
import { brand } from '@/config/brand'

/**
 * The top of the Services screen: a home, not a diagram.
 *
 * A full-bleed photograph of a lived-in room with the promise written across
 * the top of it, the way a magazine cover would set it. The wordmark sits
 * above the line so the page says whose it is without a logo. A dark wash at
 * the top keeps the white type readable whatever the light in the picture,
 * and a shorter one at the foot gives the search card that overlaps it
 * something calm to sit on.
 */
export function ServicesHero() {
  return (
    <section
      aria-label={`${brand.name} services`}
      className="relative -mx-4 h-[21rem] overflow-hidden lg:mx-0 lg:mt-4 lg:rounded-card"
    >
      <Image
        src="/photos/laundry-room.jpg"
        alt=""
        fill
        priority
        sizes="(min-width: 1024px) 1024px, 100vw"
        className="object-cover object-[60%_center]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-2/3 bg-linear-to-b from-night/75 via-night/35 to-transparent"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-1/4 bg-linear-to-t from-night/40 to-transparent"
      />

      <div className="relative px-5 pt-7">
        <p className="text-xl font-extrabold tracking-tight text-white">
          {brand.wordmark}
        </p>
        <h2 className="mt-2 max-w-[17rem] text-[1.75rem] font-bold leading-[2.125rem] text-white">
          {brand.tagline}
        </h2>
        <p className="mt-2 max-w-[16rem] text-sm text-white/85">
          Repair, service and installation. You approve the price first.
        </p>
      </div>
    </section>
  )
}
