// PORT-PENDING: /profile/payments — port of frontend/app/profile/payments/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Payments" showBack />}>
      <Text className="mt-6 text-muted">/profile/payments</Text>
    </Screen>
  )
}
