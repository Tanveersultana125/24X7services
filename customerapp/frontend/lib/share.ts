'use client'

/**
 * Handing a string to someone else — the share sheet where there is one, the
 * clipboard where there is not.
 *
 * Both APIs fail in ways that are not errors. The share sheet rejects with an
 * AbortError when the customer closes it, which is a decision and not a
 * failure; the clipboard throws outright on an insecure origin and in a
 * document that is not focused. So neither throws out of here: the caller gets
 * back what happened and decides what, if anything, to say about it.
 */

export type ShareOutcome = 'shared' | 'copied' | 'dismissed' | 'failed'

/**
 * `url`, when given, goes to the share sheet as a link of its own rather than
 * inside the text: WhatsApp and the rest then show it as a link with a
 * preview, and a target that takes only links still gets one. The clipboard
 * has no such slot, so there it follows the text.
 */
export async function shareText(
  text: string,
  title?: string,
  url?: string
): Promise<ShareOutcome> {
  if (typeof navigator !== 'undefined' && 'share' in navigator) {
    try {
      await navigator.share({
        text,
        ...(title ? { title } : {}),
        ...(url ? { url } : {}),
      })
      return 'shared'
    } catch (error) {
      // Closing the sheet lands here, and it is not something to report.
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'dismissed'
      }
      // Anything else: fall through to the clipboard rather than give up.
    }
  }

  return copyText(url ? `${text} ${url}` : text)
}

export async function copyText(text: string): Promise<'copied' | 'failed'> {
  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    return 'failed'
  }
}
