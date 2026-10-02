// PORT-PENDING: /profile/reviews — port of frontend/app/profile/reviews/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Reviews" showBack />}>
      <Text className="mt-6 text-muted">/profile/reviews</Text>
    </Screen>
  )
}
