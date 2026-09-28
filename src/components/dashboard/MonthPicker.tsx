'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function MonthPicker({ currentMonth }: { currentMonth: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleMonthChange = (val: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (val === 'all') params.delete('month')
    else params.set('month', val)
    router.push(`?${params.toString()}`)
  }

  const months = []
  for (let i = 0; i < 12; i++) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const val = d.toISOString().slice(0, 7)
    const label = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    months.push({ val, label })
  }

  return (
    <Select value={currentMonth} onValueChange={handleMonthChange}>
      <SelectTrigger className="w-[180px] bg-background">
        <SelectValue placeholder="Selecciona mes" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todo el historial</SelectItem>
        {months.map(m => (
          <SelectItem key={m.val} value={m.val} className="capitalize">{m.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
