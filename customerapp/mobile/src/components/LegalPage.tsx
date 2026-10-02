import { View } from 'react-native'
import { Header, Screen } from '@/components/Screen'
import { Text } from '@/components/ui/Text'
import { brand } from '@/config/brand'

/**
 * The frame the three legal documents share: plain prose, no data, nothing to
 * load. A customer who opens the terms while their connection is poor should
 * still be able to read them.
 *
 * DECISION NEEDED: everything in these three files is a plain-English statement
 * of how the app actually behaves, written so that a customer is not misled. It
 * is not a lawyer's draft and does not pretend to be. Before launch a lawyer has
 * to review all three, and the version they approve becomes `termsVersion` in
 * the business config — which is what every consent record points at.
 */

export interface LegalSection {
  heading: string
  paragraphs: readonly string[]
  /** Rendered as a bulleted list under the paragraphs. */
  points?: readonly string[]
}

export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string
  /** The date this wording last changed, in words. */
  updated: string
  intro: string
  sections: readonly LegalSection[]
}) {
  return (
    <Screen header={<Header title={title} showBack backFallback="/profile/settings" />} contentClassName="pb-16">
      <Text className="mt-4 text-xs text-muted">Last updated {updated}</Text>
      <Text className="mt-3 text-sm leading-[22px] text-ink">{intro}</Text>

      {sections.map((section) => (
        <View key={section.heading} className="mt-7">
          <Text accessibilityRole="header" className="text-base font-bold text-ink">
            {section.heading}
          </Text>
          {section.paragraphs.map((paragraph) => (
            <Text key={paragraph} className="mt-2 text-sm leading-[22px] text-muted">
              {paragraph}
            </Text>
          ))}
          {section.points ? (
            <View className="mt-2 gap-1.5">
              {section.points.map((point) => (
                <View key={point} className="flex-row gap-2">
                  <Text aria-hidden className="text-sm leading-[22px] text-muted">
                    ·
                  </Text>
                  <Text className="min-w-0 flex-1 text-sm leading-[22px] text-muted">{point}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ))}

      <View className="mt-10 border-t border-border pt-5">
        <Text className="text-xs leading-[20px] text-muted">
          Questions about any of this go to {brand.supportEmail}, or through Support in the app.
        </Text>
      </View>
    </Screen>
  )
}
