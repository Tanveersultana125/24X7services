// PORT-PENDING: /support — port of frontend/app/support/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={true} header={<Header title="Support" />}>
      <Text className="mt-6 text-muted">/support</Text>
    </Screen>
  )
}
