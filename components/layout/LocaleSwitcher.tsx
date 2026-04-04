'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { LOCALES, LOCALE_NAMES, LOCALE_FLAGS, type Locale } from '@/lib/i18n/config'
import { Globe } from 'lucide-react'

export function LocaleSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function switchLocale(next: Locale) {
    setOpen(false)
    // Replace current locale prefix in pathname, preserve query string
    const newPath = pathname.replace(/^\/[a-z]{2}(\/|$)/, `/${next}$1`)
    const qs = searchParams.toString()
    document.cookie = `NEXT_LOCALE=${next};path=/;max-age=${60 * 60 * 24 * 365}`
    router.push(qs ? `${newPath}?${qs}` : newPath)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-[#f2ede8] hover:text-[#d4006e] transition-colors duration-300"
        aria-label="Switch language"
      >
        <Globe className="h-4 w-4" />
        <span className="text-xs tracking-widest uppercase">{locale.toUpperCase()}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 bg-black/90 backdrop-blur-md border border-white/10 shadow-xl z-50">
          {LOCALES.map((l) => (
            <button
              key={l}
              onClick={() => switchLocale(l)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs tracking-widest uppercase transition-colors ${
                l === locale
                  ? 'text-[#d4006e] bg-white/5'
                  : 'text-[#f2ede8] hover:text-[#d4006e] hover:bg-white/5'
              }`}
            >
              <span>{LOCALE_FLAGS[l]}</span>
              <span>{LOCALE_NAMES[l]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
