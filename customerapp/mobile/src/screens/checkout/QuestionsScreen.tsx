import { useEffect } from 'react'
import { router } from 'expo-router'

import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/States'
import { questionsDone, setAnswer, useCartQuestions, useCheckoutDraft } from '@/lib/data/booking'
import { useCart } from '@/lib/data/cart'
import { QuestionField } from './QuestionField'
import { StepFrame } from './StepFrame'

/**
 * Step 1: what the professional should know. The questions are whatever the
 * services in the cart ask (brand and problem for an AC, home size for a
 * cleaning, skin type for a facial), so a new category needs new data, not a
 * new screen. A cart whose services ask nothing goes straight to the address.
 */
export function QuestionsScreen() {
  const cart = useCart()
  const draft = useCheckoutDraft()
  const questions = useCartQuestions(cart.items.map((item) => item.serviceId))
  const list = questions.data ?? []
  const done = questionsDone(list, draft.answers)

  useEffect(() => {
    if (questions.status === 'ready' && list.length === 0) router.replace('/checkout/address')
  }, [questions.status, list.length])

  return (
    <StepFrame
      step={1}
      title="A few details"
      action={{ label: done ? 'Continue' : 'Answer the required questions', onPress: () => router.push('/checkout/address'), disabled: !done }}
    >
      {questions.status === 'loading' ? (
        <SkeletonGroup label="Loading questions" className="gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </SkeletonGroup>
      ) : questions.status === 'error' ? (
        <ErrorState className="mt-10" onRetry={questions.reload} retrying={questions.refreshing} />
      ) : (
        list.map((question) => (
          <QuestionField
            key={question.id}
            question={question}
            answer={draft.answers[question.id]}
            onAnswer={(answer) => setAnswer(question.id, answer)}
          />
        ))
      )}
    </StepFrame>
  )
}
