'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeftRight, FileText, LayoutGrid, type LucideIcon } from 'lucide-react'
import { cn } from 'cn'

export const NAV_ITEMS: { href: string, label: string, icon: LucideIcon }[] = [
  { href: '/dashboard', label: 'Resumen', icon: LayoutGrid },
  { href: '/transactions', label: 'Movimientos', icon: ArrowLeftRight },
  { href: '/reportes', label: 'Reportes', icon: FileText },
]

export function Brand({ className }: { className?: string }) {
  return (
    <Link href="/dashboard" className={cn('flex items-center gap-2.5', className)}>
      <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
          <path d="M2 12.5 6 8l3 3 5-6.5" />
        </svg>
      </span>
      <span className="text-[15px] font-semibold tracking-tight">Finanzas</span>
    </Link>
  )
}

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav className="grid gap-0.5">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/70 hover:text-sidebar-foreground',
              active && 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm ring-1 ring-foreground/5 hover:bg-sidebar-accent',
            )}
          >
            <Icon className={cn('size-4', active ? 'text-brand' : 'text-muted-foreground')} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <div className="flex h-16 items-center px-5">
        <Brand />
      </div>
      <div className="px-3 pt-2">
        <NavLinks />
      </div>
    </aside>
  )
}
