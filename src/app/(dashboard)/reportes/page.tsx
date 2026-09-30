import type { Metadata } from 'next'
import { getTransactions } from '@/actions/transactions'
import { fetchDolarRates } from '@/actions/dolarAPI'
import { DateRangeFilter } from '@/components/reports/DateRangeFilter'
import { ReportPDFButton, type PDFRow } from '@/components/reports/ReportPDFButton'
import { PageHeader, StatCard } from '@/components/layout/PageHeader'
import { amountInARS, currentMonthISO, formatDate, formatMoney, isIncome, monthRange, summarize, TYPE_LABELS } from '@/lib/format'
import { cn } from 'cn'

export const metadata: Metadata = { title: 'Reportes' }

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export default async function ReportesPage({ searchParams }: { searchParams: Promise<{ from?: string | string[], to?: string | string[] }> }) {
  const params = await searchParams
  const defaults = monthRange(currentMonthISO())
  let from = typeof params.from === 'string' && DATE_RE.test(params.from) ? params.from : defaults.from
  let to = typeof params.to === 'string' && DATE_RE.test(params.to) ? params.to : defaults.to
  if (from > to) [from, to] = [to, from]

  const [desc, rates] = await Promise.all([getTransactions({ from, to }), fetchDolarRates()])
  const transactions = [...desc].reverse()
  const { ingresos, gastos, balance } = summarize(transactions, rates.mep)

  const pdfData: PDFRow[] = transactions.map(tx => ({
    fecha: formatDate(tx.date),
    categoria: tx.categories?.name || '-',
    descripcion: tx.description || '-',
    tags: tx.tags?.join(', ') || '-',
    lugar: tx.merchant || '-',
    cuenta: tx.accounts?.name || '-',
    tipo: TYPE_LABELS[tx.type],
    monto: Number(tx.amount),
    moneda: tx.currency,
    signo: tx.type === 'gasto' ? -1 : isIncome(tx.type) ? 1 : 0,
  }))

  return (
    <div className="space-y-6">
      <PageHeader title="Reportes" description="Elegí un periodo, revisá los movimientos y descargalos en PDF.">
        <ReportPDFButton data={pdfData} from={from} to={to} totalGastos={gastos} totalIngresos={ingresos} />
      </PageHeader>

      <DateRangeFilter defaultFrom={from} defaultTo={to} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4">
        <StatCard label="Ingresos" value={formatMoney(ingresos)} tone="income" />
        <StatCard label="Gastos" value={formatMoney(gastos)} tone="expense" />
        <StatCard label="Balance del periodo" value={formatMoney(balance)} tone={balance < 0 ? 'expense' : 'income'} className="col-span-2 sm:col-span-1" />
      </div>

      {transactions.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card px-6 py-14 text-center text-sm text-muted-foreground">
          No hay movimientos entre el {formatDate(from)} y el {formatDate(to)}.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Fecha</th>
                <th className="px-4 py-2.5 font-medium">Categoría</th>
                <th className="px-4 py-2.5 font-medium">Descripción</th>
                <th className="px-4 py-2.5 font-medium">Lugar</th>
                <th className="px-4 py-2.5 font-medium">Cuenta</th>
                <th className="px-4 py-2.5 font-medium">Etiquetas</th>
                <th className="px-4 py-2.5 text-right font-medium">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-muted/30">
                  <td className="num px-4 py-2.5 whitespace-nowrap text-muted-foreground">{formatDate(tx.date)}</td>
                  <td className="px-4 py-2.5">{tx.categories?.name || '—'}</td>
                  <td className="max-w-56 truncate px-4 py-2.5">{tx.description || '—'}</td>
                  <td className="px-4 py-2.5">{tx.merchant || '—'}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{tx.accounts?.name || '—'}</td>
                  <td className="px-4 py-2.5">
                    {tx.tags?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {tx.tags.map(tag => <span key={tag} className="rounded bg-secondary px-1.5 py-px text-[11px] font-medium">{tag}</span>)}
                      </div>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className={cn('num px-4 py-2.5 text-right font-medium whitespace-nowrap', tx.type === 'gasto' && 'text-expense', isIncome(tx.type) && 'text-income')}>
                    {formatMoney(tx.type === 'gasto' ? -tx.amount : Number(tx.amount), tx.currency, { signed: tx.type !== 'transferencia' })}
                    {tx.currency === 'USD' && (
                      <span className="block text-[11px] font-normal text-muted-foreground">≈ {formatMoney(amountInARS(tx, rates.mep))}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t bg-muted/40">
                <td colSpan={6} className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Resultado del periodo (en pesos)</td>
                <td className={cn('num px-4 py-3 text-right font-semibold whitespace-nowrap', balance < 0 ? 'text-expense' : 'text-income')}>
                  {formatMoney(balance, 'ARS', { signed: true })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
