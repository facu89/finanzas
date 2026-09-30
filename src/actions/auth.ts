'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type AuthState = { error?: string, message?: string } | null

function readCredentials(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  return { email, password }
}

export async function login(_state: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password } = readCredentials(formData)
  if (!email || !password) return { error: 'Completá el email y la contraseña.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    if (error.message.includes('Invalid login credentials')) return { error: 'Email o contraseña incorrectos.' }
    if (error.message.includes('Email not confirmed')) return { error: 'Confirmá tu email antes de ingresar. Revisá tu bandeja de entrada.' }
    return { error: 'No se pudo iniciar sesión. Intentá de nuevo.' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(_state: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password } = readCredentials(formData)
  if (!email || !password) return { error: 'Completá el email y la contraseña.' }
  if (password.length < 6) return { error: 'La contraseña debe tener al menos 6 caracteres.' }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) {
    if (error.message.includes('User already registered')) return { error: 'Ese email ya está registrado.' }
    if (error.message.includes('Password should be at least')) return { error: 'La contraseña debe tener al menos 6 caracteres.' }
    return { error: 'No se pudo crear la cuenta. Intentá de nuevo.' }
  }

  // Si el proyecto exige confirmar el email, no hay sesión todavía.
  if (!data.session) {
    return { message: 'Te enviamos un email para confirmar la cuenta. Después podés iniciar sesión.' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
