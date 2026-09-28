import { TransactionFormModal, TransactionRowActions } from '@/components/transactions/TransactionFormModal'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { getTransactions, getAccountsAndCategories } from '@/actions/transactions'
import { format } from 'date-fns'
import { MonthPicker } from '@/components/dashboard/MonthPicker'

export default async function TransactionsPage({ searchParams }: { searchParams: { month?: string } }) {
  const allTransactions = await getTransactions()
  const { accounts, categories } = await getAccountsAndCategories()
  const selectedMonth = searchParams.month || new Date().toISOString().slice(0, 7)

  // Filtrar
  const transactions = selectedMonth === 'all' 
    ? allTransactions 
    : allTransactions.filter((t: any) => t.date.startsWith(selectedMonth))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Transacciones</h2>
          <p className="text-muted-foreground">Gestiona y revisa todo tu historial de movimientos.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <MonthPicker currentMonth={selectedMonth} />
          <TransactionFormModal accounts={accounts} categories={categories} />
        </div>
      </div>

      <div className="rounded-md border bg-card overflow-x-auto w-full">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Cuenta</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
               <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">No hay transacciones en este periodo.</TableCell></TableRow>
            ) : (
              transactions.map((tx: any) => (
                <TableRow key={tx.id}>
                  <TableCell>{format(new Date(tx.date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell className="font-medium">{tx.description || '-'}</TableCell>
                  <TableCell>{tx.categories?.name}</TableCell>
                  <TableCell>{tx.accounts?.name}</TableCell>
                  <TableCell>
                    <Badge variant={tx.type === 'ingreso_operativo' || tx.type === 'capital_proyectos' ? 'default' : tx.type === 'gasto' ? 'destructive' : 'secondary'}>{tx.type.replace('_', ' ')}</Badge>
                  </TableCell>
                  <TableCell className={`text-right font-bold ${tx.type === 'ingreso_operativo' || tx.type === 'capital_proyectos' ? 'text-green-600' : tx.type === 'gasto' ? 'text-red-600' : 'text-muted-foreground'}`}>
                    {tx.type === 'gasto' ? '-' : ''}${Number(tx.amount).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <TransactionRowActions transaction={tx} accounts={accounts} categories={categories} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
