'use client'

import { useState } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from 'cn'

interface QuickAddButtonProps<K extends string> {
  /** Texto accesible y título del panel, ej. "Nueva categoría". */
  title: string
  placeholder?: string
  /** Opciones extra a elegir junto con el nombre (ej. gasto / ingreso). */
  kinds?: { value: K, label: string }[]
  defaultKind?: K
  /** Devuelve `true` si se agregó bien; en ese caso se cierra el panel. */
  onAdd: (name: string, kind?: K) => boolean | Promise<boolean>
}

/**
 * Botón "+" que abre un panel para crear un elemento nuevo.
 * No usa <form>: el panel se renderiza en un portal y un submit anidado
 * burbujearía (por el árbol de React) hasta el formulario del movimiento.
 */
export function QuickAddButton<K extends string>({ title, placeholder = 'Nombre', kinds, defaultKind, onAdd }: QuickAddButtonProps<K>) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [kind, setKind] = useState<K | undefined>(defaultKind)
  const [pending, setPending] = useState(false)

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) {
      setName('')
      setKind(defaultKind ?? kinds?.[0]?.value)
    }
  }

  const submit = async () => {
    const value = name.trim()
    if (!value || pending) return
    setPending(true)
    try {
      if (await onAdd(value, kind)) setOpen(false)
    } finally {
      setPending(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        aria-label={title}
        title={title}
        className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-input bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-popup-open:bg-muted data-popup-open:text-foreground"
      >
        <Plus className="size-4" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 gap-3 p-3">
        <p className="text-sm font-medium">{title}</p>
        {kinds && (
          <div className="flex rounded-lg bg-muted p-1">
            {kinds.map(k => (
              <button
                key={k.value}
                type="button"
                onClick={() => setKind(k.value)}
                aria-pressed={kind === k.value}
                className={cn(
                  'h-7 flex-1 rounded-md text-xs font-medium text-muted-foreground transition-colors',
                  kind === k.value && 'bg-card text-foreground shadow-sm ring-1 ring-foreground/5',
                )}
              >
                {k.label}
              </button>
            ))}
          </div>
        )}
        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              e.stopPropagation()
              submit()
            }
          }}
          placeholder={placeholder}
          className="h-9 bg-card"
          maxLength={100}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" className="h-8" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button type="button" size="sm" className="h-8 min-w-20" disabled={!name.trim() || pending} onClick={submit}>
            {pending && <Loader2 className="size-3.5 animate-spin" />}
            Agregar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
