// PORT-PENDING: /profile/settings — port of frontend/app/profile/settings/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Settings" showBack />}>
      <Text className="mt-6 text-muted">/profile/settings</Text>
    </Screen>
  )
}
