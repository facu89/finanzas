'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatMoney, formatMonth } from '@/lib/format'

export type FlowPoint = { month: string, fijo: number, extra: number, gasto: number }

const SERIES = [
  { key: 'fijo', label: 'Ingreso fijo', color: 'var(--color-income)' },
  { key: 'extra', label: 'Ingreso extra', color: 'var(--color-capital)' },
  { key: 'gasto', label: 'Gastos', color: 'var(--color-expense)' },
] as const

function FlowTooltip({ active, payload, label }: { active?: boolean, payload?: ReadonlyArray<{ payload?: unknown }>, label?: string | number }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload as FlowPoint
  const net = point.fijo + point.extra - point.gasto
  return (
    <div className="min-w-48 rounded-lg border bg-popover px-3 py-2.5 text-xs shadow-md">
      <p className="mb-2 font-medium capitalize">{formatMonth(String(label))}</p>
      <div className="grid gap-1">
        {SERIES.map(s => (
          <div key={s.key} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 rounded-full" style={{ background: s.color }} />{s.label}
            </span>
            <span className="num font-medium">{formatMoney(point[s.key])}</span>
          </div>
        ))}
        <div className="mt-1 flex items-center justify-between gap-4 border-t pt-1.5">
          <span className="text-muted-foreground">Resultado</span>
          <span className={`num font-semibold ${net < 0 ? 'text-expense' : 'text-income'}`}>{formatMoney(net, 'ARS', { signed: true })}</span>
        </div>
      </div>
    </div>
  )
}

export function DualFlowChart({ data }: { data: FlowPoint[] }) {
  const hasData = data.some(d => d.fijo || d.extra || d.gasto)

  if (!hasData) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
        Sin movimientos en los últimos meses.
      </div>
    )
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }} barGap={4}>
          <CartesianGrid vertical={false} stroke="var(--color-border)" />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            fontSize={11}
            tick={{ fill: 'var(--color-muted-foreground)' }}
            tickFormatter={(v: string) => formatMonth(v, 'short').split(' ')[0].replace('.', '')}
          />
          <YAxis
            width={48}
            tickLine={false}
            axisLine={false}
            fontSize={11}
            tick={{ fill: 'var(--color-muted-foreground)' }}
            tickFormatter={(v: number) => formatMoney(v, 'ARS', { compact: true }).replace('$ ', '$')}
          />
          <Tooltip content={(p) => <FlowTooltip active={p.active} payload={p.payload} label={p.label} />} cursor={{ fill: 'var(--color-muted)', opacity: 0.6 }} />
          <Bar dataKey="fijo" name="Ingreso fijo" stackId="in" fill="var(--color-income)" maxBarSize={28} />
          <Bar dataKey="extra" name="Ingreso extra" stackId="in" fill="var(--color-capital)" radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="gasto" name="Gastos" fill="var(--color-expense)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
        {SERIES.map(s => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ background: s.color }} />{s.label}
          </span>
        ))}
      </div>
    </div>
  )
}
