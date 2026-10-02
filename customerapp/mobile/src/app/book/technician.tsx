// PORT-PENDING: /book/technician — port of frontend/app/book/technician/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Technician" showBack />}>
      <Text className="mt-6 text-muted">/book/technician</Text>
    </Screen>
  )
}
