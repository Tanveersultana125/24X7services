import { AlertTriangle } from "lucide-react";
import type { StorageStatus } from "@/lib/uploads";

/**
 * Says an upload has nowhere to go, before a photo is chosen.
 *
 * The failure was only visible after picking a file, uploading it and reading
 * a red line — for something that can't work at all until someone changes an
 * environment variable or clicks a button in another console.
 */
export function StorageNotice({ status }: { status: StorageStatus }) {
  if (status.ok) return null;

  return (
    <div className="mb-5 rounded-2xl border border-amber/30 bg-amber/10 p-4 text-sm">
      <p className="flex items-center gap-2 font-medium text-amber">
        <AlertTriangle className="size-4 shrink-0" />
        Uploads have nowhere to go yet
      </p>
      {status.problem && <p className="mt-1.5 text-ink-soft">{status.problem}</p>}
      <p className="mt-2 text-ink-soft">Either one of these fixes it:</p>
      <ul className="mt-1.5 list-disc space-y-1 pl-5 text-ink-soft">
        <li>
          Firebase console → <span className="font-medium">Build → Storage → Get started</span>.
          Nothing else to set; this project is already wired for it.
        </li>
        <li>
          Or set <code className="rounded bg-surface-2 px-1 py-0.5 text-xs">CLOUDINARY_CLOUD_NAME</code>,{" "}
          <code className="rounded bg-surface-2 px-1 py-0.5 text-xs">CLOUDINARY_API_KEY</code> and{" "}
          <code className="rounded bg-surface-2 px-1 py-0.5 text-xs">CLOUDINARY_API_SECRET</code> from
          Cloudinary → Settings → API Keys, then restart.
        </li>
      </ul>
      <p className="mt-2 text-xs text-muted">
        Pasting an image URL still works meanwhile — only uploading a file needs storage.
      </p>
    </div>
  );
}
