import { getMessaging } from 'firebase-admin/messaging'
import { FieldValue } from 'firebase-admin/firestore'
import { logger } from 'firebase-functions'
import {
  COL,
  DEFAULT_NOTIFICATION_PREFS,
  SUB,
  notificationPrefsSchema,
} from '@app/shared'
import { db } from './admin'

/**
 * Telling a customer something happened.
 *
 * One function, two deliveries, and they are not the same thing:
 *
 *   - The **record**, written to `notifications/{uid}/items`. It is what the
 *     Notifications screen reads, and it is the account of what we told
 *     somebody and when. It is written first and it is written whether or not
 *     anything was pushed, because "we told you on Tuesday" has to be
 *     answerable long after a phone has forgotten the banner.
 *   - The **push**, to whatever devices this customer has registered. Best
 *     effort by nature: tokens go stale, phones get replaced, permissions get
 *     revoked in settings we never hear about.
 *
 * Both respect what the customer asked for under Settings, and the two
 * switches are separate for a reason — somebody who wants the list but not the
 * banner is asking for something coherent, and this is where that is honoured.
 *
 * It never throws into its caller. A booking that could not be announced is
 * still a booking; an invoice that failed to issue is a different kind of
 * problem, and a notification must not be able to take one down with it.
 */

export interface NotifyInput {
  uid: string
  title: string
  /** One sentence. It is a banner on a lock screen before it is anything else. */
  body: string
  /** Where tapping it goes, as an internal route. */
  href?: string
  bookingId?: string
  /**
   * Makes this notification happen at most once.
   *
   * The triggers behind these are at-least-once, so without it a redelivery is
   * a second banner for the same event. Build it from what makes the event
   * unique — the booking and the status — never from a timestamp.
   */
  id?: string
}

export async function notify({
  uid,
  title,
  body,
  href,
  bookingId,
  id,
}: NotifyInput): Promise<void> {
  try {
    const prefs = await readPrefs(uid)
    const now = Date.now()

    if (prefs.inApp) {
      const ref = id
        ? db().collection(COL.notifications).doc(uid).collection(SUB.items).doc(id)
        : db().collection(COL.notifications).doc(uid).collection(SUB.items).doc()

      // `create` rather than `set` when there is an id: the second delivery of
      // the same event collides here and is dropped, instead of rewriting a
      // row the customer may already have read.
      const record = {
        title,
        body,
        at: now,
        ...(href ? { href } : {}),
        ...(bookingId ? { bookingId } : {}),
      }

      if (id) {
        try {
          await ref.create(record)
        } catch {
          // Already told them. Nothing left to do, including the push.
          return
        }
      } else {
        await ref.set(record)
      }
    }

    if (prefs.push) await push(uid, { title, body, href })
  } catch (error) {
    logger.error('notify: could not tell a customer something', { uid, error })
  }
}

/** What this customer agreed to be sent. Absent means the defaults. */
async function readPrefs(uid: string) {
  const snap = await db().collection(COL.users).doc(uid).get()
  const parsed = notificationPrefsSchema.safeParse(snap.get('notifications'))
  return parsed.success ? parsed.data : DEFAULT_NOTIFICATION_PREFS
}

/**
 * Push to every device this customer has registered.
 *
 * A token that comes back unregistered is removed. Nothing else prunes them,
 * and a list that only grows is a list where one real device eventually sits
 * behind fifty dead ones — every send paying for all of them.
 */
async function push(
  uid: string,
  message: { title: string; body: string; href?: string }
): Promise<void> {
  const snap = await db().collection(COL.users).doc(uid).get()
  const tokens = (snap.get('fcmTokens') as string[] | undefined) ?? []
  if (tokens.length === 0) return

  const result = await getMessaging().sendEachForMulticast({
    tokens,
    notification: { title: message.title, body: message.body },
    // The click-through lives in data, not in the notification: the service
    // worker reads it, and a web push with a `link` in the wrong place opens
    // the app at whatever it last had open.
    data: message.href ? { href: message.href } : {},
    webpush: {
      fcmOptions: message.href ? { link: message.href } : undefined,
    },
  })

  const dead: string[] = []
  result.responses.forEach((response, index) => {
    const code = response.error?.code
    const token = tokens[index]
    if (
      token &&
      (code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token' ||
        code === 'messaging/invalid-argument')
    ) {
      dead.push(token)
    }
  })

  if (dead.length > 0) {
    await db()
      .collection(COL.users)
      .doc(uid)
      .update({ fcmTokens: FieldValue.arrayRemove(...dead) })
    logger.info('notify: dropped tokens the device no longer answers on', {
      uid,
      dropped: dead.length,
    })
  }
}
