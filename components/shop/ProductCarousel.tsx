'use client'

import { useRef, useEffect } from 'react'
import { ProductCard } from './ProductCard'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Product {
  id: string
  name: string
  slug: string
  retail_price: number
  images: string[] | null
  brand: string | null
  stock_quantity: number
  is_new?: boolean | null
}

const CARD_WIDTH = 264 // 260px card + 4px gap
const SPEED = 0.4      // px per frame (~24px/sec at 60fps)

interface ProductLabels {
  inStock: string
  outOfStock: string
  vatIncl: string
}

export function ProductCarousel({ products, locale = 'en', labels }: { products: Product[]; locale?: string; labels?: ProductLabels }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const isPaused = useRef(false)
  const rafRef = useRef<number>(0)

  const tripled = [...products, ...products, ...products]
  const singleWidth = products.length * CARD_WIDTH

  useEffect(() => {
    const el = trackRef.current
    if (!el) return

    // Start at middle copy
    el.scrollLeft = singleWidth

    function tick() {
      if (!isPaused.current && el) {
        el.scrollLeft += SPEED

        // Silent jump: if we drifted into 3rd copy — jump back to 2nd
        if (el.scrollLeft >= singleWidth * 2) {
          el.scrollLeft -= singleWidth
        }
        // Silent jump: if scrolled backwards into 1st copy — jump forward to 2nd
        if (el.scrollLeft <= 0) {
          el.scrollLeft += singleWidth
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [singleWidth])

  function scroll(dir: 'prev' | 'next') {
    const el = trackRef.current
    if (!el) return
    const target = el.scrollLeft + (dir === 'next' ? CARD_WIDTH * 4 : -CARD_WIDTH * 4)
    smoothScrollTo(el, target, 600)
  }

  function smoothScrollTo(el: HTMLDivElement, target: number, duration: number) {
    const start = el.scrollLeft
    const diff = target - start
    const startTime = performance.now()

    function step(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3) // easeOutCubic
      el.scrollLeft = start + diff * ease
      if (progress < 1) requestAnimationFrame(step)
    }

    requestAnimationFrame(step)
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => scroll('prev')}
        className="shrink-0 w-10 h-10 border border-gray-300 text-gray-500 hover:border-[#d4006e] hover:text-[#d4006e] flex items-center justify-center transition-colors duration-300"
        aria-label="Previous"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div
        ref={trackRef}
        className="flex-1 flex gap-4 overflow-x-hidden pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onMouseEnter={() => { isPaused.current = true }}
        onMouseLeave={() => { isPaused.current = false }}
        onTouchStart={() => { isPaused.current = true }}
        onTouchEnd={() => { setTimeout(() => { isPaused.current = false }, 1500) }}
      >
        {tripled.map((product, i) => (
          <div key={`${product.id}-${i}`} className="shrink-0 w-[260px] h-[380px]">
            <ProductCard product={product} compact locale={locale} labels={labels} />
          </div>
        ))}
      </div>

      <button
        onClick={() => scroll('next')}
        className="shrink-0 w-10 h-10 border border-gray-300 text-gray-500 hover:border-[#d4006e] hover:text-[#d4006e] flex items-center justify-center transition-colors duration-300"
        aria-label="Next"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
