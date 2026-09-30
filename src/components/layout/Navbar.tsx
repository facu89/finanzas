'use client'

import { useState, type ReactNode } from 'react'
import { LogOut, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signout } from '@/actions/auth'
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Brand, NavLinks } from '@/components/layout/Sidebar'

export function Navbar({ email, actions }: { email?: string | null, actions?: ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b bg-background/85 px-4 backdrop-blur md:px-8">
      <div className="flex items-center gap-2 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className="-ml-2 rounded-md p-2 hover:bg-accent" aria-label="Abrir menú">
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-sidebar p-0">
            <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
            <SheetDescription className="sr-only">Secciones de la aplicación</SheetDescription>
            <div className="flex h-16 items-center px-5">
              <Brand />
            </div>
            <div className="px-3">
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
        <Brand />
      </div>
      <div className="hidden md:block" />

      <div className="flex items-center gap-2">
        {email && <span className="hidden max-w-56 truncate text-xs text-muted-foreground lg:inline">{email}</span>}
        <div className="hidden md:block">{actions}</div>
        <form action={signout}>
          <Button variant="ghost" size="sm" type="submit" className="h-9 gap-2 text-muted-foreground hover:text-foreground" aria-label="Cerrar sesión">
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Salir</span>
          </Button>
        </form>
      </div>
    </header>
  )
}
