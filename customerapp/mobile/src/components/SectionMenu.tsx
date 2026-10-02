import { useState } from 'react'
import { Modal as RNModal, Pressable, ScrollView, View, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Check, Menu, X } from 'lucide-react-native'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui/Icon'
import { Img } from '@/components/ui/Img'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'

/**
 * "☰ Menu", floating at the foot of a long list, the way the marketplaces put
 * it on a category: a way to the part of the page you want without scrolling
 * past the parts you do not.
 *
 * Tapped, the page dims and a card rises over it with a tile per section — a
 * photograph of that kind of work, or for the plan its saving, and the name
 * under it — then, where the appliance comes in kinds, a tile per kind
 * (front-load, top-load…) to say which one is yours. A round close button
 * sits under the card where the pill was. A section tile scrolls there; a
 * kind tile picks that kind for the page. Either closes it all, as do the
 * dimmed page, the close button and the back gesture.
 *
 * On the web each tile is the id of an element on the page and the menu
 * scrolls to it itself. A native page has no ids to look up, so it hands the
 * id to `onJump` and the page — which knows where each section was laid out —
 * does the scrolling. The menu still cannot offer a heading the page does not
 * have, because the page builds the list from its own sections.
 *
 * It floats over the page, so render it beside the screen in a full-size
 * container, not inside the scroll view.
 */

export interface SectionMenuItem {
  id: string
  label: string
  /** A photograph of that section's work. */
  photo?: string
  /**
   * Words in place of a photograph — for the plan, its saving:
   * ["Save", "18%", "OFF"], the middle one set large.
   */
  offer?: readonly [string, string, string]
}

export interface SectionMenuType {
  key: string
  label: string
  photo?: string
}

export function SectionMenu({
  items,
  types = [],
  typeTitle,
  chosenType = null,
  onType,
  aboveBar = false,
  barHeight = 0,
  onJump,
}: {
  items: readonly SectionMenuItem[]
  /**
   * The kinds of machine the appliance comes in, as a second row of tiles.
   * Picking one tells the page which kind is the customer's; picking the
   * chosen one again lets go.
   */
  types?: readonly SectionMenuType[]
  /** The heading over the kinds: "Machine type". */
  typeTitle?: string
  chosenType?: string | null
  onType?: (key: string | null) => void
  /** Whether a bar is pinned at the foot of the screen (the cart's), to clear it. */
  aboveBar?: boolean
  /** That bar's height, measured by the page. It already includes the bottom inset. */
  barHeight?: number
  /** Scrolls the page to the section with this id. */
  onJump?: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const insets = useSafeAreaInsets()
  const { height } = useWindowDimensions()

  if (items.length < 2) return null

  function go(id: string): void {
    setOpen(false)
    onJump?.(id)
  }

  // Above the pinned bar when there is one, with a gap; otherwise above the
  // bottom edge and its inset.
  const lift = aboveBar && barHeight > 0 ? barHeight + 12 : 16 + insets.bottom

  return (
    <>
      <RNModal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <View
          accessibilityViewIsModal
          accessibilityLabel="Jump to a section"
          className="flex-1 items-center justify-end px-4"
          style={{ paddingBottom: lift }}
        >
          {/* A tap on the dimmed page, not on the card, closes it. */}
          <Pressable
            accessibilityLabel="Close menu"
            className="absolute inset-0 bg-night/60"
            onPress={() => setOpen(false)}
          />
          <View className="w-full max-w-md items-center">
            <View className="w-full overflow-hidden rounded-[20px] bg-bg" style={{ maxHeight: height * 0.7 }}>
              <ScrollView contentContainerClassName="px-4 py-6">
                <TileGrid>
                  {items.map((item) => (
                    <Tile key={item.id} label={item.label} onPress={() => go(item.id)}>
                      {item.offer ? (
                        <View className="size-full items-center justify-center">
                          <Text className="text-xs font-semibold leading-none text-success">{item.offer[0]}</Text>
                          <Text className="mt-1 text-2xl font-bold leading-none text-success">{item.offer[1]}</Text>
                          <Text className="mt-1 text-lg font-bold leading-none text-success">{item.offer[2]}</Text>
                        </View>
                      ) : item.photo ? (
                        <Img src={item.photo} alt="" className="absolute inset-0" />
                      ) : null}
                    </Tile>
                  ))}
                </TileGrid>

                {types.length > 0 && onType ? (
                  <View className="mt-6 border-t border-border pt-5">
                    <Text className="text-base font-semibold text-ink">{typeTitle ?? 'Type'}</Text>
                    <TileGrid className="mt-4">
                      {types.map((type) => {
                        const on = chosenType === type.key
                        return (
                          <Tile
                            key={type.key}
                            label={type.label}
                            on={on}
                            onPress={() => {
                              onType(on ? null : type.key)
                              setOpen(false)
                            }}
                          >
                            {type.photo ? (
                              // Product shots on white, so contained and
                              // multiplied onto the tile rather than cropped
                              // through the machine.
                              <View className="absolute inset-0 p-2" style={{ mixBlendMode: 'multiply' }}>
                                <Img src={type.photo} alt="" contentFit="contain" className="size-full" />
                              </View>
                            ) : null}
                            {on ? (
                              <View className="absolute right-1.5 top-1.5 size-5 items-center justify-center rounded-full bg-brand">
                                <Icon as={Check} className="size-3.5 text-white" />
                              </View>
                            ) : null}
                          </Tile>
                        )
                      })}
                    </TileGrid>
                  </View>
                ) : null}
              </ScrollView>
            </View>

            <Tappable
              onPress={() => setOpen(false)}
              accessibilityLabel="Close menu"
              className="mt-5 size-12 items-center justify-center rounded-full bg-bg shadow-raised"
            >
              <Icon as={X} className="size-6 text-ink" />
            </Tappable>
          </View>
        </View>
      </RNModal>

      {!open ? (
        <View pointerEvents="box-none" className="absolute inset-x-0 z-30 items-center px-4" style={{ bottom: lift }}>
          <Tappable
            onPress={() => setOpen(true)}
            accessibilityLabel="Menu"
            className="h-12 flex-row items-center gap-2 rounded-pill border border-white/15 bg-night px-6 shadow-raised active:scale-95 active:opacity-100"
          >
            <Icon as={Menu} className="size-5 text-white" />
            <Text className="text-base font-semibold text-white">Menu</Text>
          </Tappable>
        </View>
      ) : null}
    </>
  )
}

/** Three to a row. */
function TileGrid({ className, children }: { className?: string; children: React.ReactNode }) {
  return <View className={cn('-mx-1.5 flex-row flex-wrap gap-y-6', className)}>{children}</View>
}

function Tile({
  label,
  on,
  onPress,
  children,
}: {
  label: string
  /** For a kind tile: whether it is the chosen one. Undefined for a section. */
  on?: boolean
  onPress: () => void
  children: React.ReactNode
}) {
  return (
    <View className="w-1/3 px-1.5">
      <Tappable
        onPress={onPress}
        accessibilityLabel={label}
        accessibilityState={on === undefined ? undefined : { selected: on }}
        className="items-center active:opacity-100"
      >
        {({ pressed }) => (
          <>
            <View
              className={cn(
                'aspect-square w-full max-w-24 overflow-hidden rounded-card bg-plate',
                on && 'border-2 border-brand',
                pressed && 'scale-95'
              )}
            >
              {children}
            </View>
            <Text
              numberOfLines={2}
              className={cn('mt-2 text-center text-sm leading-snug', on ? 'font-semibold text-brand' : 'text-ink')}
            >
              {label}
            </Text>
          </>
        )}
      </Tappable>
    </View>
  )
}
