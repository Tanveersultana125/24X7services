// PORT-PENDING: /cart — port of frontend/app/cart/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Cart" showBack />}>
      <Text className="mt-6 text-muted">/cart</Text>
    </Screen>
  )
}
