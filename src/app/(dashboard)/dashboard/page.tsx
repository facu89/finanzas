import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { getTransactions, getBudget } from '@/actions/transactions'
import { fetchDolarRates } from '@/actions/dolarAPI'
import { DualFlowChart, type FlowPoint } from '@/components/analytics/DualFlowChart'
import { CategoryBreakdown } from '@/components/dashboard/CategoryBreakdown'
import { BudgetEdit } from '@/components/dashboard/BudgetEdit'
import { MonthPicker } from '@/components/dashboard/MonthPicker'
import { PageHeader, StatCard } from '@/components/layout/PageHeader'
import { amountInARS, currentMonthISO, formatDate, formatMoney, formatMonth, isIncome, monthRange, parseMonthParam, shiftMonth, summarize, TYPE_LABELS } from '@/lib/format'
import { cn } from 'cn'

export const metadata: Metadata = { title: 'Resumen' }

function Panel({ title, action, children, className }: { title: string, action?: React.ReactNode, children: React.ReactNode, className?: string }) {
  return (
    <section className={cn('rounded-xl border bg-card', className)}>
      <header className="flex min-h-12 items-center justify-between gap-2 border-b px-4 py-2 md:px-5">
        <h2 className="text-sm font-medium">{title}</h2>
        {action}
      </header>
      <div className="p-4 md:p-5">{children}</div>
    </section>
  )
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ month?: string | string[] }> }) {
  const selectedMonth = parseMonthParam((await searchParams).month)
  const isAll = selectedMonth === 'all'

  // Para el gráfico se traen los 6 meses que terminan en el mes elegido.
  const chartEnd = isAll ? currentMonthISO() : selectedMonth
  const chartStart = shiftMonth(chartEnd, -5)
  const [transactionsInRange, budget, rates] = await Promise.all([
    getTransactions(isAll ? {} : { from: monthRange(chartStart).from, to: monthRange(chartEnd).to }),
    getBudget(),
    fetchDolarRates(),
  ])

  const transactions = isAll ? transactionsInRange : transactionsInRange.filter(t => t.date.startsWith(selectedMonth))
  const { ingresos, gastos, balance } = summarize(transactions, rates.mep)
  const savingsRate = ingresos > 0 ? (balance / ingresos) * 100 : null

  // Flujo mensual
  const flowMap = new Map<string, FlowPoint>()
  for (let i = 0; i < 6; i++) {
    const m = shiftMonth(chartStart, i)
    flowMap.set(m, { month: m, fijo: 0, extra: 0, gasto: 0 })
  }
  for (const t of transactionsInRange) {
    const point = flowMap.get(t.date.slice(0, 7))
    if (!point) continue
    const value = amountInARS(t, rates.mep)
    if (t.type === 'ingreso_operativo') point.fijo += value
    else if (t.type === 'capital_proyectos') point.extra += value
    else if (t.type === 'gasto') point.gasto += value
  }

  // Gastos por categoría
  const byCategory = new Map<string, number>()
  for (const t of transactions) {
    if (t.type !== 'gasto') continue
    const name = t.categories?.name ?? 'Sin categoría'
    byCategory.set(name, (byCategory.get(name) ?? 0) + amountInARS(t, rates.mep))
  }
  const categories = Array.from(byCategory, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)

  const budgetPct = budget > 0 ? (gastos / budget) * 100 : 0
  const remaining = budget - gastos
  const recent = transactions.slice(0, 6)
  const periodLabel = isAll ? 'todo el historial' : formatMonth(selectedMonth)

  return (
    <div className="space-y-6">
      <PageHeader title="Resumen" description={`Tu situación financiera en ${periodLabel}.`}>
        <MonthPicker currentMonth={selectedMonth} />
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <StatCard
          label="Balance"
          value={formatMoney(balance)}
          tone={balance < 0 ? 'expense' : 'default'}
          hint={balance < 0 ? 'Gastaste más de lo que ingresó' : 'Ingresos menos gastos'}
          className="col-span-2 lg:col-span-1"
        />
        <StatCard label="Ingresos" value={formatMoney(ingresos)} tone="income" />
        <StatCard label="Gastos" value={formatMoney(gastos)} tone="expense" />
        <StatCard
          label="Tasa de ahorro"
          value={savingsRate === null ? '—' : `${savingsRate.toFixed(0)}%`}
          hint={savingsRate === null ? 'Sin ingresos registrados' : 'Del total ingresado'}
          className="col-span-2 lg:col-span-1"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Panel title="Flujo de caja · últimos 6 meses" className="lg:col-span-3">
          <DualFlowChart data={Array.from(flowMap.values())} />
        </Panel>

        <div className="grid gap-4 lg:col-span-2">
          <Panel title="Presupuesto mensual" action={!isAll && <BudgetEdit currentBudget={budget} />}>
            {isAll ? (
              <p className="text-sm text-muted-foreground">Elegí un mes para ver el avance del presupuesto.</p>
            ) : budget <= 0 ? (
              <p className="text-sm text-muted-foreground">Definí un tope de gastos mensual para seguir cuánto te queda disponible.</p>
            ) : (
              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="num text-xl font-semibold tracking-tight">{formatMoney(gastos)}</p>
                  <p className="num text-xs text-muted-foreground">de {formatMoney(budget)}</p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn('h-full rounded-full transition-all', budgetPct > 100 ? 'bg-expense' : budgetPct > 80 ? 'bg-warning' : 'bg-brand')}
                    style={{ width: `${Math.min(budgetPct, 100)}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{budgetPct.toFixed(0)}% utilizado</span>
                  {remaining >= 0 ? (
                    <span className="num font-medium text-income">Quedan {formatMoney(remaining)}</span>
                  ) : (
                    <span className="num flex items-center gap-1 font-medium text-expense">
                      <AlertTriangle className="size-3" /> Excedido por {formatMoney(-remaining)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </Panel>

          <Panel title="Gastos por categoría">
            <CategoryBreakdown items={categories} limit={5} />
          </Panel>
        </div>
      </div>

      <Panel
        title="Últimos movimientos"
        action={
          <Link href={isAll ? '/transactions?month=all' : `/transactions?month=${selectedMonth}`} className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
            Ver todos <ArrowRight className="size-3" />
          </Link>
        }
      >
        {recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No hay movimientos en este periodo.</p>
        ) : (
          <ul className="-my-2 divide-y">
            {recent.map(t => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{t.description || t.merchant || t.categories?.name || TYPE_LABELS[t.type]}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(t.date, { day: 'numeric', month: 'short' })} · {t.categories?.name ?? TYPE_LABELS[t.type]}
                  </p>
                </div>
                <span className={cn('num shrink-0 text-sm font-semibold', t.type === 'gasto' && 'text-expense', isIncome(t.type) && 'text-income')}>
                  {formatMoney(t.type === 'gasto' ? -t.amount : Number(t.amount), t.currency, { signed: t.type !== 'transferencia' })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
