import { Share } from 'react-native'
import * as Clipboard from 'expo-clipboard'

/**
 * Handing a string to someone else — the system share sheet, or the clipboard
 * when that fails. Neither throws out of here: the caller gets back what
 * happened and decides what, if anything, to say about it.
 */

export type ShareOutcome = 'shared' | 'copied' | 'dismissed' | 'failed'

export async function shareText(
  text: string,
  title?: string,
  url?: string
): Promise<ShareOutcome> {
  try {
    const result = await Share.share(
      {
        // Android ignores `url`, so the link rides in the message there.
        message: url ? `${text} ${url}` : text,
        ...(title ? { title } : {}),
        ...(url ? { url } : {}),
      },
      title ? { dialogTitle: title, subject: title } : undefined
    )
    return result.action === Share.dismissedAction ? 'dismissed' : 'shared'
  } catch {
    return copyText(url ? `${text} ${url}` : text)
  }
}

export async function copyText(text: string): Promise<'copied' | 'failed'> {
  try {
    await Clipboard.setStringAsync(text)
    return 'copied'
  } catch {
    return 'failed'
  }
}
