import type { Metadata } from 'next'
import { login } from '@/actions/auth'
import { AuthForm } from '@/components/auth/AuthForm'

export const metadata: Metadata = { title: 'Iniciar sesión' }

export default function LoginPage() {
  return <AuthForm mode="login" action={login} />
}
