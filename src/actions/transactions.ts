'use server'

import { cache } from 'react'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { transactionSchema, type TransactionInput } from '@/lib/schemas'
import { fetchDolarRates } from '@/actions/dolarAPI'
import type { Account, AccountType, Category, CategoryType, Transaction } from '@/types/supabase'

type ActionResult<T = object> = ({ success: true } & T) | { success?: false, error: string }

const TRANSACTION_SELECT = '*, categories (name), accounts (name)'

function revalidateApp() {
  // El layout del dashboard carga cuentas/categorías: revalidarlo refresca todas las páginas.
  revalidatePath('/', 'layout')
}

export async function getTransactions(range: { from?: string, to?: string } = {}): Promise<Transaction[]> {
  const supabase = await createClient()
  let query = supabase
    .from('transactions')
    .select(TRANSACTION_SELECT)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (range.from) query = query.gte('date', range.from)
  if (range.to) query = query.lte('date', range.to)

  const { data, error } = await query
  if (error) {
    console.error('Error fetching transactions:', error)
    return []
  }
  return data as Transaction[]
}

export async function saveTransaction(input: TransactionInput, id?: string): Promise<ActionResult> {
  const parsed = transactionSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }
  const data = parsed.data

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tu sesión expiró. Volvé a iniciar sesión.' }

  let exchangeRate: number | null = null
  if (data.currency === 'USD') {
    exchangeRate = data.exchange_rate ?? (await fetchDolarRates()).mep
  }

  const payload = {
    type: data.type,
    amount: data.amount,
    currency: data.currency,
    exchange_rate: exchangeRate,
    date: data.date,
    description: data.description || null,
    merchant: data.merchant || null,
    account_id: data.account_id,
    category_id: data.category_id,
    installments: data.installments ?? null,
    tags: data.tags?.length ? data.tags : null,
  }

  const { error } = id
    ? await supabase.from('transactions').update(payload).eq('id', id)
    : await supabase.from('transactions').insert({ ...payload, user_id: user.id })

  if (error) {
    console.error('Error saving transaction:', error)
    return { error: 'No se pudo guardar el movimiento. Intentá de nuevo.' }
  }

  revalidateApp()
  return { success: true }
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) {
    console.error('Error deleting transaction:', error)
    return { error: 'No se pudo eliminar el movimiento.' }
  }
  revalidateApp()
  return { success: true }
}

const DEFAULT_ACCOUNTS: { name: string, type: AccountType }[] = [
  { name: 'Banco', type: 'banco' },
  { name: 'Efectivo', type: 'efectivo' },
  { name: 'Tarjeta de crédito', type: 'tarjeta_credito' },
]

const DEFAULT_CATEGORIES: { name: string, type: CategoryType }[] = [
  { name: 'Salario', type: 'ingreso' },
  { name: 'Otros ingresos', type: 'ingreso' },
  { name: 'Supermercado', type: 'gasto' },
  { name: 'Salidas a comer', type: 'gasto' },
  { name: 'Servicios', type: 'gasto' },
  { name: 'Transporte', type: 'gasto' },
  { name: 'Suscripciones', type: 'gasto' },
  { name: 'Tecnología', type: 'gasto' },
  { name: 'Regalos', type: 'gasto' },
]

/**
 * Cuentas y categorías del usuario. Si no tiene, se crean las de ejemplo.
 * `cache` evita que el layout y la página, que se renderizan en paralelo, siembren dos veces.
 */
export const getAccountsAndCategories = cache(async (): Promise<{ accounts: Account[], categories: Category[] }> => {
  const supabase = await createClient()
  const [accountsRes, categoriesRes] = await Promise.all([
    supabase.from('accounts').select('*').order('created_at'),
    supabase.from('categories').select('*').order('name'),
  ])

  let accounts = accountsRes.data ?? []
  let categories = categoriesRes.data ?? []

  if (accountsRes.error || categoriesRes.error) {
    console.error('Error fetching accounts/categories:', accountsRes.error ?? categoriesRes.error)
    return { accounts, categories }
  }

  if (accounts.length === 0 || categories.length === 0) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { accounts, categories }

    if (accounts.length === 0) {
      const { data } = await supabase
        .from('accounts')
        .insert(DEFAULT_ACCOUNTS.map(a => ({ ...a, user_id: user.id, balance: 0 })))
        .select('*')
      accounts = data ?? []
    }
    if (categories.length === 0) {
      const { data } = await supabase
        .from('categories')
        .insert(DEFAULT_CATEGORIES.map(c => ({ ...c, user_id: user.id })))
        .select('*')
      categories = (data ?? []).sort((a, b) => a.name.localeCompare(b.name))
    }
  }

  return { accounts, categories }
})

export async function createCategory(input: { name: string, type: CategoryType }): Promise<ActionResult<{ category: Category }>> {
  const name = input.name.trim()
  if (!name) return { error: 'El nombre no puede estar vacío.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tu sesión expiró. Volvé a iniciar sesión.' }

  const { data, error } = await supabase
    .from('categories')
    .insert({ user_id: user.id, name, type: input.type })
    .select('*')
    .single()

  if (error || !data) {
    console.error('Error creating category:', error)
    return { error: 'No se pudo crear la categoría.' }
  }
  revalidateApp()
  return { success: true, category: data }
}

export async function createAccount(input: { name: string, type: AccountType }): Promise<ActionResult<{ account: Account }>> {
  const name = input.name.trim()
  if (!name) return { error: 'El nombre no puede estar vacío.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tu sesión expiró. Volvé a iniciar sesión.' }

  const { data, error } = await supabase
    .from('accounts')
    .insert({ user_id: user.id, name, type: input.type, balance: 0 })
    .select('*')
    .single()

  if (error || !data) {
    console.error('Error creating account:', error)
    return { error: 'No se pudo crear la cuenta.' }
  }
  revalidateApp()
  return { success: true, account: data }
}

export async function getUniqueMerchants(): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('transactions').select('merchant').not('merchant', 'is', null)
  if (error) {
    console.error('Error fetching merchants:', error)
    return []
  }
  const byKey = new Map<string, string>()
  for (const { merchant } of data) {
    const name = merchant?.trim()
    if (name && !byKey.has(name.toLowerCase())) byKey.set(name.toLowerCase(), name)
  }
  return Array.from(byKey.values()).sort((a, b) => a.localeCompare(b, 'es'))
}

const BUDGET_COOKIE = 'monthly_budget'

export async function updateBudget(amount: number): Promise<ActionResult> {
  if (!Number.isFinite(amount) || amount < 0) return { error: 'Monto inválido.' }
  const cookieStore = await cookies()
  cookieStore.set(BUDGET_COOKIE, String(amount), { maxAge: 60 * 60 * 24 * 365, path: '/', sameSite: 'lax' })
  revalidatePath('/dashboard')
  return { success: true }
}

export async function getBudget() {
  const cookieStore = await cookies()
  const value = parseFloat(cookieStore.get(BUDGET_COOKIE)?.value ?? '')
  return Number.isFinite(value) ? value : 0
}
