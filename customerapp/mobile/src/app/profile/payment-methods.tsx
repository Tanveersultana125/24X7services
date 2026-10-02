// PORT-PENDING: /profile/payment-methods — port of frontend/app/profile/payment-methods/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Payment Methods" showBack />}>
      <Text className="mt-6 text-muted">/profile/payment-methods</Text>
    </Screen>
  )
}
