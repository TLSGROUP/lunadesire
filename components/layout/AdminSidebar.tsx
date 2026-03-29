import Link from 'next/link'
import { LayoutDashboard, Package, ShoppingBag, RefreshCw } from 'lucide-react'

const nav = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/sync', label: 'Sync', icon: RefreshCw },
]

export function AdminSidebar() {
  return (
    <aside className="w-56 border-r bg-muted/40 flex flex-col">
      <div className="h-14 flex items-center px-4 border-b font-bold">
        <Link href="/admin/dashboard">Admin</Link>
      </div>
      <nav className="flex-1 p-2 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2 px-3 py-2 rounded text-sm hover:bg-muted transition-colors"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-2 border-t">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 rounded text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          Back to store
        </Link>
      </div>
    </aside>
  )
}
