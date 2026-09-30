import type { Metadata } from 'next'
import { getTransactions, getAccountsAndCategories } from '@/actions/transactions'
import { fetchDolarRates } from '@/actions/dolarAPI'
import { MonthPicker } from '@/components/dashboard/MonthPicker'
import { TransactionList } from '@/components/transactions/TransactionList'
import { PageHeader, StatCard } from '@/components/layout/PageHeader'
import { formatMoney, monthRange, parseMonthParam, summarize } from '@/lib/format'

export const metadata: Metadata = { title: 'Movimientos' }

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<{ month?: string | string[] }> }) {
  const selectedMonth = parseMonthParam((await searchParams).month)
  const [transactions, { accounts, categories }, rates] = await Promise.all([
    getTransactions(selectedMonth === 'all' ? {} : monthRange(selectedMonth)),
    getAccountsAndCategories(),
    fetchDolarRates(),
  ])
  const { ingresos, gastos, balance } = summarize(transactions, rates.mep)

  return (
    <div className="space-y-6">
      <PageHeader title="Movimientos" description="Tocá un movimiento para editarlo o eliminarlo.">
        <MonthPicker currentMonth={selectedMonth} />
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4">
        <StatCard label="Ingresos" value={formatMoney(ingresos)} tone="income" />
        <StatCard label="Gastos" value={formatMoney(gastos)} tone="expense" />
        <StatCard label="Balance" value={formatMoney(balance)} tone={balance < 0 ? 'expense' : 'default'} className="col-span-2 sm:col-span-1" />
      </div>

      <TransactionList transactions={transactions} accounts={accounts} categories={categories} />
    </div>
  )
}
