'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type MouseEvent,
  type PointerEvent,
} from 'react'

/**
 * What a sideways rail needs so a mouse can move it too.
 *
 * A finger swipes a rail and a trackpad scrolls it sideways, but a mouse has
 * neither: the wheel only goes up and down, and the scrollbar is hidden. So on
 * a desktop the rail sat still, with the third card cut off at the edge and no
 * way to reach it. This adds the two things a mouse can do — drag the rail, and
 * press an arrow — and reports whether there is anything left either side, so
 * an arrow that would do nothing is not shown.
 *
 * Only a mouse drags. Touch already scrolls natively, and taking it over here
 * would fight the browser's own momentum.
 */
export function useRailScroll<T extends HTMLElement>(
  /** How many things are in the rail; the edges are measured again when it changes. */
  count: number
) {
  const ref = useRef<T>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const measure = useCallback(() => {
    const rail = ref.current
    if (!rail) return
    // A pixel of slack: fractional widths leave scrollLeft a hair short of
    // the end, and an arrow that nudges one pixel reads as broken.
    setCanPrev(rail.scrollLeft > 1)
    setCanNext(rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 1)
  }, [])

  useEffect(() => {
    const rail = ref.current
    if (!rail) return
    measure()
    rail.addEventListener('scroll', measure, { passive: true })
    const observer = new ResizeObserver(measure)
    observer.observe(rail)
    return () => {
      rail.removeEventListener('scroll', measure)
      observer.disconnect()
    }
  }, [measure, count])

  /** Most of a rail's width, so the card cut off at the edge comes fully in. */
  const page = useCallback((direction: 1 | -1) => {
    const rail = ref.current
    if (!rail) return
    rail.scrollBy({ left: direction * rail.clientWidth * 0.8, behavior: 'smooth' })
  }, [])

  // Drag state lives in a ref: it changes on every pointer move and nothing
  // on screen depends on it.
  const drag = useRef({ active: false, startX: 0, startLeft: 0, moved: false })

  const onPointerDown = useCallback((event: PointerEvent<T>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return
    const rail = ref.current
    if (!rail) return
    drag.current = {
      active: true,
      startX: event.clientX,
      startLeft: rail.scrollLeft,
      moved: false,
    }
  }, [])

  const onPointerMove = useCallback((event: PointerEvent<T>) => {
    const state = drag.current
    const rail = ref.current
    if (!state.active || !rail) return
    const dx = event.clientX - state.startX
    // A few pixels of wobble is still a click on the card.
    if (!state.moved && Math.abs(dx) < 5) return
    if (!state.moved) {
      state.moved = true
      rail.setPointerCapture(event.pointerId)
      // Snapping mid-drag yanks the rail away from the cursor.
      rail.style.scrollSnapType = 'none'
      rail.style.cursor = 'grabbing'
    }
    rail.scrollLeft = state.startLeft - dx
  }, [])

  const endDrag = useCallback((event: PointerEvent<T>) => {
    const state = drag.current
    const rail = ref.current
    if (!state.active || !rail) return
    state.active = false
    if (!state.moved) return
    if (rail.hasPointerCapture(event.pointerId)) {
      rail.releasePointerCapture(event.pointerId)
    }
    rail.style.cursor = ''
    // Hand snapping back so the rail settles on a card edge.
    rail.style.scrollSnapType = ''
  }, [])

  // The click that ends a drag lands on whatever card the cursor is over;
  // swallow it so letting go does not open that appliance.
  const onClickCapture = useCallback((event: MouseEvent<T>) => {
    if (!drag.current.moved) return
    drag.current.moved = false
    event.preventDefault()
    event.stopPropagation()
  }, [])

  return {
    ref,
    canPrev,
    canNext,
    page,
    railProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onClickCapture,
      // Links and images start the browser's own drag-a-link ghost otherwise.
      onDragStart: (event: DragEvent<T>) => event.preventDefault(),
    },
  }
}
