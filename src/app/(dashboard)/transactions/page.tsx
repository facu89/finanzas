import { TransactionFormModal } from '@/components/transactions/TransactionFormModal'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { getTransactions, getAccountsAndCategories } from '@/actions/transactions'
import { format } from 'date-fns'

export default async function TransactionsPage() {
  const transactions = await getTransactions()
  const { accounts, categories } = await getAccountsAndCategories()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Transacciones</h2>
          <p className="text-muted-foreground">Gestiona y revisa todo tu historial de movimientos.</p>
        </div>
        <TransactionFormModal accounts={accounts} categories={categories} />
      </div>

      <div className="rounded-md border bg-card overflow-x-auto w-full">
        <Table className="min-w-[600px]">
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Cuenta</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Monto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                   No hay transacciones registradas.
                 </TableCell>
               </TableRow>
            ) : (
              transactions.map((tx: any) => (
                <TableRow key={tx.id}>
                  <TableCell>{format(new Date(tx.date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell className="font-medium">{tx.description || '-'}</TableCell>
                  <TableCell>{tx.categories?.name}</TableCell>
                  <TableCell>{tx.accounts?.name}</TableCell>
                  <TableCell>
                    <Badge variant={tx.type === 'ingreso' ? 'default' : tx.type === 'gasto' ? 'destructive' : 'secondary'}>
                      {tx.type}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right font-bold ${tx.type === 'ingreso' ? 'text-green-600' : tx.type === 'gasto' ? 'text-red-600' : ''}`}>
                    {tx.type === 'gasto' ? '-' : ''}${Number(tx.amount).toFixed(2)}
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
