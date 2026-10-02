// PORT-PENDING: /profile/gift-cards — port of frontend/app/profile/gift-cards/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Gift Cards" showBack />}>
      <Text className="mt-6 text-muted">/profile/gift-cards</Text>
    </Screen>
  )
}
