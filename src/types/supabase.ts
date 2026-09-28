export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'banco' | 'efectivo' | 'crypto'
          balance: number
          currency: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          name: string
          type: 'banco' | 'efectivo' | 'crypto'
          balance?: number
          currency?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'banco' | 'efectivo' | 'crypto'
          balance?: number
          currency?: string
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'ingreso' | 'gasto'
          color_hex: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          name: string
          type: 'ingreso' | 'gasto'
          color_hex?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'ingreso' | 'gasto'
          color_hex?: string | null
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          account_id: string
          category_id: string
          amount: number
          date: string
          description: string | null
          type: 'ingreso' | 'gasto' | 'transferencia'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          account_id: string
          category_id: string
          amount: number
          date: string
          description?: string | null
          type: 'ingreso' | 'gasto' | 'transferencia'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string
          category_id?: string
          amount?: number
          date?: string
          description?: string | null
          type?: 'ingreso' | 'gasto' | 'transferencia'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: {
      account_type: 'banco' | 'efectivo' | 'crypto'
      category_type: 'ingreso' | 'gasto'
      transaction_type: 'ingreso' | 'gasto' | 'transferencia'
    }
    CompositeTypes: { [_ in never]: never }
  }
}
