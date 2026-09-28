import { LogOut, Menu, Home, ArrowLeftRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signout } from '@/actions/auth'
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import Link from 'next/link'

export function Navbar() {
  return (
    <header className="flex h-16 items-center justify-between border-b px-4 md:px-6 bg-background">
      <div className="flex items-center gap-4 md:hidden">
        <Sheet>
          <SheetTrigger className="md:hidden p-2 rounded-md hover:bg-accent hover:text-accent-foreground">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-[240px] sm:w-[300px]">
            <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
            <SheetDescription className="sr-only">Enlaces de navegación de la app</SheetDescription>
            <div className="py-4">
              <h2 className="text-xl font-bold tracking-tight text-primary mb-6">FinTech</h2>
              <nav className="flex flex-col space-y-4">
                <Link href="/dashboard" className="flex items-center gap-3 text-sm font-medium hover:text-primary">
                  <Home className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link href="/transactions" className="flex items-center gap-3 text-sm font-medium hover:text-primary">
                  <ArrowLeftRight className="h-4 w-4" />
                  Transacciones
                </Link>
              </nav>
            </div>
          </SheetContent>
        </Sheet>
        <span className="font-bold text-primary">FinTech</span>
      </div>
      <div className="hidden md:block"></div>
      
      <div className="flex items-center justify-end gap-4">
        <form action={signout}>
          <Button variant="ghost" size="sm" type="submit" className="text-muted-foreground hover:text-red-500 transition-colors">
            <LogOut className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Cerrar Sesión</span>
          </Button>
        </form>
      </div>
    </header>
  )
}
