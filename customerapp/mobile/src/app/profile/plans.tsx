// PORT-PENDING: /profile/plans — port of frontend/app/profile/plans/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Plans" showBack />}>
      <Text className="mt-6 text-muted">/profile/plans</Text>
    </Screen>
  )
}
