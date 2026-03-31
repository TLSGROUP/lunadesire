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
}

const CARD_WIDTH = 264 // 260px card + 4px gap
const SPEED = 0.4      // px per frame (~24px/sec at 60fps)

export function ProductCarousel({ products }: { products: Product[] }) {
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
    <div className="relative">
      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-hidden pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onMouseEnter={() => { isPaused.current = true }}
        onMouseLeave={() => { isPaused.current = false }}
        onTouchStart={() => { isPaused.current = true }}
        onTouchEnd={() => { setTimeout(() => { isPaused.current = false }, 1500) }}
      >
        {tripled.map((product, i) => (
          <div key={`${product.id}-${i}`} className="shrink-0 w-[260px]">
            <ProductCard product={product} compact />
          </div>
        ))}
      </div>

      <button
        onClick={() => scroll('prev')}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 bg-[#07030b] border border-[#1e181d] text-[#7a7078] hover:border-[#c5a028] hover:text-[#c5a028] flex items-center justify-center transition-colors duration-300 z-10"
        aria-label="Previous"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <button
        onClick={() => scroll('next')}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 bg-[#07030b] border border-[#1e181d] text-[#7a7078] hover:border-[#c5a028] hover:text-[#c5a028] flex items-center justify-center transition-colors duration-300 z-10"
        aria-label="Next"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
