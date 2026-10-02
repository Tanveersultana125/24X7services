// PORT-PENDING: /book/address — port of frontend/app/book/address/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Address" showBack />}>
      <Text className="mt-6 text-muted">/book/address</Text>
    </Screen>
  )
}
