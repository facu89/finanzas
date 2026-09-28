'use client'

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export function OverviewChart({ transactions }: { transactions: any[] }) {
  // Agrupar transacciones por mes
  const dataMap = new Map<string, { name: string; ingresos: number; gastos: number }>()

  transactions.forEach((t) => {
    const date = new Date(t.date)
    // Usamos el nombre del mes abreviado como clave
    const monthKey = format(date, 'MMM yy', { locale: es })
    
    if (!dataMap.has(monthKey)) {
      dataMap.set(monthKey, { name: monthKey, ingresos: 0, gastos: 0 })
    }
    
    const entry = dataMap.get(monthKey)!
    if (t.type === 'ingreso') entry.ingresos += Number(t.amount)
    if (t.type === 'gasto') entry.gastos += Number(t.amount)
  })

  // Convertimos a array y revertimos para mostrar cronológicamente de izq a der
  const data = Array.from(dataMap.values()).reverse()

  if (data.length === 0) {
    return (
      <div className="flex h-[350px] items-center justify-center text-muted-foreground text-sm border-dashed border rounded-md">
        Agrega transacciones para visualizar el flujo.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
        <Tooltip cursor={{ fill: 'transparent' }} />
        <Bar dataKey="ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} />
        <Bar dataKey="gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
