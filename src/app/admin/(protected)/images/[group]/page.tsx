import { notFound } from "next/navigation";
import { SiteImagesManager } from "@/components/admin/SiteImagesManager";
import { getSiteImages } from "@/lib/site-images";
import { groupBySlug, SITE_IMAGE_GROUP_PAGES } from "@/lib/site-images-shared";

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
  return (
    <SiteImagesManager
      current={current}
      group={group.name}
      title={group.name}
      blurb={group.blurb}
    />
  );
}
