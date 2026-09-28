import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { OverviewChart } from '@/components/dashboard/OverviewChart'
import { CategoryPieChart } from '@/components/dashboard/CategoryPieChart'
import { ExpenseInsights } from '@/components/dashboard/ExpenseInsights'
import { ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react'
import { getTransactions, getBudget } from '@/actions/transactions'
import { MonthPicker } from '@/components/dashboard/MonthPicker'

export default async function DashboardPage({ searchParams }: { searchParams: { month?: string } }) {
  const allTransactions = await getTransactions()
  const budget = await getBudget()
  const selectedMonth = searchParams.month || new Date().toISOString().slice(0, 7)

  // Filtrar por el mes seleccionado
  const transactions = selectedMonth === 'all' 
    ? allTransactions 
    : allTransactions.filter((t: any) => t.date.startsWith(selectedMonth))

  const ingresosTotales = transactions.filter((t: any) => t.type === 'ingreso').reduce((acc: number, t: any) => acc + Number(t.amount), 0)
  const gastosTotales = transactions.filter((t: any) => t.type === 'gasto').reduce((acc: number, t: any) => acc + Number(t.amount), 0)
  const balance = ingresosTotales - gastosTotales

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Analítico</h2>
          <p className="text-muted-foreground">Métricas, control de presupuesto y flujo de caja.</p>
        </div>
        <MonthPicker currentMonth={selectedMonth} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance Total</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? 'text-foreground' : 'text-red-600'}`}>
              ${balance.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${ingresosTotales.toFixed(2)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">-${gastosTotales.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Herramientas de Control e Insights */}
      <ExpenseInsights transactions={transactions} budget={budget} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Flujo de Caja {selectedMonth === 'all' ? 'Histórico' : 'Mensual'}</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <OverviewChart transactions={transactions} />
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Distribución de Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryPieChart transactions={transactions} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
