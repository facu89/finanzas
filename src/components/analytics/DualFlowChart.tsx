'use client'

import { useMemo } from 'react'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export function DualFlowChart({ transactions }: { transactions: any[] }) {
  
  const chartData = useMemo(() => {
    const map = new Map<string, { month: string, operativo: number, capital: number, gasto: number }>()

    transactions.forEach(t => {
      const normalizedAmount = t.currency === 'USD' ? Number(t.amount) * Number(t.exchange_rate) : Number(t.amount);
      const month = t.date.slice(0, 7);
      
      if (!map.has(month)) {
        map.set(month, { month, operativo: 0, capital: 0, gasto: 0 })
      }
      
      const entry = map.get(month)!
      if (t.type === 'ingreso_operativo') entry.operativo += normalizedAmount
      if (t.type === 'capital_proyectos') entry.capital += normalizedAmount
      if (t.type === 'gasto') entry.gasto += normalizedAmount
    })

    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month))
  }, [transactions])

  const { totalOperativo, totalGasto } = useMemo(() => {
    return chartData.reduce((acc, curr) => ({
      totalOperativo: acc.totalOperativo + curr.operativo,
      totalGasto: acc.totalGasto + curr.gasto
    }), { totalOperativo: 0, totalGasto: 0 })
  }, [chartData])

  const structuralRisk = totalGasto > totalOperativo

  return (
    <Card className="w-full shadow-sm border-border">
      <CardHeader>
        <CardTitle>Composición del Flujo de Caja</CardTitle>
        <CardDescription className={structuralRisk ? "text-red-500 font-semibold" : "text-green-600 font-semibold"}>
          {structuralRisk 
            ? "⚠️ Alerta Estructural: Tus gastos superan tu ingreso operativo. Estás consumiendo capital."
            : "✅ Salud Financiera: Tu ingreso operativo cubre estructuralmente tus obligaciones."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis tickFormatter={(val) => `$${(val / 1000)}k`} tickLine={false} axisLine={false} fontSize={12} />
            <Tooltip 
              formatter={(value: any) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(Number(value))} 
              cursor={{ fill: 'transparent' }} 
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            
            <Bar dataKey="gasto" name="Gasto Total (ARS)" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
            <Bar dataKey="operativo" name="Ingreso Operativo (Fijo)" stackId="ingresos" fill="#22c55e" radius={[0, 0, 0, 0]} maxBarSize={50} />
            <Bar dataKey="capital" name="Capital de Proyectos (Extra)" stackId="ingresos" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
