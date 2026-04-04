import { notFound } from 'next/navigation'
import { isValidLocale } from '@/lib/i18n/config'
import type { Metadata } from 'next'

interface Props {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return {
    alternates: {
      languages: {
        'en': '/en',
        'es': '/es',
        'fr': '/fr',
        'de': '/de',
        'it': '/it',
        'pt': '/pt',
        'pl': '/pl',
        'nl': '/nl',
      },
    },
  }
}

export async function generateStaticParams() {
  return ['en', 'es', 'fr', 'de', 'it', 'pt', 'pl', 'nl'].map((locale) => ({ locale }))
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()
  return <>{children}</>
}
