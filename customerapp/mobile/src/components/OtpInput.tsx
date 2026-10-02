import { useRef } from 'react'
import { Platform, Pressable, TextInput, View } from 'react-native'
import { Text } from '@/components/ui/Text'
import { cn } from '@/lib/cn'

/**
 * The boxed code entry, used for the sign-in OTP and for reading back a job
 * OTP.
 *
 * Underneath the boxes is one real input holding the whole value. Six separate
 * inputs look the same and behave badly: a paste lands in one box, autofill
 * fills one box, and a backspace at the start of one has to reach into the
 * previous. One field marked as a one-time code lets the platform do all of
 * it — including offering the code from the SMS above the keyboard.
 */

export interface OtpInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  /** Called once the last digit lands, so the screen can submit itself. */
  onComplete?: (value: string) => void
  label?: string
  error?: string
  disabled?: boolean
  autoFocus?: boolean
  className?: string
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  label = 'Enter the code',
  error,
  disabled = false,
  autoFocus = false,
  className,
}: OtpInputProps) {
  const inputRef = useRef<TextInput>(null)

  function handleChange(next: string): void {
    const digits = next.replace(/\D/g, '').slice(0, length)
    onChange(digits)
    if (digits.length === length) onComplete?.(digits)
  }

  return (
    <View className={cn('gap-2', className)}>
      {/* Tapping anywhere on the boxes focuses the field behind them. */}
      <Pressable onPress={() => inputRef.current?.focus()} className="relative" disabled={disabled}>
        <View className="flex-row justify-between gap-2" aria-hidden>
          {Array.from({ length }).map((_, index) => {
            const char = value[index]
            const isCursor = index === value.length
            return (
              <View
                key={index}
                className={cn(
                  'h-14 flex-1 items-center justify-center rounded-card border',
                  error ? 'border-error' : char ? 'border-ink' : isCursor ? 'border-ink' : 'border-border'
                )}
              >
                <Text className={cn('text-xl font-bold', error ? 'text-error' : char ? 'text-ink' : 'text-muted')}>
                  {char ?? ''}
                </Text>
              </View>
            )
          })}
        </View>

        <TextInput
          ref={inputRef}
          accessibilityLabel={label}
          accessibilityHint={error}
          keyboardType="number-pad"
          // What makes the SMS code suggestion appear: iOS reads
          // textContentType, Android reads autoComplete.
          textContentType="oneTimeCode"
          autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
          maxLength={length}
          value={value}
          editable={!disabled}
          autoFocus={autoFocus}
          onChangeText={handleChange}
          caretHidden
          // Invisible, but still the focused element — so the keyboard and
          // autofill all behave normally.
          className="absolute inset-0 text-transparent opacity-0"
        />
      </Pressable>

      {error ? (
        <Text accessibilityRole="alert" className="text-xs text-error">
          {error}
        </Text>
      ) : null}
    </View>
  )
}

/**
 * The read-only counterpart: the job OTP the customer reads out to the
 * technician. Four digits, spaced so they can be spoken.
 */
export function OtpDisplay({ otp, caption, className }: { otp: string; caption: string; className?: string }) {
  return (
    <View className={cn('items-center gap-2 rounded-card border border-ink bg-bg p-5', className)}>
      <Text className="text-center text-xs font-medium uppercase tracking-wide text-muted">{caption}</Text>
      {/* The trailing letter-spacing pushes the group off-centre otherwise. */}
      <Text
        accessibilityLabel={otp.split('').join(' ')}
        className="pl-[12px] text-center text-3xl font-extrabold tracking-[12px] text-ink"
      >
        {otp}
      </Text>
    </View>
  )
}
