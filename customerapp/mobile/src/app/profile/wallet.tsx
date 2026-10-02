// PORT-PENDING: /profile/wallet — port of frontend/app/profile/wallet/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Wallet" showBack />}>
      <Text className="mt-6 text-muted">/profile/wallet</Text>
    </Screen>
  )
}
