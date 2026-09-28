export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: { id: string, user_id: string, name: string, type: 'banco' | 'efectivo' | 'crypto' | 'tarjeta_credito', balance: number, currency: 'ARS' | 'USD', created_at: string }
        Insert: { id?: string, user_id?: string, name: string, type: 'banco' | 'efectivo' | 'crypto' | 'tarjeta_credito', balance?: number, currency?: 'ARS' | 'USD', created_at?: string }
        Update: { id?: string, user_id?: string, name?: string, type?: 'banco' | 'efectivo' | 'crypto' | 'tarjeta_credito', balance?: number, currency?: 'ARS' | 'USD', created_at?: string }
      }
      categories: {
        Row: { id: string, user_id: string, name: string, type: 'ingreso' | 'gasto', created_at: string }
        Insert: { id?: string, user_id?: string, name: string, type: 'ingreso' | 'gasto', created_at?: string }
        Update: { id?: string, user_id?: string, name?: string, type?: 'ingreso' | 'gasto', created_at?: string }
      }
      tags: {
        Row: { id: string, user_id: string, name: string, created_at: string }
        Insert: { id?: string, user_id?: string, name: string, created_at?: string }
        Update: { id?: string, user_id?: string, name?: string, created_at?: string }
      }
      transactions: {
        Row: { id: string, user_id: string, account_id: string, category_id: string, amount: number, currency: 'ARS' | 'USD', exchange_rate: number, date: string, description: string | null, type: 'ingreso_operativo' | 'capital_proyectos' | 'gasto' | 'transferencia', created_at: string }
        Insert: { id?: string, user_id?: string, account_id: string, category_id: string, amount: number, currency?: 'ARS' | 'USD', exchange_rate?: number, date: string, description?: string | null, type: 'ingreso_operativo' | 'capital_proyectos' | 'gasto' | 'transferencia', created_at?: string }
        Update: { id?: string, user_id?: string, account_id?: string, category_id?: string, amount?: number, currency?: 'ARS' | 'USD', exchange_rate?: number, date?: string, description?: string | null, type?: 'ingreso_operativo' | 'capital_proyectos' | 'gasto' | 'transferencia', created_at?: string }
      }
      installments: {
        Row: { id: string, user_id: string, transaction_id: string, total_amount: number, current_installment: number, total_installments: number, monthly_amount: number, start_date: string, created_at: string }
        Insert: { id?: string, user_id?: string, transaction_id: string, total_amount: number, current_installment?: number, total_installments: number, monthly_amount: number, start_date: string, created_at?: string }
        Update: { id?: string, user_id?: string, transaction_id?: string, total_amount?: number, current_installment?: number, total_installments?: number, monthly_amount?: number, start_date?: string, created_at?: string }
      }
      transaction_tags: {
        Row: { transaction_id: string, tag_id: string }
        Insert: { transaction_id: string, tag_id: string }
        Update: { transaction_id?: string, tag_id?: string }
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: {
      account_type: 'banco' | 'efectivo' | 'crypto' | 'tarjeta_credito'
      category_type: 'ingreso' | 'gasto'
      transaction_type: 'ingreso_operativo' | 'capital_proyectos' | 'gasto' | 'transferencia'
      currency_type: 'ARS' | 'USD'
    }
    CompositeTypes: { [_ in never]: never }
  }
}
