// PORT-PENDING: /profile — port of frontend/app/profile/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={true} header={<Header title="Profile" />}>
      <Text className="mt-6 text-muted">/profile</Text>
    </Screen>
  )
}
