// PORT-PENDING: /assistant — port of frontend/app/assistant/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Assistant" showBack />}>
      <Text className="mt-6 text-muted">/assistant</Text>
    </Screen>
  )
}
