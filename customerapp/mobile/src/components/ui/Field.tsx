import { useState } from 'react'
import { TextInput, View, type TextInputProps } from 'react-native'
import { AlertCircle } from 'lucide-react-native'
import { cn } from '@/lib/cn'
import { Icon, useColor } from './Icon'
import { Text } from './Text'

/**
 * Text inputs and the label/hint/error scaffolding around them. The error is
 * read out with the field (accessibilityHint), not only painted red.
 */

interface ShellProps {
  label: string
  hideLabel?: boolean
  hint?: string
  error?: string
  required?: boolean
  children: React.ReactNode
}

export function FieldShell({ label, hideLabel, hint, error, required, children }: ShellProps) {
  return (
    <View className="gap-1.5">
      {hideLabel ? null : (
        <Text className="text-sm font-medium text-ink">
          {label}
          {required ? <Text className="text-sm text-error"> *</Text> : null}
        </Text>
      )}
      {children}
      {hint && !error ? <Text className="text-xs text-muted">{hint}</Text> : null}
      {error ? (
        <View className="flex-row items-start gap-1.5" accessibilityRole="alert">
          <Icon as={AlertCircle} className="mt-px size-3.5 text-error" />
          <Text className="flex-1 text-xs text-error">{error}</Text>
        </View>
      ) : null}
    </View>
  )
}

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label: string
  hideLabel?: boolean
  hint?: string
  error?: string
  required?: boolean
  disabled?: boolean
  className?: string
  /** For a field with something fixed in front of it (+91). */
  prefix?: React.ReactNode
}

export function Input({
  label,
  hideLabel,
  hint,
  error,
  required,
  disabled,
  className,
  prefix,
  multiline,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false)
  const placeholder = useColor('text-muted')
  const selection = useColor('text-brand')
  return (
    <FieldShell label={label} hideLabel={hideLabel} hint={hint} error={error} required={required}>
      <View
        className={cn(
          'flex-row items-center rounded-card border bg-bg',
          error ? 'border-error' : focused ? 'border-brand' : 'border-border',
          disabled && 'bg-surface'
        )}
      >
        {prefix}
        <TextInput
          accessibilityLabel={label}
          accessibilityHint={error}
          editable={!disabled}
          multiline={multiline}
          placeholderTextColor={placeholder}
          selectionColor={selection}
          cursorColor={selection}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={(event) => {
            setFocused(true)
            onFocus?.(event)
          }}
          onBlur={(event) => {
            setFocused(false)
            onBlur?.(event)
          }}
          className={cn(
            'min-h-12 flex-1 px-4 py-3 font-normal text-base text-ink',
            multiline && 'min-h-28',
            disabled && 'text-muted',
            className
          )}
          {...props}
        />
      </View>
    </FieldShell>
  )
}

export function Textarea(props: Omit<InputProps, 'multiline'> & { rows?: number }) {
  const { rows = 4, className, ...rest } = props
  return (
    <Input
      multiline
      numberOfLines={rows}
      className={cn(rows <= 3 ? 'min-h-20' : 'min-h-28', className)}
      {...rest}
    />
  )
}
