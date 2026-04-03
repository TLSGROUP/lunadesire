'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { ProductCard } from './ProductCard'

interface Product {
  id: string
  name: string
  slug: string
  retail_price: number
  images: string[] | null
  brand: string | null
  stock_quantity: number
  is_new?: boolean | null
  brand_logo?: string | null
}

interface Props {
  initialProducts: Product[]
  initialHasMore: boolean
  searchParams: Record<string, string | undefined>
}

export function InfiniteProductGrid({ initialProducts, initialHasMore, searchParams }: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)
  const page = useRef(1)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Reset when filters change
  useEffect(() => {
    setProducts(initialProducts)
    setHasMore(initialHasMore)
    page.current = 1
  }, [initialProducts, initialHasMore])

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)
    page.current += 1

    const params = new URLSearchParams()
    params.set('page', String(page.current))
    if (searchParams.category) params.set('category', searchParams.category)
    if (searchParams.brand) params.set('brand', searchParams.brand)
    if (searchParams.q) params.set('q', searchParams.q)
    if (searchParams.new) params.set('new', searchParams.new)

    try {
      const res = await fetch(`/api/products?${params}`)
      const data = await res.json()
      setProducts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id))
        const newItems = data.products.filter((p: Product) => !existingIds.has(p.id))
        return [...prev, ...newItems]
      })
      setHasMore(data.hasMore)
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, searchParams])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore() },
      { rootMargin: '300px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore])

  if (products.length === 0) {
    return (
      <div className="text-center py-24">
        <p className="text-xs tracking-widest uppercase text-gray-400">No products found.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      <div ref={sentinelRef} className="h-10 mt-8 flex items-center justify-center">
        {loading && (
          <div className="w-6 h-6 border-2 border-gray-200 border-t-[#d4006e] rounded-full animate-spin" />
        )}
      </div>
    </>
  )
}
