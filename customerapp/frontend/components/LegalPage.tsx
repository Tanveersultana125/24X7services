import { Header } from '@/components/Header'
import { brand } from '@/config/brand'

/**
 * The frame the three legal documents share.
 *
 * They are plain server-rendered prose — no client component, no data, nothing
 * to load. A customer who opens the terms while their connection is poor should
 * still be able to read them, and a document that needs JavaScript to appear is
 * a document that sometimes does not.
 *
 * DECISION NEEDED: everything in these three files is a plain-English statement
 * of how the app actually behaves, written so that a customer is not misled. It
 * is not a lawyer's draft and does not pretend to be. Before launch a lawyer has
 * to review all three, and the version they approve becomes `termsVersion` in
 * the business config — which is what every consent record points at.
 */

export interface LegalSection {
  heading: string
  paragraphs: readonly string[]
  /** Rendered as a bulleted list under the paragraphs. */
  points?: readonly string[]
}

export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string
  /** The date this wording last changed, in words. */
  updated: string
  intro: string
  sections: readonly LegalSection[]
}) {
  return (
    <div className="min-h-dvh bg-bg">
      <Header title={title} showBack backFallback="/profile/settings" />

      <main className="mx-auto w-full max-w-lg px-4 pb-16 lg:max-w-2xl">
        <p className="mt-4 text-xs text-muted">Last updated {updated}</p>
        <p className="mt-3 text-sm leading-relaxed text-ink">{intro}</p>

        {sections.map((section) => (
          <section key={section.heading} className="mt-7">
            <h2 className="text-base font-bold text-ink">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p
                key={paragraph}
                className="mt-2 text-sm leading-relaxed text-muted"
              >
                {paragraph}
              </p>
            ))}
            {section.points ? (
              <ul className="mt-2 flex flex-col gap-1.5">
                {section.points.map((point) => (
                  <li
                    key={point}
                    className="flex gap-2 text-sm leading-relaxed text-muted"
                  >
                    <span aria-hidden="true">·</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}

        <p className="mt-10 border-t border-border pt-5 text-xs leading-relaxed text-muted">
          Questions about any of this go to {brand.supportEmail}, or through
          Support in the app.
        </p>
      </main>
    </div>
  )
}
