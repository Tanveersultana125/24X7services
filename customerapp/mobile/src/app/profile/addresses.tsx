// PORT-PENDING: /profile/addresses — port of frontend/app/profile/addresses/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Addresses" showBack />}>
      <Text className="mt-6 text-muted">/profile/addresses</Text>
    </Screen>
  )
}
