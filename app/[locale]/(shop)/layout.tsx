import { Header } from '@/components/layout/Header'
import { isValidLocale } from '@/lib/i18n/config'
import { notFound } from 'next/navigation'
import type { Locale } from '@/lib/i18n/config'

export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()

  return (
    <>
      <Header locale={locale as Locale} />
      <main className="flex-1">{children}</main>
    </>
  )
}
