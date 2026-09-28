'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/supabase'

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

  const type = formData.get('type') as Database['public']['Enums']['transaction_type']
  const amount = parseFloat(formData.get('amount') as string)
  const date = formData.get('date') as string
  const description = formData.get('description') as string
  const account_id = formData.get('account_id') as string
  const category_id = formData.get('category_id') as string

  const { error } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      type,
      amount,
      date,
      description,
      account_id,
      category_id,
    } as any)

  if (error) {
    console.error('Error creating transaction:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/transactions')
  return { success: true }
}

export async function getAccountsAndCategories() {
  const supabase = await createClient()
  
  const [accountsRes, categoriesRes] = await Promise.all([
    supabase.from('accounts').select('*'),
    supabase.from('categories').select('*')
  ])

  // Seed automático si el usuario no tiene cuentas/categorías (Para MVP)
  if (accountsRes.data?.length === 0) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
       await supabase.from('accounts').insert({ user_id: user.id, name: 'Principal', type: 'banco', balance: 0 } as any)
       await supabase.from('categories').insert([
         { user_id: user.id, name: 'Salario', type: 'ingreso', color_hex: '#22c55e' },
         { user_id: user.id, name: 'Alimentación', type: 'gasto', color_hex: '#ef4444' },
         { user_id: user.id, name: 'Suscripciones', type: 'gasto', color_hex: '#3b82f6' }
       ] as any)
       
       const [newAcc, newCat] = await Promise.all([
         supabase.from('accounts').select('*'),
         supabase.from('categories').select('*')
       ])
       return { accounts: newAcc.data || [], categories: newCat.data || [] }
    }
  }

  return { 
    accounts: accountsRes.data || [], 
    categories: categoriesRes.data || [] 
  }
}
