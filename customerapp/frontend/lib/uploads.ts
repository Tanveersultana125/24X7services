'use client'

import { ref, uploadBytesResumable } from 'firebase/storage'
import { storagePaths } from '@app/shared'
import { storage } from './firebase'

/**
 * Putting a file in Storage, with progress.
 *
 * Booking media is uploaded before the booking exists — there is no id to file
 * it under yet — so it goes to the customer's draft prefix and the created
 * booking refers to it there. `createBooking` checks that every path it is
 * handed starts with the caller's own prefix, and the storage rules say the
 * same thing from the other side.
 *
 * Resumable rather than a plain upload: these are photographs taken on a phone,
 * often on a connection that comes and goes, and `uploadBytesResumable` is what
 * reports progress per file rather than leaving five spinners that all say the
 * same thing.
 */

/** A name that cannot collide and carries its own extension. */
function uniqueName(file: File): string {
  const dot = file.name.lastIndexOf('.')
  const extension = dot > 0 ? file.name.slice(dot).toLowerCase() : ''
  const random = Math.random().toString(36).slice(2, 8)
  return `${Date.now().toString(36)}-${random}${extension}`
}

export function uploadDraftMedia(
  uid: string,
  file: File,
  onProgress: (percent: number) => void
): Promise<string> {
  const path = storagePaths.draftMedia(uid, uniqueName(file))
  const task = uploadBytesResumable(ref(storage(), path), file, {
    contentType: file.type,
  })

  return new Promise<string>((resolve, reject) => {
    task.on(
      'state_changed',
      (snapshot) => {
        const percent =
          snapshot.totalBytes > 0
            ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
            : 0
        onProgress(percent)
      },
      reject,
      // The path, not a download URL. A URL carries a token that would be
      // stored on the booking and outlive whatever it was granted for.
      () => resolve(path)
    )
  })
}
