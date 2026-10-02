// PORT-PENDING: /legal/privacy — port of frontend/app/legal/privacy/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Privacy" showBack />}>
      <Text className="mt-6 text-muted">/legal/privacy</Text>
    </Screen>
  )
}
