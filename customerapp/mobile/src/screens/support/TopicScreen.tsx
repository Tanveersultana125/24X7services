import { useState } from 'react'
import { View } from 'react-native'
import { useLocalSearchParams, type Href } from 'expo-router'
import { ChevronDown, MessageSquare } from 'lucide-react-native'

import { Header, Screen } from '@/components/Screen'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { ErrorState } from '@/components/ui/States'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { cn } from '@/lib/cn'
import { supportTopic, type SupportQuestion } from './topics'

/**
 * One help topic: its questions, answered in full, in the same accordion the
 * service page uses for its FAQs. One answer open at a time, so the list stays
 * a list and the next question is never a long scroll away.
 *
 * Answered here rather than linked to an article, because the whole reason
 * people open help is that they do not want to be sent somewhere else.
 *
 * The way to a person is at the bottom of every topic, and it carries the
 * topic with it. Someone who has read four answers and is still here has a
 * question the list does not cover, and they should not have to say again
 * what it is about.
 */
export function TopicScreen() {
  const params = useLocalSearchParams<{ t?: string }>()
  const topic = supportTopic(typeof params.t === 'string' ? params.t : null)
  const [open, setOpen] = useState<number | null>(null)

  return (
    <Screen header={<Header title={topic?.label ?? 'Help'} showBack backFallback="/support" />}>
      {!topic ? (
        <ErrorState
          className="py-20"
          kind="notFound"
          title="We could not find that topic"
          description="It may have been renamed. The full list is on the support screen."
        />
      ) : (
        <>
          <Text accessibilityRole="header" className="mt-6 text-2xl font-bold leading-[30px] text-ink">
            {topic.label}
          </Text>
          <Text className="mt-1 text-sm text-muted">{topic.blurb}</Text>

          <View className="mt-4 border-y border-border">
            {topic.questions.map((item, index) => (
              <Question
                key={item.q}
                item={item}
                open={open === index}
                onToggle={() => setOpen(open === index ? null : index)}
                last={index === topic.questions.length - 1}
              />
            ))}
          </View>

          <View className="mt-8 rounded-card bg-brand-soft p-4">
            <Text accessibilityRole="header" className="text-base font-semibold text-ink">
              Still need help?
            </Text>
            <Text className="mt-1 text-sm leading-[22px] text-muted">
              Tell us what happened and we will sort it out. Most things are quicker to fix than to explain.
            </Text>
            <Button
              className="mt-4 self-start"
              href={`/support/chat?topic=${topic.id}` as Href}
              iconLeft={<Icon as={MessageSquare} className="size-4 text-white" />}
            >
              Chat with us
            </Button>
          </View>
        </>
      )}
    </Screen>
  )
}

/** One question; the answer opens in place, and says so to a screen reader. */
function Question({
  item,
  open,
  onToggle,
  last,
}: {
  item: SupportQuestion
  open: boolean
  onToggle: () => void
  last: boolean
}) {
  return (
    <View className={cn(!last && 'border-b border-border')}>
      <Tappable
        onPress={onToggle}
        accessibilityState={{ expanded: open }}
        className="min-h-14 flex-row items-center gap-3 py-3"
      >
        <Text className="min-w-0 flex-1 text-base font-medium text-ink">{item.q}</Text>
        <Icon as={ChevronDown} className={cn('size-4 shrink-0 text-muted', open && 'rotate-180')} />
      </Tappable>
      {open ? <Text className="pb-4 text-sm leading-[22px] text-muted">{item.a}</Text> : null}
    </View>
  )
}
