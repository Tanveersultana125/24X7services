import {
  KeyboardAvoidingView,
  Modal as RNModal,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { X } from 'lucide-react-native'
import { cn } from '@/lib/cn'
import { Button } from './Button'
import { Icon } from './Icon'
import { Tappable } from './Tappable'
import { Text } from './Text'

/**
 * The two overlays: a BottomSheet for anything the customer scrolls or picks
 * from (a list, a filter, an address book), and a Modal for anything they
 * answer (a confirmation). Both are system modals, so the Android back button
 * closes them — unless `dismissable` is off while a request is in flight.
 */

interface OverlayProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  dismissable?: boolean
  footer?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <Tappable
      onPress={onClose}
      accessibilityLabel="Close"
      className="-m-2 size-11 items-center justify-center rounded-full active:bg-surface"
    >
      <Icon as={X} className="size-5 text-muted" />
    </Tappable>
  )
}

export function BottomSheet({
  open,
  onClose,
  title,
  description,
  dismissable = true,
  footer,
  children,
  className,
}: OverlayProps) {
  const insets = useSafeAreaInsets()
  return (
    <RNModal
      visible={open}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={() => {
        if (dismissable) onClose()
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end"
      >
        <Pressable
          accessibilityLabel="Close"
          className="absolute inset-0 bg-night/50"
          onPress={() => {
            if (dismissable) onClose()
          }}
        />
        <View
          accessibilityViewIsModal
          className={cn('max-h-[85%] rounded-t-[20px] border-t border-border bg-bg', className)}
          style={{ paddingBottom: insets.bottom }}
        >
          <View className="items-center pt-3">
            <View className="h-1 w-10 rounded-full bg-border" />
          </View>
          <View className="flex-row items-start gap-3 px-5 pb-3 pt-4">
            <View className="min-w-0 flex-1">
              <Text accessibilityRole="header" className="text-lg font-semibold text-ink">
                {title}
              </Text>
              {description ? <Text className="mt-1 text-sm text-muted">{description}</Text> : null}
            </View>
            {dismissable ? <CloseButton onClose={onClose} /> : null}
          </View>
          <ScrollView
            className="shrink"
            contentContainerClassName="px-5 pb-4"
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
          {footer ? <View className="border-t border-border p-4">{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  )
}

export function Modal({
  open,
  onClose,
  title,
  description,
  dismissable = true,
  footer,
  children,
  className,
}: OverlayProps) {
  return (
    <RNModal
      visible={open}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={() => {
        if (dismissable) onClose()
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 items-center justify-center px-4"
      >
        <Pressable
          accessibilityLabel="Close"
          className="absolute inset-0 bg-night/50"
          onPress={() => {
            if (dismissable) onClose()
          }}
        />
        <View
          accessibilityViewIsModal
          className={cn(
            'max-h-[85%] w-full max-w-md rounded-card border border-border bg-bg shadow-raised',
            className
          )}
        >
          <View className="flex-row items-start gap-3 px-5 pb-2 pt-5">
            <View className="min-w-0 flex-1">
              <Text accessibilityRole="header" className="text-lg font-semibold text-ink">
                {title}
              </Text>
              {description ? <Text className="mt-1 text-sm text-muted">{description}</Text> : null}
            </View>
            {dismissable ? <CloseButton onClose={onClose} /> : null}
          </View>
          {children ? (
            <ScrollView className="shrink" contentContainerClassName="px-5 pb-2" keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
          ) : null}
          {footer ? (
            <View className="flex-row flex-wrap justify-end gap-2 px-5 pb-5 pt-3">{footer}</View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  )
}

/** Reversible vs destructive: `destructive` turns the confirm button red. */
export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Go back',
  destructive = false,
  loading = false,
  children,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  loading?: boolean
  children?: React.ReactNode
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      {...(description ? { description } : {})}
      dismissable={!loading}
      footer={
        <>
          <Button variant="secondary" size="sm" onPress={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'danger' : 'primary'}
            size="sm"
            onPress={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  )
}
