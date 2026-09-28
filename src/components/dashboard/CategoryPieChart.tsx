'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

export function CategoryPieChart({ transactions }: { transactions: any[] }) {
  // Filtrar solo gastos
  const gastos = transactions.filter(t => t.type === 'gasto')
  
  // Agrupar por categoría
  const categoryMap = new Map<string, { name: string, value: number, color: string }>()
  
  gastos.forEach(t => {
    const catName = t.categories?.name || 'Otros'
    const color = t.categories?.color_hex || '#8884d8'
    
    if (!categoryMap.has(catName)) {
      categoryMap.set(catName, { name: catName, value: 0, color })
    }
    categoryMap.get(catName)!.value += Number(t.amount)
  })
  
  const data = Array.from(categoryMap.values())
  
  if (data.length === 0) {
    return (
      <div className="flex h-[350px] items-center justify-center text-muted-foreground text-sm border-dashed border rounded-md">
        No hay gastos registrados aún.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={80}
          outerRadius={120}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
        <Legend verticalAlign="bottom" height={36}/>
      </PieChart>
    </ResponsiveContainer>
  )
}
