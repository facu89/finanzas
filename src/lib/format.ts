import type { Currency, Transaction, TransactionType } from '@/types/supabase'

export const APP_TIMEZONE = 'America/Argentina/Buenos_Aires'

export const TYPE_LABELS: Record<TransactionType, string> = {
  ingreso_operativo: 'Ingreso fijo',
  capital_proyectos: 'Ingreso extra',
  gasto: 'Gasto',
  transferencia: 'Transferencia',
}

export function isIncome(type: string) {
  return type === 'ingreso_operativo' || type === 'capital_proyectos'
}

/** Fecha de hoy (YYYY-MM-DD) en horario argentino, independiente del huso del servidor. */
export function todayISO() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: APP_TIMEZONE }).format(new Date())
}

export function currentMonthISO() {
  return todayISO().slice(0, 7)
}

/**
 * Parsea una fecha `YYYY-MM-DD` como fecha local.
 * `new Date('2026-09-30')` la interpreta en UTC y en Argentina se ve como el día anterior.
 */
export function parseDateOnly(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' }) {
  return parseDateOnly(iso).toLocaleDateString('es-AR', opts)
}

export function formatMonth(monthISO: string, month: 'long' | 'short' = 'long') {
  const [y, m] = monthISO.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('es-AR', { month, year: 'numeric' })
}

export function formatMoney(amount: number, currency: Currency = 'ARS', opts: { signed?: boolean, compact?: boolean } = {}) {
  const abs = Math.abs(amount)
  const body = opts.compact
    ? abs.toLocaleString('es-AR', { notation: 'compact', maximumFractionDigits: 1 })
    : abs.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const symbol = currency === 'USD' ? 'US$' : '$'
  const sign = amount < 0 ? '−' : opts.signed && amount > 0 ? '+' : ''
  return `${sign}${symbol} ${body}`
}

/** Monto de la transacción expresado en pesos (USD × cotización guardada o de referencia). */
export function amountInARS(tx: Pick<Transaction, 'amount' | 'currency' | 'exchange_rate'>, fallbackRate = 0) {
  const amount = Number(tx.amount)
  if (tx.currency !== 'USD') return amount
  const rate = Number(tx.exchange_rate) || fallbackRate
  return amount * rate
}

export function summarize(transactions: Transaction[], fallbackRate = 0) {
  let ingresos = 0
  let gastos = 0
  for (const t of transactions) {
    const value = amountInARS(t, fallbackRate)
    if (isIncome(t.type)) ingresos += value
    else if (t.type === 'gasto') gastos += value
  }
  return { ingresos, gastos, balance: ingresos - gastos }
}

/** Primer y último día (YYYY-MM-DD) de un mes `YYYY-MM`. */
export function monthRange(month: string) {
  const [y, m] = month.split('-').map(Number)
  const last = new Date(y, m, 0).getDate()
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, '0')}` }
}

export function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Lee `?month=` validándolo; por defecto el mes actual. */
export function parseMonthParam(value: string | string[] | undefined) {
  return typeof value === 'string' && /^(\d{4}-(0[1-9]|1[0-2])|all)$/.test(value) ? value : currentMonthISO()
}
