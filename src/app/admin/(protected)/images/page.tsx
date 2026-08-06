import { redirect } from "next/navigation";
import { SITE_IMAGE_GROUP_PAGES } from "@/lib/site-images-shared";

/** Images has no page of its own — it opens on the first section. */
export default function AdminImagesIndex() {
  redirect(`/admin/images/${SITE_IMAGE_GROUP_PAGES[0].slug}`);
}
