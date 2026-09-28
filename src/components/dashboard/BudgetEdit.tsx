'use client'
import { useState, useTransition } from 'react'
import { updateBudget } from '@/actions/transactions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Check, Edit2 } from 'lucide-react'

export function BudgetEdit({ currentBudget }: { currentBudget: number }) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm">Límite: ${currentBudget}</span>
        <button onClick={() => setIsEditing(true)} className="text-muted-foreground hover:text-primary transition-colors">
          <Edit2 className="h-3 w-3" />
        </button>
      </div>
    )
  }

  return (
    <form action={(data) => {
      startTransition(async () => {
        await updateBudget(data)
        setIsEditing(false)
      })
    }} className="flex items-center gap-2">
      <Input name="budget" type="number" defaultValue={currentBudget} required className="h-6 w-20 px-1 text-xs" />
      <Button type="submit" size="icon" variant="ghost" className="h-6 w-6" disabled={isPending}>
        <Check className="h-3 w-3 text-green-500" />
      </Button>
    </form>
  )
}
