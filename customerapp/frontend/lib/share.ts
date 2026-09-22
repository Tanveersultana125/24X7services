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

export async function shareText(
  text: string,
  title?: string
): Promise<ShareOutcome> {
  if (typeof navigator !== 'undefined' && 'share' in navigator) {
    try {
      await navigator.share({ text, ...(title ? { title } : {}) })
      return 'shared'
    } catch (error) {
      // Closing the sheet lands here, and it is not something to report.
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'dismissed'
      }
      // Anything else: fall through to the clipboard rather than give up.
    }
  }

  return copyText(text)
}

export async function copyText(text: string): Promise<'copied' | 'failed'> {
  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    return 'failed'
  }
}
