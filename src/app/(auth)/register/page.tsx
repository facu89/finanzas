import type { Metadata } from 'next'
import { signup } from '@/actions/auth'
import { AuthForm } from '@/components/auth/AuthForm'

export const metadata: Metadata = { title: 'Crear cuenta' }

export default function RegisterPage() {
  return <AuthForm mode="register" action={signup} />
}
