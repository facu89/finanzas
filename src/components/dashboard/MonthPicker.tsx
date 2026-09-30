'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { currentMonthISO, formatMonth, shiftMonth } from '@/lib/format'

export function MonthPicker({ currentMonth, allowAll = true }: { currentMonth: string, allowAll?: boolean }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const thisMonth = currentMonthISO()

  const go = (val: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (val === thisMonth) params.delete('month')
    else params.set('month', val)
    const qs = params.toString()
    router.push(qs ? `?${qs}` : '?', { scroll: false })
  }

  const months = Array.from({ length: 24 }, (_, i) => shiftMonth(thisMonth, -i))
  if (currentMonth !== 'all' && !months.includes(currentMonth)) months.push(currentMonth)

  const items = [
    ...(allowAll ? [{ value: 'all', label: 'Todo el historial' }] : []),
    ...months.map(m => ({ value: m, label: formatMonth(m) })),
  ]

  const isAll = currentMonth === 'all'
  const arrow = 'flex size-9 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40'

  return (
    <div className="flex h-9 items-center overflow-hidden rounded-lg border bg-card shadow-xs">
      <button type="button" className={arrow} aria-label="Mes anterior" disabled={isAll} onClick={() => go(shiftMonth(currentMonth, -1))}>
        <ChevronLeft className="size-4" />
      </button>
      <Select items={items} value={currentMonth} onValueChange={(v) => v && go(v)}>
        <SelectTrigger className="h-9! w-44 justify-center rounded-none border-0 border-x bg-transparent text-sm font-medium capitalize shadow-none focus-visible:ring-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map(item => (
            <SelectItem key={item.value} value={item.value} className="capitalize">{item.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <button type="button" className={arrow} aria-label="Mes siguiente" disabled={isAll || currentMonth >= thisMonth} onClick={() => go(shiftMonth(currentMonth, 1))}>
        <ChevronRight className="size-4" />
      </button>
    </div>
  )
}
