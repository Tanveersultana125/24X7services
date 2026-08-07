import { notFound } from "next/navigation";
import { SiteImagesManager } from "@/components/admin/SiteImagesManager";
import { getSiteImages } from "@/lib/site-images";
import { groupBySlug, SITE_IMAGE_GROUP_PAGES } from "@/lib/site-images-shared";
import { SectionItems } from "@/components/admin/SectionItems";
import { listSectionItems } from "@/lib/section-items";
import { SECTION_BY_SLUG } from "@/lib/section-items-shared";
import { getSectionOverrides } from "@/lib/section-overrides";

export const dynamic = "force-dynamic";

/** One page per section of the site, matching the sidebar. */
export function generateStaticParams() {
  return SITE_IMAGE_GROUP_PAGES.map((g) => ({ group: g.slug }));
}

export default async function AdminSiteImageGroupPage({
  params,
}: {
  params: Promise<{ group: string }>;
}) {
  const { group: slug } = await params;
  const group = groupBySlug(slug);
  if (!group) notFound();

  const current = await getSiteImages();
  // The carousels can take extra cards; the fixed page positions cannot.
  const section = SECTION_BY_SLUG[slug];
  const added = section ? (await listSectionItems()).filter((i) => i.section === section) : [];
  const overrides = section ? await getSectionOverrides() : {};

  return (
    <>
      <SiteImagesManager
        current={current}
        group={group.name}
        title={group.name}
        blurb={group.blurb}
        section={section}
        overrides={overrides}
      />
      {section && <SectionItems section={section} label={group.name} initial={added} />}
    </>
  );
}
