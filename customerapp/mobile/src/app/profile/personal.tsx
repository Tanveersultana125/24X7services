// PORT-PENDING: /profile/personal — port of frontend/app/profile/personal/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Personal" showBack />}>
      <Text className="mt-6 text-muted">/profile/personal</Text>
    </Screen>
  )
}
