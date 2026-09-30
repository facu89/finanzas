'use client'

import { useState, useTransition } from 'react'
import { NumericFormat } from 'react-number-format'
import { Check, Pencil, X } from 'lucide-react'
import { updateBudget } from '@/actions/transactions'

export function BudgetEdit({ currentBudget }: { currentBudget: number }) {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState<number | undefined>(currentBudget || undefined)
  const [isPending, startTransition] = useTransition()

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => { setValue(currentBudget || undefined); setIsEditing(true) }}
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Pencil className="size-3" />
        {currentBudget > 0 ? 'Editar' : 'Definir'}
      </button>
    )
  }

  const save = () => {
    startTransition(async () => {
      const result = await updateBudget(value ?? 0)
      if (result.success) setIsEditing(false)
    })
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); save() }}
      className="flex items-center gap-1"
    >
      <NumericFormat
        autoFocus
        aria-label="Presupuesto mensual"
        inputMode="decimal"
        className="num h-8 w-32 rounded-md border border-input bg-card px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20"
        prefix="$ "
        thousandSeparator="."
        decimalSeparator=","
        decimalScale={0}
        allowNegative={false}
        value={value ?? ''}
        onValueChange={(v) => setValue(v.floatValue)}
        onKeyDown={(e) => e.key === 'Escape' && setIsEditing(false)}
      />
      <button type="submit" disabled={isPending} aria-label="Guardar" className="flex size-8 items-center justify-center rounded-md text-income hover:bg-muted disabled:opacity-50">
        <Check className="size-4" />
      </button>
      <button type="button" onClick={() => setIsEditing(false)} aria-label="Cancelar" className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
        <X className="size-4" />
      </button>
    </form>
  )
}
