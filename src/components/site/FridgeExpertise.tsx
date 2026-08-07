"use client";

import { useState } from "react";
import { useSiteImage } from "@/components/providers/SiteImagesProvider";
import { motion } from "framer-motion";
import { Snowflake, ShieldCheck, Droplets } from "lucide-react";
import { Kicker } from "./TextReveal";
import { ImageLightbox } from "@/components/ui/ImageLightbox";

const ease = [0.16, 1, 0.3, 1] as const;

/** The three faults people actually call us about, in the order they call. */
const FEATURES = [
  { icon: Snowflake, tint: "#2547d0", title: "Cooling & gas top-up", body: "No cooling or weak cooling traced to its cause — leak test, compressor check and a measured gas charge, not a guess." },
  { icon: ShieldCheck, tint: "#0b9a63", title: "Genuine parts & warranty", body: "Brand-approved compressors, thermostats and door gaskets, fitted by certified pros and backed by a 90-day written warranty." },
  { icon: Droplets, tint: "#d9821b", title: "Frost, leaks & noise", body: "Freezer icing over, water pooling under the crisper, a hum that keeps the kitchen awake — the faults we're called back for most." },
];

const PHOTO_LABEL = "Certified technician repairing a refrigerator's compressor and coils";

export function FridgeExpertise() {
  const expertiseServiceSrc = useSiteImage("expertise-service");
  const [zoomed, setZoomed] = useState(false);

  return (
    <section className="relative py-14 sm:py-20">
      {/* items-stretch, not centre: the photo takes the text column's height so
          the two line up top and bottom instead of the text overhanging. */}
      {/* one column, not an empty half, if the photo has been deleted from the panel */}
      <div
        className={`mx-auto grid max-w-[92rem] gap-12 px-6 sm:px-10 lg:gap-16 ${
          expertiseServiceSrc ? "lg:grid-cols-2 lg:items-stretch" : ""
        }`}
      >
        {/* image */}
        {expertiseServiceSrc && (
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease }}
          role="button"
          tabIndex={0}
          onClick={() => setZoomed(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setZoomed(true);
            }
          }}
          className="cursor-zoom-in overflow-hidden rounded-[2rem] border border-card-edge shadow-premium-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-bright lg:h-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={expertiseServiceSrc} alt={PHOTO_LABEL} className="aspect-[4/3] w-full object-cover lg:aspect-auto lg:h-full" />
        </motion.div>
        )}

        {/* features */}
        <div>
          <Kicker>Refrigerator care</Kicker>
          <h2 className="font-display mt-6 text-[2.4rem] leading-[1.15] sm:leading-[1.05] tracking-[-0.03em] sm:text-5xl">
            Fridge trouble,
            <br />
            sorted today.
          </h2>
          <p className="mt-5 max-w-md text-pretty leading-relaxed text-muted">
            A fridge that stops cooling can&apos;t wait until next week. Our technicians diagnose the
            fault at your door and carry the parts to finish the repair in the same visit.
          </p>

          <div className="mt-10 space-y-7">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.1, ease }}
                className="flex gap-4"
              >
                <span
                  className="grid size-12 shrink-0 place-items-center rounded-2xl text-white shadow-[0_10px_20px_-6px_rgba(23,21,15,0.3),inset_0_1px_0_rgba(255,255,255,0.4)]"
                  style={{ background: `linear-gradient(145deg, ${f.tint}, ${f.tint}cc)` }}
                >
                  <f.icon className="size-6" strokeWidth={1.7} />
                </span>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">{f.title}</h3>
                  <p className="mt-1.5 max-w-md text-pretty leading-relaxed text-muted">{f.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <ImageLightbox
        images={[{ src: expertiseServiceSrc, label: PHOTO_LABEL }]}
        index={zoomed ? 0 : null}
        onClose={() => setZoomed(false)}
        onIndexChange={() => {}}
      />
    </section>
  );
}
