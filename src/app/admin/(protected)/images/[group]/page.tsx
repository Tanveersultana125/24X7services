import { notFound } from "next/navigation";
import { SiteImagesManager } from "@/components/admin/SiteImagesManager";
import { getSiteImages } from "@/lib/site-images";
import { groupBySlug, SITE_IMAGE_GROUP_PAGES } from "@/lib/site-images-shared";
import { SECTION_BY_SLUG } from "@/lib/section-items-shared";
import { getSectionOverrides } from "@/lib/section-overrides";
import { listMedia } from "@/lib/media";
import { StorageNotice } from "@/components/admin/StorageNotice";
import { describeStorage } from "@/lib/uploads";

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
  // Carousel cards carry words of their own; the fixed page positions do not.
  const section = SECTION_BY_SLUG[slug];
  const overrides = section ? await getSectionOverrides() : {};
  const media = await listMedia();
  const storage = await describeStorage();

  return (
    <>
      <StorageNotice status={storage} />
      <SiteImagesManager
        current={current}
        group={group.name}
        title={group.name}
        blurb={group.blurb}
        section={section}
        overrides={overrides}
        media={media}
      />
    </>
  );
}
