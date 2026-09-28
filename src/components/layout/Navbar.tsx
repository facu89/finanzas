import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signout } from '@/actions/auth'

export function Navbar() {
  return (
    <header className="flex h-16 items-center justify-between border-b px-6 bg-background">
      <div className="md:hidden">
        <span className="font-bold text-primary">FinTech</span>
      </div>
      <div className="flex flex-1 items-center justify-end gap-4">
        <form action={signout}>
          <Button variant="ghost" size="sm" type="submit" className="text-muted-foreground hover:text-red-500 transition-colors">
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </Button>
        </form>
      </div>
    </header>
  )
}
