'use client'

import {
  answerWith,
  type AssistantContext,
  type AssistantReply,
  type AssistantSource,
} from './assistantBrain'
import {
  fetchBusinessConfig,
  fetchDiagnosisRule,
  fetchIssuesFor,
  fetchServiceAreas,
  fetchServicesFor,
} from './catalog'

export {
  OPENING,
  type AssistantAction,
  type AssistantContext,
  type AssistantReply,
} from './assistantBrain'

/**
 * The assistant, reading from Firestore — which in the demo build is the
 * bundled catalog in the offline cache. The thinking is in assistantBrain.ts.
 */
const firestoreSource: AssistantSource = {
  services: fetchServicesFor,
  issues: fetchIssuesFor,
  rule: fetchDiagnosisRule,
  business: fetchBusinessConfig,
  areas: fetchServiceAreas,
}

export function answer(
  message: string,
  context: AssistantContext
): Promise<{ reply: AssistantReply; context: AssistantContext }> {
  return answerWith(message, context, firestoreSource)
}
