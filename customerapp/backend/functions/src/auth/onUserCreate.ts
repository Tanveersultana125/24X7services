import * as functionsV1 from 'firebase-functions/v1'
import { logger } from 'firebase-functions'
import { businessConfigSchema, COL, DOC } from '@app/shared'
import { db } from '../lib/admin'

/**
 * Write the half of a user document the client is not allowed to write.
 *
 * The rules let a customer set their name, email and default address and
 * nothing else. `phone` and `consent` are excluded deliberately: a phone number
 * a client could type is a phone number that need not be theirs, and a consent
 * record a client could compose is one it could date to whenever suited it.
 * Both belong to whoever can see the auth token, which is here.
 *
 * The version consented to is read from `config/business` at the moment of
 * sign-in, so changing the terms later makes the stored version stale rather
 * than silently reinterpreting what was agreed to.
 *
 * DECISION NEEDED: this is a 1st-generation trigger, and those run in
 * us-central1 — the one thing in this backend that is not in Mumbai. It sees a
 * uid and a phone number and writes to Firestore in Mumbai; it stores nothing
 * where it runs. The alternative is a v2 blocking function, which needs
 * Identity Platform enabled on the project. Confirm which before launch, since
 * the answer is a data-residency statement under DPDP.
 */
export const onUserCreate = functionsV1.auth.user().onCreate(async (user) => {
  const termsVersion = await currentTermsVersion()
  const now = Date.now()

  await db()
    .collection(COL.users)
    .doc(user.uid)
    .set(
      {
        phone: user.phoneNumber ?? undefined,
        consent: termsVersion
          ? { termsVersion, acceptedAt: now }
          : undefined,
        fcmTokens: [],
        createdAt: now,
        updatedAt: now,
      },
      // Merge, because the name screen may well have written the profile
      // before this trigger got to it.
      { merge: true }
    )

  logger.info('onUserCreate: stamped a new user', {
    uid: user.uid,
    hasPhone: Boolean(user.phoneNumber),
    termsVersion,
  })
})

async function currentTermsVersion(): Promise<string | undefined> {
  const snap = await db().collection(COL.config).doc(DOC.businessConfig).get()
  const parsed = businessConfigSchema.safeParse(snap.data())
  if (parsed.success) return parsed.data.termsVersion

  // Recording no consent is honest. Recording a guessed version would look
  // like the customer agreed to terms nobody can now identify.
  logger.error('onUserCreate: business config unreadable, consent not stamped')
  return undefined
}
