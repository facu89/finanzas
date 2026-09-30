'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { currentMonthISO, monthRange, shiftMonth, todayISO } from '@/lib/format'
import { cn } from 'cn'

function presets() {
  const month = currentMonthISO()
  const year = month.slice(0, 4)
  return [
    { label: 'Este mes', ...monthRange(month) },
    { label: 'Mes anterior', ...monthRange(shiftMonth(month, -1)) },
    { label: 'Últimos 3 meses', from: monthRange(shiftMonth(month, -2)).from, to: monthRange(month).to },
    { label: 'Este año', from: `${year}-01-01`, to: todayISO() },
  ]
}

export function DateRangeFilter({ defaultFrom, defaultTo }: { defaultFrom: string, defaultTo: string }) {
  const router = useRouter()
  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(defaultTo)

  const apply = (f: string, t: string) => {
    setFrom(f)
    setTo(t)
    router.push(`/reportes?from=${f}&to=${t}`, { scroll: false })
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 lg:flex-row lg:items-end lg:justify-between">
      <form
        onSubmit={(e) => { e.preventDefault(); if (from && to) apply(from, to) }}
        className="flex flex-wrap items-end gap-3"
      >
        <div className="grid gap-1.5">
          <Label htmlFor="from" className="text-xs text-muted-foreground">Desde</Label>
          <Input id="from" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="h-9 w-40" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="to" className="text-xs text-muted-foreground">Hasta</Label>
          <Input id="to" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="h-9 w-40" />
        </div>
        <Button type="submit" variant="outline" className="h-9">Aplicar</Button>
      </form>
      <div className="flex flex-wrap gap-1.5">
        {presets().map(p => {
          const active = p.from === defaultFrom && p.to === defaultTo
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => apply(p.from, p.to)}
              className={cn(
                'h-8 rounded-md border px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                active && 'border-foreground/20 bg-muted text-foreground',
              )}
            >
              {p.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
