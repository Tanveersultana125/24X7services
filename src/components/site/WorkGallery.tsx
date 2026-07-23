"use client";

import { motion } from "framer-motion";
import { Kicker } from "./TextReveal";

const ease = [0.16, 1, 0.3, 1] as const;

type Shot = { src: string; label: string };

// Interleaved by category for a varied masonry rhythm.
const SHOTS: Shot[] = [
  { src: "/work/gallery/ac-1.png", label: "AC service" },
  { src: "/work/gallery/fridge-1.png", label: "Refrigerator repair" },
  { src: "/work/gallery/washing-1.png", label: "Washing machine repair" },
  { src: "/work/gallery/microwave-1.png", label: "Microwave repair" },
  { src: "/work/gallery/ac-3.png", label: "AC installation" },
  { src: "/work/gallery/washing-2.png", label: "Front-load service" },
  { src: "/work/gallery/microwave-2.png", label: "Microwave diagnosis" },
  { src: "/work/gallery/fridge-2.png", label: "Cooling repair" },
  { src: "/work/gallery/ac-2.png", label: "Split-AC deep clean" },
];

export function WorkGallery() {
  return (
    <section id="work" className="relative scroll-mt-28 py-14 sm:py-20">
      <div className="mx-auto max-w-[92rem] px-6 sm:px-10">
        <div className="max-w-2xl">
          <Kicker>Real repairs, real homes</Kicker>
          <h2 className="font-display mt-6 text-[2.6rem] leading-[1.05] tracking-[-0.03em] sm:text-6xl">
            Our technicians,
            <br />
            on the job.
          </h2>
        </div>

        {/* masonry */}
        <div className="mt-14 gap-4 [column-fill:_balance] sm:columns-2 lg:columns-3">
          {SHOTS.map((s, i) => (
            <motion.figure
              key={s.src}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: (i % 3) * 0.08, ease }}
              className="group relative mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-white/60 bg-surface shadow-premium-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.src}
                alt={s.label}
                loading="lazy"
                className="w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              />
              <figcaption className="absolute bottom-3 left-3 translate-y-1 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-ink opacity-0 backdrop-blur transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                {s.label}
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
