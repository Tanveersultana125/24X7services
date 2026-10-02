import { View } from 'react-native'
import { Trash2 } from 'lucide-react-native'
import { Button, Icon, Sheet, Tappable, Text } from '@/components/ui'

/** The bin key on an AI history row. Sits outside the row's link. */
export function DeleteKey({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Tappable
      onPress={onClick}
      accessibilityLabel={label}
      className="size-10 shrink-0 items-center justify-center rounded-xl active:bg-danger-soft active:opacity-100"
    >
      {({ pressed }) => <Icon as={Trash2} className={pressed ? 'size-[18px] text-danger' : 'size-[18px] text-faint'} />}
    </Tappable>
  )
}

/** Asks before anything is removed — there is no way to bring it back. */
export function ConfirmDelete({
  open,
  title,
  body,
  onCancel,
  onConfirm,
}: {
  open: boolean
  title: string
  body: string
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <Sheet open={open} onClose={onCancel} title={title}>
      <Text className="text-sm text-muted">{body}</Text>
      <View className="mt-5 flex-row gap-2">
        <Button variant="secondary" size="lg" className="flex-1" onPress={onCancel}>
          Cancel
        </Button>
        <Button variant="danger" size="lg" className="flex-1" onPress={onConfirm}>
          <Icon as={Trash2} className="size-4" />
          Delete
        </Button>
      </View>
    </Sheet>
  )
}
