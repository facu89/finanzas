import Link from 'next/link'
import { Home, PieChart, ArrowLeftRight, Settings } from 'lucide-react'

export function Sidebar() {
  return (
    <aside className="w-64 border-r bg-background hidden md:block">
      <div className="p-6">
        <h2 className="text-xl font-bold tracking-tight text-primary">FinTech</h2>
      </div>
      <nav className="space-y-1 px-4">
        <Link href="/dashboard" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
          <Home className="h-4 w-4" />
          Dashboard
        </Link>
        <Link href="/transactions" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
          <ArrowLeftRight className="h-4 w-4" />
          Transacciones
        </Link>
      </nav>
    </aside>
  )
}
