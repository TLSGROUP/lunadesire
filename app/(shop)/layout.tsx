import { Header } from '@/components/layout/Header'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header locale="en" />
      <main className="flex-1">{children}</main>
    </>
  )
}
