// PORT-PENDING: /support/chat — port of frontend/app/support/chat/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Chat" showBack />}>
      <Text className="mt-6 text-muted">/support/chat</Text>
    </Screen>
  )
}
