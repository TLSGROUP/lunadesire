import Link from 'next/link'

interface Props {
  subcategories: { slug: string; name: string }[]
  currentSlug: string | null
  parentSlug: string | null
}

export function CategoryFilters({ subcategories, currentSlug, parentSlug }: Props) {
  return (
    <div className="border-b border-[#1e181d]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-wrap gap-2 py-4">
          {/* "All" pill — links back to parent or /products */}
          <Link
            href={parentSlug ? `/products?category=${encodeURIComponent(parentSlug)}` : '/products'}
            className={`shrink-0 px-4 py-1.5 text-xs tracking-widest uppercase border transition-colors duration-200 ${
              !currentSlug
                ? 'border-[#c5a028] text-[#c5a028]'
                : 'border-[#6b6568] text-[#6b6568] hover:border-[#c5a028] hover:text-[#c5a028]'
            }`}
          >
            All
          </Link>

          {subcategories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/products?category=${encodeURIComponent(cat.slug)}`}
              className={`shrink-0 px-4 py-1.5 text-xs tracking-widest uppercase border transition-colors duration-200 ${
                currentSlug === cat.slug
                  ? 'border-[#c5a028] text-[#c5a028]'
                  : 'border-[#6b6568] text-[#6b6568] hover:border-[#c5a028] hover:text-[#c5a028]'
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
