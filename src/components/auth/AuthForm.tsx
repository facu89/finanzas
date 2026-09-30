'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Brand } from '@/components/layout/Sidebar'
import type { AuthState } from '@/actions/auth'

interface AuthFormProps {
  mode: 'login' | 'register'
  action: (state: AuthState, formData: FormData) => Promise<AuthState>
}

const COPY = {
  login: {
    title: 'Iniciá sesión',
    description: 'Ingresá con tu email para ver tus finanzas.',
    submit: 'Ingresar',
    pending: 'Ingresando…',
    alt: '¿No tenés cuenta?',
    altLink: 'Registrate',
    altHref: '/register',
  },
  register: {
    title: 'Creá tu cuenta',
    description: 'Empezá a registrar tus ingresos y gastos.',
    submit: 'Crear cuenta',
    pending: 'Creando cuenta…',
    alt: '¿Ya tenés cuenta?',
    altLink: 'Iniciá sesión',
    altHref: '/login',
  },
}

export function AuthForm({ mode, action }: AuthFormProps) {
  const [state, formAction, isPending] = useActionState(action, null)
  const [showPassword, setShowPassword] = useState(false)
  const copy = COPY[mode]

  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Brand className="mb-8 justify-center" />
        <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          <h1 className="text-xl font-semibold tracking-tight">{copy.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{copy.description}</p>

          <form action={formAction} className="mt-6 grid gap-4">
            {state?.error && (
              <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" /> {state.error}
              </div>
            )}
            {state?.message && (
              <div role="status" className="flex items-start gap-2 rounded-lg border border-income/30 bg-income/5 px-3 py-2.5 text-sm text-income">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> {state.message}
              </div>
            )}
            <div className="grid gap-1.5">
              <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" placeholder="nombre@correo.com" required className="h-10" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="password" className="text-xs text-muted-foreground">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  minLength={mode === 'register' ? 6 : undefined}
                  required
                  className="h-10 pr-10"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute top-1/2 right-1 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(v => !v)}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {mode === 'register' && <p className="text-xs text-muted-foreground">Mínimo 6 caracteres.</p>}
            </div>
            <Button type="submit" className="mt-1 h-10 w-full" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isPending ? copy.pending : copy.submit}
            </Button>
          </form>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {copy.alt}{' '}
          <Link href={copy.altHref} className="font-medium text-foreground underline-offset-4 hover:underline">
            {copy.altLink}
          </Link>
        </p>
      </div>
    </div>
  )
}
