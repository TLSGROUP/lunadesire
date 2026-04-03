import Link from 'next/link'

interface Props {
  subcategories: { slug: string; name: string }[]
  currentSlug: string | null
  containerSlug: string | null
  newMode?: boolean
}

export function CategoryFilters({ subcategories, currentSlug, containerSlug, newMode }: Props) {
  const allHref = newMode
    ? '/products?new=true'
    : containerSlug ? `/products?category=${encodeURIComponent(containerSlug)}` : '/products'

  return (
    <div className="border-b border-gray-200">
      <div className="max-w-[1600px] mx-auto px-6">
        <div className="flex flex-wrap gap-2 py-3">
          {/* "All" pill */}
          <Link
            href={allHref}
            className={`shrink-0 px-4 py-1.5 text-xs tracking-widest uppercase border transition-colors duration-200 ${
              !currentSlug
                ? 'border-[#d4006e] text-[#d4006e]'
                : 'border-gray-300 text-gray-500 hover:border-[#d4006e] hover:text-[#d4006e]'
            }`}
          >
            All
          </Link>

          {subcategories.map((cat) => (
            <Link
              key={cat.slug}
              href={newMode ? `/products?new=true&category=${encodeURIComponent(cat.slug)}` : `/products?category=${encodeURIComponent(cat.slug)}`}
              className={`shrink-0 px-4 py-1.5 text-xs tracking-widest uppercase border transition-colors duration-200 ${
                currentSlug === cat.slug
                  ? 'border-[#d4006e] text-[#d4006e]'
                  : 'border-gray-300 text-gray-500 hover:border-[#d4006e] hover:text-[#d4006e]'
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
