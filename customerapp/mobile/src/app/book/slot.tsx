// PORT-PENDING: /book/slot — port of frontend/app/book/slot/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Slot" showBack />}>
      <Text className="mt-6 text-muted">/book/slot</Text>
    </Screen>
  )
}
