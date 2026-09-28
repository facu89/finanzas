import { AlertTriangle, TrendingDown, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function ExpenseInsights({ transactions }: { transactions: any[] }) {
  const gastos = transactions.filter(t => t.type === 'gasto')
  const totalGastos = gastos.reduce((acc, t) => acc + Number(t.amount), 0)
  
  // Encontrar categoría con más gasto
  const catMap = new Map<string, number>()
  gastos.forEach(t => {
    const catName = t.categories?.name || 'Otros'
    catMap.set(catName, (catMap.get(catName) || 0) + Number(t.amount))
  })
  
  let maxCatName = 'N/A'
  let maxCatAmount = 0
  catMap.forEach((val, key) => {
    if (val > maxCatAmount) {
      maxCatAmount = val
      maxCatName = key
    }
  })

  // Presupuesto base mensual para ejemplo de herramienta de control
  const presupuestoMensualBase = 3000 
  const porcentaje = (totalGastos / presupuestoMensualBase) * 100

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-orange-500" />
            Mayor Fuga de Capital
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{maxCatName}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Se llevó ${maxCatAmount.toFixed(2)} de tus gastos totales.
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
             <Target className="h-4 w-4 text-blue-500" />
             Control de Presupuesto (Mes Actual)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium">Consumido: ${totalGastos.toFixed(0)}</span>
            <span className="text-muted-foreground">Límite: ${presupuestoMensualBase}</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${porcentaje > 90 ? 'bg-red-500' : 'bg-primary'}`} 
              style={{ width: `${Math.min(porcentaje, 100)}%` }}
            ></div>
          </div>
          {porcentaje > 90 && (
             <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
               <AlertTriangle className="h-3 w-3" />
               ¡Peligro! Estás cerca de superar tu presupuesto estimado.
             </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
