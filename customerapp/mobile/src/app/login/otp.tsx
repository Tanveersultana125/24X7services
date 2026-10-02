// PORT-PENDING: /login/otp — port of frontend/app/login/otp/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Otp" showBack />}>
      <Text className="mt-6 text-muted">/login/otp</Text>
    </Screen>
  )
}
