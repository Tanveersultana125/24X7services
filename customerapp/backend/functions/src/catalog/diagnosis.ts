import { COL, diagnosisRuleSchema } from '@app/shared'
import { db } from '../lib/admin'
import { defineCallable } from '../lib/callable'

/**
 * The causes and tips for the issues a customer picked.
 *
 * This is a lookup, not a model, and the wording around it says so everywhere
 * it appears: "Possible causes", and "your technician will verify this during
 * inspection". Nothing here is a diagnosis, and nothing here is priced —
 * a number beside a cause would read as a quote for a repair nobody has
 * inspected yet.
 */
export const getDiagnosis = defineCallable(
  'getDiagnosis',
  async ({ applianceId, issueIds }) => {
    const snap = await db()
      .collection(COL.diagnosisRules)
      .where('applianceId', '==', applianceId)
      // The input schema caps issueIds at ten, which is inside Firestore's
      // thirty-value limit for `in`.
      .where('issueId', 'in', issueIds)
      .get()

    const byIssue = new Map<string, { causes: string[]; tips: string[] }>()
    for (const doc of snap.docs) {
      const parsed = diagnosisRuleSchema.safeParse(doc.data())
      if (!parsed.success) continue
      byIssue.set(parsed.data.issueId, {
        causes: parsed.data.possibleCauses,
        tips: parsed.data.tips,
      })
    }

    // Ordered by the issues the customer chose, so the first cause listed
    // belongs to the first thing they said was wrong. Deduped, because two
    // issues on the same appliance often share a cause.
    const possibleCauses: string[] = []
    const tips: string[] = []
    for (const issueId of issueIds) {
      const rule = byIssue.get(issueId)
      if (!rule) continue
      for (const cause of rule.causes) {
        if (!possibleCauses.includes(cause)) possibleCauses.push(cause)
      }
      for (const tip of rule.tips) {
        if (!tips.includes(tip)) tips.push(tip)
      }
    }

    return { possibleCauses, tips }
  }
)
