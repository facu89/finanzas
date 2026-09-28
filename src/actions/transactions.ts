'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/supabase'
import { cookies } from 'next/headers'

export async function getTransactions() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      categories (name, color_hex),
      accounts (name)
    `)
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching transactions:', error)
    return []
  }
  return data
}

export async function createTransaction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No user found')

  const { error } = await (supabase as any).from('transactions').insert({
    user_id: user.id,
    type: formData.get('type'),
    amount: parseFloat(formData.get('amount') as string),
    date: formData.get('date'),
    description: formData.get('description'),
    account_id: formData.get('account_id'),
    category_id: formData.get('category_id'),
  } as any)

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  revalidatePath('/transactions')
  return { success: true }
}

export async function updateTransactionAction(id: string, formData: FormData) {
  const supabase = await createClient()
  await (supabase as any).from('transactions').update({
    type: formData.get('type'),
    amount: parseFloat(formData.get('amount') as string),
    date: formData.get('date'),
    description: formData.get('description'),
    account_id: formData.get('account_id'),
    category_id: formData.get('category_id'),
  } as any).eq('id', id)
  
  revalidatePath('/dashboard')
  revalidatePath('/transactions')
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient()
  await supabase.from('transactions').delete().eq('id', id)
  revalidatePath('/dashboard')
  revalidatePath('/transactions')
}

export async function getAccountsAndCategories() {
  const supabase = await createClient()
  const [accountsRes, categoriesRes] = await Promise.all([
    supabase.from('accounts').select('*'),
    supabase.from('categories').select('*')
  ])

  if (accountsRes.data?.length === 0) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
       await (supabase as any).from('accounts').insert({ user_id: user.id, name: 'Principal', type: 'banco', balance: 0 })
       await (supabase as any).from('categories').insert([
         { user_id: user.id, name: 'Salario', type: 'ingreso' },
         { user_id: user.id, name: 'Alimentación', type: 'gasto' },
         { user_id: user.id, name: 'Suscripciones', type: 'gasto' }
       ])
       const [newAcc, newCat] = await Promise.all([supabase.from('accounts').select('*'), supabase.from('categories').select('*')])
       return { accounts: newAcc.data || [], categories: newCat.data || [] }
    }
  }

  return { accounts: accountsRes.data || [], categories: categoriesRes.data || [] }
}

export async function updateBudget(formData: FormData) {
  const budget = formData.get('budget') as string
  const cookieStore = await cookies()
  cookieStore.set('monthly_budget', budget)
  revalidatePath('/dashboard')
}

export async function getBudget() {
  const cookieStore = await cookies()
  return parseFloat(cookieStore.get('monthly_budget')?.value || '3000')
}
