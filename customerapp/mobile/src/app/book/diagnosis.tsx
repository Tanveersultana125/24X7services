// PORT-PENDING: /book/diagnosis — port of frontend/app/book/diagnosis/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Diagnosis" showBack />}>
      <Text className="mt-6 text-muted">/book/diagnosis</Text>
    </Screen>
  )
}
