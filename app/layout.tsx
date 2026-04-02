import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  title: {
    default: 'LunaDesire',
    template: '%s | LunaDesire',
  },
  description: 'Curated luxury wellness products designed for profound connection and aesthetic pleasure.',
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable} ${playfair.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
