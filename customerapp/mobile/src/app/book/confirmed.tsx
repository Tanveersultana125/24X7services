// PORT-PENDING: /book/confirmed — port of frontend/app/book/confirmed/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Confirmed" showBack />}>
      <Text className="mt-6 text-muted">/book/confirmed</Text>
    </Screen>
  )
}
