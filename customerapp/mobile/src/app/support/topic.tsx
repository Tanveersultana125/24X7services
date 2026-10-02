// PORT-PENDING: /support/topic — port of frontend/app/support/topic/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Topic" showBack />}>
      <Text className="mt-6 text-muted">/support/topic</Text>
    </Screen>
  )
}
