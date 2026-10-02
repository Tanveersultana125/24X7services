// PORT-PENDING: /login — port of frontend/app/login/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Login" showBack />}>
      <Text className="mt-6 text-muted">/login</Text>
    </Screen>
  )
}
