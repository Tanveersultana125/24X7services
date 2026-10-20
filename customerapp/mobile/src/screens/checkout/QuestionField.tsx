import { useState } from 'react'
import { View } from 'react-native'
import { Camera, ImagePlus, X } from 'lucide-react-native'
import type { Answer, Question } from '@app/shared/catalog-v2'

import { useToast } from '@/components/Toast'
import { Chip } from '@/components/ui/Chip'
import { Textarea } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { Img } from '@/components/ui/Img'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { pickMedia } from '@/lib/media'

/**
 * One booking question, drawn by its kind. The question's text, options and
 * whether it is required all come from data (catalog-v2 Question); only the
 * four kinds are code, because each is a different control.
 */
export function QuestionField({
  question,
  answer,
  onAnswer,
}: {
  question: Question
  answer: Answer | undefined
  onAnswer: (answer: Answer | null) => void
}) {
  return (
    <View className="border-b border-border py-5">
      <Text accessibilityRole="header" className="text-base font-semibold text-ink">
        {question.label}
        {question.required ? <Text className="text-base text-error"> *</Text> : null}
      </Text>
      {question.hint ? <Text className="mt-1 text-sm text-muted">{question.hint}</Text> : null}
      <View className="mt-3">
        {question.kind === 'single' || question.kind === 'multi' ? (
          <Choices question={question} answer={answer} onAnswer={onAnswer} />
        ) : question.kind === 'text' ? (
          <Textarea
            label={question.label}
            hideLabel
            value={typeof answer === 'string' ? answer : ''}
            onChangeText={(text) => onAnswer(text)}
            placeholder={question.placeholder ?? 'Type here'}
            maxLength={300}
          />
        ) : (
          <Photos question={question} answer={answer} onAnswer={onAnswer} />
        )}
      </View>
    </View>
  )
}

function Choices({ question, answer, onAnswer }: { question: Question; answer: Answer | undefined; onAnswer: (a: Answer | null) => void }) {
  const multi = question.kind === 'multi'
  const chosen = Array.isArray(answer) ? answer : typeof answer === 'string' ? [answer] : []
  return (
    <View className="flex-row flex-wrap gap-2" accessibilityRole={multi ? undefined : 'radiogroup'}>
      {question.options.map((option) => {
        const on = chosen.includes(option)
        return (
          <Chip
            key={option}
            selected={on}
            showCheck={multi}
            onPress={() => {
              if (!multi) return onAnswer(on ? null : option)
              onAnswer(on ? chosen.filter((o) => o !== option) : [...chosen, option])
            }}
          >
            {option}
          </Chip>
        )
      })}
      {multi ? <Text className="mt-1 w-full text-xs text-muted">Pick all that apply.</Text> : null}
    </View>
  )
}

function Photos({ question, answer, onAnswer }: { question: Question; answer: Answer | undefined; onAnswer: (a: Answer | null) => void }) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const photos = Array.isArray(answer) ? answer : []
  const max = question.maxPhotos ?? 3
  const room = max - photos.length

  async function add(source: 'camera' | 'library'): Promise<void> {
    setBusy(true)
    try {
      const picked = await pickMedia('image', source, { multiple: source === 'library', limit: room })
      if (picked.length) onAnswer([...photos, ...picked.map((p) => p.uri)].slice(0, max))
    } catch (error) {
      toast.show(error instanceof Error ? error.message : 'We could not open that.', { tone: 'error' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <View>
      <View className="flex-row flex-wrap gap-3">
        {photos.map((uri) => (
          <View key={uri} className="size-24 overflow-hidden rounded-card bg-plate">
            <Img source={{ uri }} alt="Your photo" className="size-full" />
            <Tappable
              onPress={() => onAnswer(photos.filter((p) => p !== uri))}
              accessibilityLabel="Remove this photo"
              className="absolute right-0 top-0 size-11 items-center justify-center"
            >
              <View className="size-6 items-center justify-center rounded-full bg-night/70">
                <Icon as={X} className="size-3.5 text-white" />
              </View>
            </Tappable>
          </View>
        ))}
      </View>
      {room > 0 ? (
        <View className="mt-3 flex-row gap-3">
          <SourceButton icon={Camera} label="Take photo" disabled={busy} onPress={() => void add('camera')} />
          <SourceButton icon={ImagePlus} label="From gallery" disabled={busy} onPress={() => void add('library')} />
        </View>
      ) : null}
      <Text className="mt-2 text-xs text-muted">{`Up to ${max} photos. Optional, but it helps.`}</Text>
    </View>
  )
}

function SourceButton({ icon, label, onPress, disabled }: { icon: typeof Camera; label: string; onPress: () => void; disabled: boolean }) {
  return (
    <Tappable
      onPress={onPress}
      disabled={disabled}
      className="min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-card border border-dashed border-border active:bg-surface active:opacity-100"
    >
      <Icon as={icon} className="size-4 text-brand" />
      <Text className="text-sm font-semibold text-brand">{label}</Text>
    </Tappable>
  )
}
