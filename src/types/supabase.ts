export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type AccountType = 'banco' | 'efectivo' | 'crypto' | 'tarjeta_credito'
export type CategoryType = 'ingreso' | 'gasto'
export type TransactionType = 'ingreso_operativo' | 'capital_proyectos' | 'gasto' | 'transferencia'
export type Currency = 'ARS' | 'USD'

export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: { id: string, user_id: string, name: string, type: AccountType, balance: number, currency: Currency, created_at: string }
        Insert: { id?: string, user_id?: string, name: string, type: AccountType, balance?: number, currency?: Currency, created_at?: string }
        Update: { id?: string, user_id?: string, name?: string, type?: AccountType, balance?: number, currency?: Currency, created_at?: string }
        Relationships: []
      }
      categories: {
        Row: { id: string, user_id: string, name: string, type: CategoryType, created_at: string }
        Insert: { id?: string, user_id?: string, name: string, type: CategoryType, created_at?: string }
        Update: { id?: string, user_id?: string, name?: string, type?: CategoryType, created_at?: string }
        Relationships: []
      }
      tags: {
        Row: { id: string, user_id: string, name: string, created_at: string }
        Insert: { id?: string, user_id?: string, name: string, created_at?: string }
        Update: { id?: string, user_id?: string, name?: string, created_at?: string }
        Relationships: []
      }
      transactions: {
        Row: { id: string, user_id: string, account_id: string, category_id: string, amount: number, currency: Currency, exchange_rate: number | null, date: string, description: string | null, type: TransactionType, created_at: string, merchant: string | null, installments: number | null, tags: string[] | null }
        Insert: { id?: string, user_id?: string, account_id: string, category_id: string, amount: number, currency?: Currency, exchange_rate?: number | null, date: string, description?: string | null, type: TransactionType, created_at?: string, merchant?: string | null, installments?: number | null, tags?: string[] | null }
        Update: { id?: string, user_id?: string, account_id?: string, category_id?: string, amount?: number, currency?: Currency, exchange_rate?: number | null, date?: string, description?: string | null, type?: TransactionType, created_at?: string, merchant?: string | null, installments?: number | null, tags?: string[] | null }
        Relationships: [
          { foreignKeyName: 'transactions_account_id_fkey', columns: ['account_id'], isOneToOne: false, referencedRelation: 'accounts', referencedColumns: ['id'] },
          { foreignKeyName: 'transactions_category_id_fkey', columns: ['category_id'], isOneToOne: false, referencedRelation: 'categories', referencedColumns: ['id'] },
        ]
      }
      installments: {
        Row: { id: string, user_id: string, transaction_id: string, total_amount: number, current_installment: number, total_installments: number, monthly_amount: number, start_date: string, created_at: string }
        Insert: { id?: string, user_id?: string, transaction_id: string, total_amount: number, current_installment?: number, total_installments: number, monthly_amount: number, start_date: string, created_at?: string }
        Update: { id?: string, user_id?: string, transaction_id?: string, total_amount?: number, current_installment?: number, total_installments?: number, monthly_amount?: number, start_date?: string, created_at?: string }
        Relationships: []
      }
      transaction_tags: {
        Row: { transaction_id: string, tag_id: string }
        Insert: { transaction_id: string, tag_id: string }
        Update: { transaction_id?: string, tag_id?: string }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: {
      account_type: AccountType
      category_type: CategoryType
      transaction_type: TransactionType
      currency_type: Currency
    }
    CompositeTypes: { [_ in never]: never }
  }
}

export type Account = Database['public']['Tables']['accounts']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type TransactionRow = Database['public']['Tables']['transactions']['Row']

/** Transacción con los joins que usa la UI (`categories (name)`, `accounts (name)`). */
export type Transaction = TransactionRow & {
  categories: { name: string } | null
  accounts: { name: string } | null
}
