'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PlusCircle, MoreHorizontal, Edit, Trash } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { createTransaction, updateTransactionAction, deleteTransaction } from '@/actions/transactions'

// Componente Interno Reutilizable para el Formulario
function TransactionFormContent({ accounts, categories, tx, open, setOpen }: any) {
  const [isPending, startTransition] = useTransition()
  const today = new Date().toISOString().split('T')[0]

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      if (tx) await updateTransactionAction(tx.id, formData)
      else await createTransaction(formData)
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tx ? 'Editar Transacción' : 'Registrar Transacción'}</DialogTitle>
          <DialogDescription>{tx ? 'Modifica los datos de este movimiento.' : 'Añade un nuevo movimiento a tus cuentas.'}</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
            <Label htmlFor="type" className="sm:text-right">Tipo</Label>
            <div className="sm:col-span-3">
              <Select name="type" defaultValue={tx?.type || "gasto"} required>
                <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ingreso_operativo">Ingreso Operativo (Fijo)</SelectItem>
                  <SelectItem value="capital_proyectos">Capital Proyectos (Extra)</SelectItem>
                  <SelectItem value="gasto">Gasto</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
            <Label htmlFor="account_id" className="sm:text-right">Cuenta</Label>
            <div className="sm:col-span-3">
              <Select name="account_id" defaultValue={tx?.account_id} required>
                <SelectTrigger><SelectValue placeholder="Selecciona cuenta" /></SelectTrigger>
                <SelectContent>
                  {accounts.map((acc:any) => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
            <Label htmlFor="category_id" className="sm:text-right">Categoría</Label>
            <div className="sm:col-span-3">
              <Select name="category_id" defaultValue={tx?.category_id} required>
                <SelectTrigger><SelectValue placeholder="Selecciona categoría" /></SelectTrigger>
                <SelectContent>
                  {categories.map((cat:any) => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
            <Label htmlFor="amount" className="sm:text-right">Monto</Label>
            <Input id="amount" name="amount" type="number" step="0.01" defaultValue={tx?.amount || ""} required className="sm:col-span-3" />
          </div>
          <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
            <Label htmlFor="date" className="sm:text-right">Fecha</Label>
            <Input id="date" name="date" type="date" defaultValue={tx?.date || today} required className="sm:col-span-3" />
          </div>
          <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
            <Label htmlFor="description" className="sm:text-right">Descrip.</Label>
            <Input id="description" name="description" defaultValue={tx?.description || ""} className="sm:col-span-3" />
          </div>
          <DialogFooter className="mt-4 flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
              {isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Export 1: Botón Crear Nueva
export function TransactionFormModal({ accounts, categories }: { accounts: any[], categories: any[] }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button className="gap-2 w-full md:w-auto" onClick={() => setOpen(true)}>
        <PlusCircle className="h-4 w-4" /> Nueva Transacción
      </Button>
      <TransactionFormContent accounts={accounts} categories={categories} open={open} setOpen={setOpen} />
    </>
  )
}

// Export 2: Acciones por fila de la tabla (Editar / Borrar)
export function TransactionRowActions({ transaction, accounts, categories }: { transaction: any, accounts: any[], categories: any[] }) {
  const [open, setOpen] = useState(false)
  const [isDeleting, startDelete] = useTransition()

  const handleDelete = () => {
    if (confirm('¿Estás seguro de eliminar este registro?')) {
      startDelete(async () => {
        await deleteTransaction(transaction.id)
      })
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="h-8 w-8 p-0 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground" disabled={isDeleting}>
          <span className="sr-only">Abrir menú</span>
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setOpen(true)} className="cursor-pointer">
            <Edit className="h-4 w-4 mr-2" /> Editar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete} className="cursor-pointer text-red-600 focus:text-red-600">
            <Trash className="h-4 w-4 mr-2" /> Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <TransactionFormContent accounts={accounts} categories={categories} tx={transaction} open={open} setOpen={setOpen} />
    </>
  )
}
