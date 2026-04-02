import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-[#020104] border-t border-[#1e181d] mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <div>
            <p className="text-xl tracking-[0.35em] uppercase font-[family-name:var(--font-playfair)] font-bold text-[#f2ede8] mb-3">Luna<span className="text-[#d4006e]">Desire</span></p>
            <p className="text-xs text-[#4a4448] leading-relaxed">
              Redefining intimacy through luxury design and uncompromising quality.
            </p>
          </div>

          <div>
            <p className="text-xs tracking-widest uppercase text-[#7a7078] mb-4">Shop</p>
            <ul className="space-y-2">
              {['Toys & Devices', 'Sensual Care', 'Lingerie', 'Gifts'].map((item) => (
                <li key={item}>
                  <Link href="/products" className="text-xs text-[#4a4448] hover:text-[#d4006e] transition-colors duration-300">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs tracking-widest uppercase text-[#7a7078] mb-4">About</p>
            <ul className="space-y-2">
              {['Our Story', 'Journal', 'Materials', 'FAQ'].map((item) => (
                <li key={item}>
                  <Link href="/" className="text-xs text-[#4a4448] hover:text-[#d4006e] transition-colors duration-300">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs tracking-widest uppercase text-[#7a7078] mb-4">Newsletter</p>
            <p className="text-xs text-[#4a4448] mb-3">Subscribe for exclusive releases and editorial content</p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 bg-transparent border-b border-[#1e181d] text-xs text-[#f2ede8] placeholder-[#4a4448] pb-1 outline-none focus:border-[#d4006e] transition-colors duration-300"
              />
              <button type="submit" className="text-xs tracking-widest uppercase text-[#d4006e] hover:text-[#f2ede8] transition-colors duration-300">
                Join
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[#1e181d] flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-xs text-[#4a4448]">
            &copy; {new Date().getFullYear()} LunaDesire. All rights reserved.
          </p>
          <p className="text-xs text-[#4a4448]">For adults 18+ only.</p>
          <div className="flex gap-6">
            <Link href="/" className="text-xs text-[#4a4448] hover:text-[#d4006e] transition-colors duration-300">Privacy Policy</Link>
            <Link href="/" className="text-xs text-[#4a4448] hover:text-[#d4006e] transition-colors duration-300">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
