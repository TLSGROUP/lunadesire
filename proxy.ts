import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { LOCALES, DEFAULT_LOCALE, isValidLocale } from '@/lib/i18n/config'

// Paths that bypass locale routing entirely
const LOCALE_BYPASSES = [
  /^\/admin(\/|$)/,
  /^\/api(\/|$)/,
  /^\/_next/,
  /^\/favicon/,
  /\.(png|jpe?g|gif|svg|ico|webp|mov|mp4|webm|woff2?|ttf|otf|eot|pdf|txt|xml|json)$/i,
]

function getPreferredLocale(request: NextRequest): string {
  const cookie = request.cookies.get('NEXT_LOCALE')?.value
  if (cookie && isValidLocale(cookie)) return cookie

  const acceptLang = request.headers.get('accept-language') ?? ''
  for (const part of acceptLang.split(',')) {
    const lang = part.split(';')[0].trim().slice(0, 2).toLowerCase()
    if (isValidLocale(lang)) return lang
  }

  return DEFAULT_LOCALE
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // --- Locale routing ---
  if (!LOCALE_BYPASSES.some((r) => r.test(pathname))) {
    const segments = pathname.split('/')
    const firstSegment = segments[1] ?? ''

    if (!isValidLocale(firstSegment)) {
      const locale = getPreferredLocale(request)
      const url = request.nextUrl.clone()
      url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`
      const res = NextResponse.redirect(url)
      res.cookies.set('NEXT_LOCALE', locale, { path: '/', maxAge: 60 * 60 * 24 * 365 })
      return res
    }

    // Already has locale — persist preference
    // (continue to auth check below)
  }

  // --- Supabase session refresh ---
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Detect locale from path for auth redirects
  const segments = pathname.split('/')
  const localePrefix = isValidLocale(segments[1] ?? '') ? `/${segments[1]}` : '/en'

  // Protect /[locale]/account/* routes
  if (/^\/[a-z]{2}\/account(\/|$)/.test(pathname) && !user) {
    return NextResponse.redirect(new URL(`${localePrefix}/auth/login`, request.url))
  }

  // Protect /admin/* routes
  if (pathname.startsWith('/admin') && !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Save locale cookie on locale-prefixed paths
  if (isValidLocale(segments[1] ?? '')) {
    response.cookies.set('NEXT_LOCALE', segments[1], { path: '/', maxAge: 60 * 60 * 24 * 365 })
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

// Re-export LOCALES to avoid unused import warning
export { LOCALES }
