// PORT-PENDING: /book/payment — port of frontend/app/book/payment/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Payment" showBack />}>
      <Text className="mt-6 text-muted">/book/payment</Text>
    </Screen>
  )
}
