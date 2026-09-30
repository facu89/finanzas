'use client'

import { useMemo, useState } from 'react'
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, ChevronRight, Search, Sparkles } from 'lucide-react'
import { TransactionDialog } from '@/components/transactions/TransactionFormModal'
import { TYPE_LABELS, amountInARS, formatDate, formatMoney, isIncome, parseDateOnly, todayISO } from '@/lib/format'
import type { Account, Category, Transaction, TransactionType } from '@/types/supabase'
import { cn } from 'cn'

type Filter = 'todos' | 'gastos' | 'ingresos'

const FILTERS: { value: Filter, label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'gastos', label: 'Gastos' },
  { value: 'ingresos', label: 'Ingresos' },
]

function normalize(text: string) {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

function dayLabel(iso: string) {
  const today = todayISO()
  const yesterday = new Date(parseDateOnly(today).getTime() - 86_400_000)
  if (iso === today) return 'Hoy'
  if (parseDateOnly(iso).getTime() === yesterday.getTime()) return 'Ayer'
  return formatDate(iso, { weekday: 'long', day: 'numeric', month: 'long' })
}

function TypeIcon({ type }: { type: TransactionType }) {
  const Icon = type === 'gasto' ? ArrowUpRight : type === 'capital_proyectos' ? Sparkles : isIncome(type) ? ArrowDownLeft : ArrowLeftRight
  return (
    <span
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-full',
        type === 'gasto' && 'bg-expense/10 text-expense',
        type === 'ingreso_operativo' && 'bg-income/10 text-income',
        type === 'capital_proyectos' && 'bg-capital/10 text-capital',
        type === 'transferencia' && 'bg-muted text-muted-foreground',
      )}
    >
      <Icon className="size-4" />
    </span>
  )
}

export function TransactionList({ transactions, accounts, categories }: { transactions: Transaction[], accounts: Account[], categories: Category[] }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('todos')
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const groups = useMemo(() => {
    const q = normalize(query.trim())
    const visible = transactions.filter(t => {
      if (filter === 'gastos' && t.type !== 'gasto') return false
      if (filter === 'ingresos' && !isIncome(t.type)) return false
      if (!q) return true
      const haystack = [t.description, t.merchant, t.categories?.name, t.accounts?.name, ...(t.tags ?? [])].filter(Boolean).join(' ')
      return normalize(haystack).includes(q)
    })
    const byDay = new Map<string, Transaction[]>()
    for (const t of visible) {
      const list = byDay.get(t.date) ?? []
      list.push(t)
      byDay.set(t.date, list)
    }
    return Array.from(byDay.entries())
  }, [transactions, query, filter])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-80">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por descripción, lugar, categoría…"
            className="h-9 w-full rounded-lg border border-input bg-card pr-3 pl-9 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 md:text-sm"
          />
        </div>
        <div className="flex rounded-lg bg-muted p-1 self-start">
          {FILTERS.map(f => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              aria-pressed={filter === f.value}
              className={cn(
                'h-7 rounded-md px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground',
                filter === f.value && 'bg-card text-foreground shadow-sm ring-1 ring-foreground/5',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card px-6 py-14 text-center">
          <p className="font-medium">{transactions.length === 0 ? 'Todavía no hay movimientos en este periodo' : 'No hay resultados'}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {transactions.length === 0 ? 'Usá “Nuevo movimiento” para registrar tu primer gasto o ingreso.' : 'Probá con otra búsqueda o filtro.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          {groups.map(([day, items]) => {
            const dayTotal = items.reduce((acc, t) => acc + (t.type === 'gasto' ? -1 : isIncome(t.type) ? 1 : 0) * amountInARS(t), 0)
            return (
              <section key={day}>
                <header className="flex items-center justify-between border-b bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground first-letter:uppercase">
                  <span className="capitalize">{dayLabel(day)}</span>
                  <span className="num">{formatMoney(dayTotal, 'ARS', { signed: true })}</span>
                </header>
                <ul className="divide-y">
                  {items.map(tx => {
                    const title = tx.description || tx.merchant || tx.categories?.name || TYPE_LABELS[tx.type]
                    const meta = [tx.categories?.name, tx.description ? tx.merchant : null, tx.accounts?.name].filter(Boolean)
                    const sign = tx.type === 'gasto' ? -1 : 1
                    return (
                      <li key={tx.id}>
                        <button
                          type="button"
                          onClick={() => { setEditing(tx); setDialogOpen(true) }}
                          className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none"
                        >
                          <TypeIcon type={tx.type} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{title}</p>
                            <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
                              <span className="truncate">{meta.join(' · ')}</span>
                              {tx.installments && tx.installments > 1 && <span>· {tx.installments} cuotas</span>}
                              {tx.tags?.map(tag => (
                                <span key={tag} className="rounded bg-secondary px-1.5 py-px text-[11px] font-medium text-secondary-foreground">{tag}</span>
                              ))}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={cn(
                              'num text-sm font-semibold whitespace-nowrap',
                              tx.type === 'gasto' && 'text-expense',
                              isIncome(tx.type) && 'text-income',
                              tx.type === 'transferencia' && 'text-muted-foreground',
                            )}>
                              {formatMoney(tx.type === 'transferencia' ? Number(tx.amount) : sign * Number(tx.amount), tx.currency, { signed: true })}
                            </p>
                            {tx.currency === 'USD' && tx.exchange_rate && (
                              <p className="num text-[11px] text-muted-foreground">≈ {formatMoney(Number(tx.amount) * Number(tx.exchange_rate), 'ARS')}</p>
                            )}
                          </div>
                          <ChevronRight className="hidden size-4 text-muted-foreground/50 transition-colors group-hover:text-muted-foreground sm:block" />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })}
        </div>
      )}

      <TransactionDialog
        accounts={accounts}
        categories={categories}
        tx={editing}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
