import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { SiteNav } from "@/components/site/SiteNav";
import { PageHeader } from "@/components/site/PageHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { LEGAL_DOCS, LEGAL_UPDATED, REVIEW_PENDING, legalDoc } from "@/lib/legal";

/** One page per policy, all four prerendered — they never change per request. */
export function generateStaticParams() {
  return LEGAL_DOCS.map((d) => ({ doc: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ doc: string }>;
}): Promise<Metadata> {
  const { doc: slug } = await params;
  const doc = legalDoc(slug);
  if (!doc) return { title: "Legal" };
  return {
    title: doc.title,
    description: doc.summary,
    // A policy still being written should not be the page a search brings
    // someone to. Drop this once REVIEW_PENDING is off.
    ...(REVIEW_PENDING ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function LegalPage({ params }: { params: Promise<{ doc: string }> }) {
  const { doc: slug } = await params;
  const doc = legalDoc(slug);
  if (!doc) notFound();

  return (
    <>
      <SiteNav />
      <main className="flex-1">
        <PageHeader crumb={doc.crumb} title={doc.title} subtitle={doc.summary} />

        <section className="relative py-14 sm:py-20">
          <div className="mx-auto max-w-[92rem] px-6 sm:px-10">
            {/* The measure is the point of this page: a policy is read, not
                scanned, and a 92rem line is unreadable. The sibling column
                carries the other three so nobody has to go back to the footer
                to find them. */}
            <div className="grid gap-12 lg:grid-cols-[1fr_16rem] lg:gap-16">
              <div>
                <p className="text-sm text-muted">Last updated {LEGAL_UPDATED}</p>

                {REVIEW_PENDING && (
                  <div className="mt-6 flex gap-3.5 rounded-2xl border border-amber/30 bg-amber/[0.07] px-5 py-4">
                    <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber" strokeWidth={2} />
                    <p className="text-pretty text-sm leading-relaxed text-ink-soft">
                      <span className="font-semibold text-ink">Draft — pending review.</span> This
                      policy was drafted from what the rest of the site already promises. It has not
                      been checked by a lawyer and is not yet binding. Read it, correct it, then set{" "}
                      <code className="rounded bg-surface-2 px-1.5 py-0.5 text-[0.8em]">
                        REVIEW_PENDING
                      </code>{" "}
                      to <code className="rounded bg-surface-2 px-1.5 py-0.5 text-[0.8em]">false</code>{" "}
                      in <code className="rounded bg-surface-2 px-1.5 py-0.5 text-[0.8em]">src/lib/legal.ts</code>{" "}
                      to remove this notice.
                    </p>
                  </div>
                )}

                <div className="mt-10 max-w-2xl space-y-10">
                  {doc.sections.map((s) => (
                    <section key={s.heading}>
                      <h2 className="font-display text-[1.6rem] leading-tight tracking-[-0.02em] sm:text-[1.9rem]">
                        {s.heading}
                      </h2>
                      <div className="mt-4 space-y-3.5">
                        {s.body.map((p) => (
                          <p key={p} className="text-pretty leading-relaxed text-muted">
                            {p}
                          </p>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </div>

              <nav aria-label="Other policies" className="lg:sticky lg:top-28 lg:self-start">
                <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-foreground">
                  Policies
                </h2>
                <ul className="mt-5 space-y-3">
                  {LEGAL_DOCS.map((d) => (
                    <li key={d.slug}>
                      {d.slug === doc.slug ? (
                        <span className="text-sm font-medium text-royal-bright">{d.title}</span>
                      ) : (
                        <Link
                          href={`/legal/${d.slug}`}
                          className="text-sm text-muted transition-colors hover:text-foreground"
                        >
                          {d.title}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
