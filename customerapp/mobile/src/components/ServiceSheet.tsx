import { useCallback, useEffect, useState } from 'react'
import {
  Modal as RNModal,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native'
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Linking from 'expo-linking'
import type { Href } from 'expo-router'
import {
  BadgeCheck,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  Headphones,
  ReceiptText,
  Share2,
  ShieldCheck,
  X,
  type LucideIcon,
} from 'lucide-react-native'
import type {
  CatalogAppliance,
  CatalogIssue,
  CatalogService,
  ServiceReview,
} from '@app/shared'

import { BrandDisclaimer } from '@/components/BrandCard'
import { ReviewsPanel } from '@/components/ReviewsSheet'
import { usePrefersReducedMotion } from '@/components/ServiceClip'
import { durationNote } from '@/components/ServiceRail'
import { ShareSheet } from '@/components/ShareSheet'
import { StickyCTA } from '@/components/Screen'
import { Icon } from '@/components/ui/Icon'
import { Img } from '@/components/ui/Img'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { addToCart, countForService, inCart, useCart } from '@/lib/cart'
import {
  fetchBrands,
  fetchBusinessConfig,
  fetchServiceReviews,
} from '@/lib/catalog'
import { formatPaise } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'
import { cn } from '@/lib/cn'

/**
 * A service, opened over the page it was tapped on — the way the marketplaces
 * open one: photographs across the top, the name and what it starts at, the
 * choices it needs, then everything worth knowing before booking it, in the
 * order somebody asks: how it goes, who comes, which brands, what stands
 * behind it, what it does not cover, the usual questions, and what other
 * people made of it.
 *
 * The choices are steps. A repair is booked for a problem, so the first step
 * is which one; every appliance with a kind — front-load or top-load, split or
 * window — asks that next. A step opens once the one before it is answered,
 * and Add at the foot waits for both. The kind rides along in the cart and
 * opens the booking's details step already chosen; it is not decoration.
 *
 * Every line comes from the catalog entry, the business config, the brands
 * list or the reviews written for this service. Nothing is a number made up
 * to fill a slot the marketplaces happen to have.
 */

/** Only a repair is booked for a problem; the rest go into the cart as they are. */
export function serviceOptions(
  service: Pick<CatalogService, 'applianceId' | 'serviceKey'>,
  issues: readonly CatalogIssue[]
): CatalogIssue[] {
  if (service.serviceKey !== 'repair') return []
  return issues.filter((issue) => issue.applianceId === service.applianceId)
}

export interface ServiceSheetProps {
  /** The service that is open, or null when the sheet is closed. */
  service: CatalogService | null
  appliance?: CatalogAppliance
  /** Every service in the catalog. */
  services: readonly CatalogService[]
  issues: readonly CatalogIssue[]
  /** The kind of machine already chosen on the page, picked in advance here. */
  initialKind?: string | null
  onClose: () => void
}

/**
 * Built on the system Modal rather than BottomSheet: the photographs run to
 * the panel's top edge with no title bar above them, and the close button
 * hangs above the panel, on the backdrop, where scrolled content can never
 * slide underneath it.
 */
export function ServiceSheet({
  service,
  appliance,
  issues,
  initialKind,
  onClose,
}: ServiceSheetProps) {
  const { height } = useWindowDimensions()
  // The sheet keeps the last service while it slides away, so the panel does
  // not empty itself mid-animation.
  const [shown, setShown] = useState<CatalogService | null>(service)
  if (service !== null && service !== shown) setShown(service)
  const current = service ?? shown

  return (
    <RNModal
      visible={service !== null}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        <Pressable
          accessibilityLabel="Close"
          className="absolute inset-0 bg-night/40"
          onPress={onClose}
        />
        {current ? (
          // The frame: room on top for the close button, so it is inside the
          // touchable area on Android rather than hanging outside the panel.
          <View pointerEvents="box-none" className="w-full pt-14">
            <Tappable
              onPress={onClose}
              accessibilityLabel="Close"
              className="absolute right-4 top-0 z-10 size-11 items-center justify-center rounded-full bg-bg shadow-md active:bg-surface active:opacity-100"
            >
              <Icon as={X} className="size-5 text-ink" />
            </Tappable>
            <View accessibilityViewIsModal style={{ maxHeight: height * 0.88 }}>
              {/* Keyed, so opening another service starts its choices afresh. */}
              <ServiceDetails
                key={current.id}
                variant="sheet"
                service={current}
                appliance={appliance}
                issues={issues}
                initialKind={initialKind}
                onClose={onClose}
              />
            </View>
          </View>
        ) : null}
      </View>
    </RNModal>
  )
}

/**
 * Everything the sheet shows, as its own piece: the sheet frames it in a
 * panel from the bottom, and the service's own page (`/services/detail`) lays
 * the same thing out full width — one design wherever a service is opened,
 * rather than a sheet saying one thing and a page another.
 *
 * Both variants scroll inside themselves and pin the add bar at the foot, so
 * the page that hosts the `page` variant renders it in `Screen scroll={false}`.
 */
export function ServiceDetails({
  variant,
  titleId: _titleId,
  service,
  appliance,
  issues,
  initialKind,
  onClose,
}: {
  /** In the sheet it scrolls inside the panel; on a page, it fills the screen. */
  variant: 'sheet' | 'page'
  /** Kept for parity with the web component; unused on native. */
  titleId?: string
  service: CatalogService
  appliance?: CatalogAppliance
  issues: readonly CatalogIssue[]
  /** The kind of machine already chosen, if any: that step starts answered. */
  initialKind?: string | null
  /** Closes the sheet on the way to another page; nothing to close on a page. */
  onClose?: () => void
}) {
  const page = variant === 'page'
  const cart = useCart()
  const insets = useSafeAreaInsets()

  const loadExtras = useCallback(async () => {
    const [config, brands, reviews] = await Promise.all([
      fetchBusinessConfig().catch(() => null),
      fetchBrands().catch(() => []),
      fetchServiceReviews(service.applianceId, service.serviceKey).catch(
        () => [] as ServiceReview[]
      ),
    ])
    return { config, brands, reviews }
  }, [service.applianceId, service.serviceKey])
  const extras = useAsync(loadExtras)

  const options = serviceOptions(service, issues)
  // The one "kind of machine" question the appliance asks, if it asks one.
  const kindField = appliance?.detailFields.find(
    (field) => field.kind === 'select' && field.key === 'type'
  )
  const kinds = kindField?.options ?? []

  const [issueId, setIssueId] = useState<string | null>(null)
  const [kind, setKind] = useState<string | null>(
    initialKind && kinds.includes(initialKind) ? initialKind : null
  )
  const needsIssue = options.length > 0
  const needsKind = kinds.length > 0
  const [openStep, setOpenStep] = useState<1 | 2>(needsIssue ? 1 : 2)

  const ready = (!needsIssue || issueId !== null) && (!needsKind || kind !== null)
  const item = {
    applianceId: service.applianceId,
    serviceKey: service.serviceKey,
    ...(issueId ? { issueId } : {}),
    ...(kind ? { applianceType: kind } : {}),
  }
  const already = inCart(cart, item)
  const added = countForService(cart, service)

  const photos = [
    ...new Set(
      [service.technicianPhoto, service.photo, appliance?.heroImage].filter(
        (photo): photo is string => Boolean(photo)
      )
    ),
  ]
  const warrantyDays =
    service.warrantyDays ?? extras.data?.config?.defaultWarrantyDays
  const duration = durationNote(service.durationMinutes)?.replace(/^About /, '')
  const brands = extras.data?.brands ?? []

  const [shareOpen, setShareOpen] = useState(false)
  // A link that opens this service in the app (or on the web build, the page).
  const shareUrl = Linking.createURL('/services/detail', {
    queryParams: { a: service.applianceId, s: service.serviceKey },
  })
  const detailHref =
    `/services/detail?a=${service.applianceId}&s=${service.serviceKey}` as Href

  const footerDetail = (
    <View className="min-w-0 flex-1" accessibilityLiveRegion="polite">
      {added > 0 ? (
        <>
          <Text className="text-base font-semibold text-ink">
            {added} {added === 1 ? 'item' : 'items'} added
          </Text>
          <Tappable href="/cart" onPress={onClose} className="self-start">
            <Text className="text-sm font-semibold text-brand">View cart</Text>
          </Tappable>
        </>
      ) : (
        <>
          <Text className="text-base font-semibold text-ink">
            {formatPaise(service.visitFee)}
          </Text>
          <Text className="text-sm text-muted">
            {ready ? 'Visit fee' : 'Pick the options above'}
          </Text>
        </>
      )}
    </View>
  )
  const footerButton = (
    <Tappable
      disabled={!ready || already}
      onPress={() => addToCart(item)}
      accessibilityState={{ disabled: !ready || already }}
      className={cn(
        'h-12 flex-row items-center justify-center gap-1.5 rounded-card px-7',
        already
          ? 'border border-brand bg-brand-soft'
          : ready
            ? 'bg-brand active:bg-brand-deep active:opacity-100'
            : 'bg-surface'
      )}
    >
      {already ? <Icon as={Check} className="size-4 text-brand" /> : null}
      <Text
        className={cn(
          'text-base font-semibold',
          already ? 'text-brand' : ready ? 'text-white' : 'text-muted'
        )}
      >
        {already ? 'Added' : 'Add to cart'}
      </Text>
    </Tappable>
  )

  return (
    <View
      className={cn(
        'min-h-0 shrink overflow-hidden bg-bg',
        page ? 'flex-1' : 'rounded-t-[20px]'
      )}
    >
      <ScrollView className="shrink" keyboardShouldPersistTaps="handled">
        <PhotoStrip photos={photos} />

        <View className="px-5 pb-6 pt-6">
          <Text accessibilityRole="header" className="text-2xl font-bold text-ink">
            {service.name}
          </Text>
          <Text className="mt-1.5 text-base text-ink">
            <Text className="text-base font-semibold text-ink">
              Starts at {formatPaise(service.visitFee)}
            </Text>
            {duration ? <Text className="text-base text-muted">{` · ${duration}`}</Text> : null}
          </Text>
        </View>

        {needsIssue || needsKind ? (
          <>
            <Band />
            <View className="px-5 py-7">
              <Text accessibilityRole="header" className="text-2xl font-bold text-ink">
                Select requirements
              </Text>
              <View className="mt-5">
                {needsIssue ? (
                  <Step
                    number={1}
                    title="Select type of issue"
                    answer={options.find((each) => each.id === issueId)?.label}
                    open={openStep === 1}
                    onToggle={() => setOpenStep(1)}
                  >
                    <Choices
                      choices={options.map((issue) => ({
                        key: issue.id,
                        label: issue.label,
                        note: formatPaise(service.visitFee),
                      }))}
                      chosen={issueId}
                      onChoose={(id) => {
                        setIssueId(id)
                        if (needsKind) setOpenStep(2)
                      }}
                    />
                  </Step>
                ) : null}
                {needsKind && kindField ? (
                  <Step
                    number={needsIssue ? 2 : 1}
                    title={`Select ${kindField.label.toLowerCase()}`}
                    answer={kind ? titleCase(kind) : undefined}
                    open={openStep === 2}
                    // Waits for the problem, where there is one to pick.
                    disabled={needsIssue && issueId === null}
                    divided={needsIssue}
                    onToggle={() => setOpenStep(2)}
                  >
                    <Choices
                      choices={kinds.map((each) => ({
                        key: each,
                        label: titleCase(each),
                      }))}
                      chosen={kind}
                      onChoose={setKind}
                    />
                  </Step>
                ) : null}
              </View>
            </View>
          </>
        ) : null}

        <Band />
        <Tappable
          href={detailHref}
          onPress={onClose}
          className="min-h-16 flex-row items-center gap-4 px-5 active:bg-surface active:opacity-100"
        >
          <Icon as={ReceiptText} className="size-5 text-muted" />
          <Text className="flex-1 text-base font-semibold text-ink">Rate card</Text>
          <Icon as={ChevronRight} className="size-5 text-muted" />
        </Tappable>

        {service.process && service.process.length > 0 ? (
          <>
            <Band />
            <View className="px-5 py-7">
              <Text accessibilityRole="header" className="text-2xl font-bold text-ink">
                Our process
              </Text>
              <View className="mt-6">
                {service.process.map((step, index, all) => {
                  const last = index === all.length - 1
                  return (
                    <View key={step.title} className="relative flex-row gap-4">
                      {!last ? (
                        <View className="absolute bottom-0 left-[15px] top-9 w-px bg-border" />
                      ) : null}
                      <View className="size-8 shrink-0 items-center justify-center rounded-full bg-surface">
                        <Text className="text-sm font-semibold text-ink">{index + 1}</Text>
                      </View>
                      <View className={cn('min-w-0 flex-1', last ? '' : 'pb-7')}>
                        <Text className="pt-1 text-lg font-semibold text-ink">
                          {step.title}
                        </Text>
                        <Text className="mt-1 text-base leading-[26px] text-muted">
                          {step.body}
                        </Text>
                      </View>
                    </View>
                  )
                })}
              </View>
            </View>
          </>
        ) : null}

        <Band />
        <View className="flex-row items-center gap-4 px-5 py-7">
          <View className="min-w-0 flex-1">
            <Text accessibilityRole="header" className="text-2xl font-bold text-ink">
              Top technicians
            </Text>
            <View className="mt-5 gap-4">
              <PromiseLine icon={BadgeCheck}>Verified technicians</PromiseLine>
              <PromiseLine icon={ReceiptText}>
                Repairs only after your approval
              </PromiseLine>
              <PromiseLine icon={FileText}>Digital GST invoice</PromiseLine>
            </View>
          </View>
          {service.technicianPhoto ? (
            <View className="aspect-[3/4] w-[38%] shrink-0 overflow-hidden rounded-card bg-plate">
              <Img src={service.technicianPhoto} alt="" className="absolute inset-0" />
            </View>
          ) : null}
        </View>

        {brands.length > 0 ? (
          <>
            <Band />
            <View className="px-5 py-7">
              <Text accessibilityRole="header" className="text-2xl font-bold text-ink">
                We service all brands
              </Text>
              {/* Three across: fixed widths with the slack as the gutter, since
                  there is no grid here. */}
              <View className="mt-5 flex-row flex-wrap justify-between gap-y-3">
                {brands.map((brand) => (
                  <View
                    key={brand.id}
                    className="h-16 w-[31%] items-center justify-center rounded-card bg-logo px-3"
                  >
                    {brand.logo ? (
                      <Img
                        src={brand.logo}
                        alt={brand.name}
                        contentFit="contain"
                        className="h-7 w-full"
                      />
                    ) : (
                      <Text numberOfLines={1} className="text-sm font-bold text-night">
                        {brand.wordmark}
                      </Text>
                    )}
                  </View>
                ))}
                {/* Keeps a short last row left-aligned under justify-between. */}
                {brands.length % 3 === 2 ? <View className="w-[31%]" /> : null}
              </View>
              <BrandDisclaimer className="mt-4" />
            </View>
          </>
        ) : null}

        <Band />
        <View className="px-5 py-7">
          <Text accessibilityRole="header" className="text-2xl font-bold text-ink">
            <Text className="text-2xl font-bold text-brand">24X7</Text>
            {' promise'}
          </Text>
          <View className="mt-5 gap-4">
            <PromiseLine icon={ShieldCheck}>
              {warrantyDays
                ? `Up to ${warrantyDays} days warranty`
                : 'Service warranty on the work'}
            </PromiseLine>
            <PromiseLine icon={ReceiptText}>
              Fixed visit fee, repairs quoted first
            </PromiseLine>
            <PromiseLine icon={Headphones}>Support at any hour</PromiseLine>
          </View>
        </View>

        {service.excludes && service.excludes.length > 0 ? (
          <>
            <Band />
            <View className="px-5 py-7">
              <Text accessibilityRole="header" className="text-2xl font-bold text-ink">
                What is not included
              </Text>
              <View className="mt-5 gap-3">
                {service.excludes.map((line) => (
                  <View key={line} className="flex-row items-start gap-3">
                    <Icon as={X} className="mt-1 size-4 text-error" />
                    <Text className="flex-1 text-base leading-[26px] text-muted">{line}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        ) : null}

        {service.faqs && service.faqs.length > 0 ? (
          <>
            <Band />
            <View className="px-5 py-7">
              <Text accessibilityRole="header" className="text-xl font-bold text-ink">
                Frequently asked questions
              </Text>
              <View className="mt-3">
                {service.faqs.map((faq, index) => (
                  <Faq key={faq.q} q={faq.q} a={faq.a} divided={index > 0} />
                ))}
              </View>
            </View>
          </>
        ) : null}

        <Band />
        <View className="items-center px-5 py-6">
          <Text className="text-center text-base text-muted">
            Share this service with your loved ones
          </Text>
          <Tappable
            onPress={() => setShareOpen(true)}
            className="mt-3 h-12 w-full flex-row items-center justify-center gap-2 rounded-card border border-border active:border-brand"
          >
            <Text className="text-base font-semibold text-brand">Share</Text>
            <Icon as={Share2} className="size-4 text-brand" />
          </Tappable>
        </View>

        <Band />
        <View className="px-5 py-7">
          <ShareSheet
            open={shareOpen}
            onClose={() => setShareOpen(false)}
            title={service.name}
            text={`${service.name} on 24X7 — ${formatPaise(service.visitFee)} visit fee, quoted before any work starts.`}
            url={shareUrl}
            image={photos[0]}
          />
          <ReviewsPanel
            rating={service.rating}
            ratingCount={service.reviewCount}
            reviews={extras.data?.reviews ?? []}
            serviceNames={new Map()}
          />
        </View>
      </ScrollView>

      {/* The way to add it, for as long as the sheet is open: waits for the
          choices above, then adds; once anything of this service is in the
          cart, the way to it sits beside. */}
      {page ? (
        <StickyCTA detail={footerDetail}>{footerButton}</StickyCTA>
      ) : (
        <View
          className="flex-row items-center gap-3 border-t border-border bg-bg px-5 pt-3"
          style={{ paddingBottom: 12 + insets.bottom }}
        >
          {footerDetail}
          {footerButton}
        </View>
      )}
    </View>
  )
}

/** How long each photograph shows before the next. */
const PHOTO_MS = 4000

/**
 * The photographs across the top, one at a time, with a bar per photograph
 * along the foot that fills while it shows — the same hand-on as the banner
 * on the appliance page, and none at all for somebody who asked for less
 * motion.
 */
function PhotoStrip({ photos }: { photos: readonly string[] }) {
  const [index, setIndex] = useState(0)
  const reducedMotion = usePrefersReducedMotion()
  const count = photos.length

  useEffect(() => {
    if (reducedMotion || count < 2) return
    const timer = setTimeout(() => setIndex((i) => (i + 1) % count), PHOTO_MS)
    return () => clearTimeout(timer)
  }, [index, count, reducedMotion])

  if (count === 0) return <View className="h-6" />

  return (
    <View className="relative aspect-[16/11] overflow-hidden bg-plate">
      {photos.map((photo, i) => (
        <FadePhoto key={photo} src={photo} on={i === index} priority={i === 0} />
      ))}
      {count > 1 ? (
        <View className="absolute inset-x-5 bottom-3 flex-row gap-2">
          {photos.map((photo, i) => (
            <Tappable
              key={photo}
              onPress={() => setIndex(i)}
              accessibilityLabel={`Show photo ${i + 1} of ${count}`}
              accessibilityState={{ selected: i === index }}
              className="h-6 flex-1 justify-center active:opacity-100"
            >
              <View className="h-1 w-full overflow-hidden rounded-pill bg-white/40">
                <ProgressFill
                  key={i === index ? `on-${index}` : 'off'}
                  state={i === index ? (reducedMotion ? 'full' : 'running') : i < index ? 'full' : 'empty'}
                />
              </View>
            </Tappable>
          ))}
        </View>
      ) : null}
    </View>
  )
}

/** One photograph in the strip, cross-fading in and out. */
function FadePhoto({ src, on, priority }: { src: string; on: boolean; priority: boolean }) {
  const opacity = useSharedValue(on ? 1 : 0)
  useEffect(() => {
    opacity.value = withTiming(on ? 1 : 0, { duration: 500, reduceMotion: ReduceMotion.System })
  }, [on, opacity])
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }))
  return (
    <Animated.View style={style} className="absolute inset-0">
      <Img src={src} alt="" priority={priority ? 'high' : 'normal'} className="size-full" />
    </Animated.View>
  )
}

/** The white fill of one bar: empty, full, or filling over the photograph's turn. */
function ProgressFill({ state }: { state: 'empty' | 'full' | 'running' }) {
  const progress = useSharedValue(state === 'full' ? 1 : 0)
  useEffect(() => {
    if (state !== 'running') return
    progress.value = withTiming(1, {
      duration: PHOTO_MS,
      easing: Easing.linear,
      reduceMotion: ReduceMotion.System,
    })
  }, [state, progress])
  const style = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }))
  return <Animated.View style={style} className="h-full rounded-pill bg-white" />
}

/** One numbered question in "Select requirements", folding open to its choices. */
function Step({
  number,
  title,
  answer,
  open,
  disabled = false,
  divided = false,
  onToggle,
  children,
}: {
  number: number
  title: string
  /** What was picked, shown on the folded step. */
  answer?: string
  open: boolean
  disabled?: boolean
  /** A rule above it, between it and the step before. */
  divided?: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  const expanded = open && !disabled
  return (
    <View className={cn('py-4', divided && 'border-t border-border')}>
      <Tappable
        onPress={onToggle}
        disabled={disabled}
        accessibilityState={{ expanded, disabled }}
        className={cn('w-full flex-row items-center gap-4', disabled && 'opacity-45')}
      >
        <View className="size-8 shrink-0 items-center justify-center rounded-md bg-surface">
          <Text className="text-sm font-semibold text-ink">{number}</Text>
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-lg text-ink">{title}</Text>
          {!expanded && answer ? (
            <View className="mt-0.5 flex-row items-center gap-1">
              <Icon as={Check} className="size-4 text-success" />
              <Text className="text-sm font-semibold text-success">{answer}</Text>
            </View>
          ) : null}
        </View>
        <View style={expanded ? { transform: [{ rotate: '180deg' }] } : undefined}>
          <Icon as={ChevronDown} className="size-5 text-muted" />
        </View>
      </Tappable>
      {expanded ? <View className="mt-4">{children}</View> : null}
    </View>
  )
}

/** A row of cards to pick one from, scrolling sideways past the sheet's edge. */
function Choices({
  choices,
  chosen,
  onChoose,
}: {
  choices: ReadonlyArray<{ key: string; label: string; note?: string }>
  chosen: string | null
  onChoose: (key: string) => void
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="-mx-5"
      contentContainerClassName="gap-3 px-5 pb-1"
      accessibilityRole="radiogroup"
    >
      {choices.map((choice) => {
        const on = chosen === choice.key
        return (
          <Tappable
            key={choice.key}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            onPress={() => onChoose(choice.key)}
            className={cn(
              'min-h-24 w-40 shrink-0 justify-between rounded-card border p-4',
              on ? 'border-ink bg-surface' : 'border-border active:border-muted'
            )}
          >
            <Text numberOfLines={2} className="text-base text-ink">
              {choice.label}
            </Text>
            {choice.note ? (
              <Text className="mt-3 text-lg font-semibold text-ink">{choice.note}</Text>
            ) : null}
          </Tappable>
        )
      })}
    </ScrollView>
  )
}

/** One question in the FAQ, folding open to its answer. */
function Faq({ q, a, divided }: { q: string; a: string; divided: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <View className={cn('py-1', divided && 'border-t border-border')}>
      <Tappable
        onPress={() => setOpen((was) => !was)}
        accessibilityState={{ expanded: open }}
        className="min-h-14 flex-row items-center gap-3"
      >
        <Text className="flex-1 text-base text-ink">{q}</Text>
        <View style={open ? { transform: [{ rotate: '180deg' }] } : undefined}>
          <Icon as={ChevronDown} className="size-5 text-muted" />
        </View>
      </Tappable>
      {open ? (
        <Text className="pb-4 text-sm leading-[22px] text-muted">{a}</Text>
      ) : null}
    </View>
  )
}

function PromiseLine({
  icon,
  children,
}: {
  icon: LucideIcon
  children: React.ReactNode
}) {
  return (
    <View className="flex-row items-center gap-4">
      <Icon as={icon} className="size-6 text-ink" />
      <Text className="flex-1 text-lg text-ink">{children}</Text>
    </View>
  )
}

/** "front-load" → "Front-load", "single-door" → "Single-door". */
function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/** The grey band between unrelated blocks, as on the rest of the app. */
function Band() {
  return <View className="h-2 bg-surface" />
}
