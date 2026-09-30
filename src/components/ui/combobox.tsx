"use client"

import * as React from "react"
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox"
import { Check, ChevronDown, Plus } from "lucide-react"
import { cn } from "cn"

export type SearchSelectOption = { value: string; label: string; hint?: string }

type Item = SearchSelectOption & { create?: boolean }

interface SearchSelectProps {
  options: SearchSelectOption[]
  value: string | null | undefined
  onChange: (value: string) => void
  /** Si se pasa, al escribir algo que no existe se ofrece "Crear «…»". */
  onCreate?: (label: string) => void
  createLabel?: (label: string) => string
  placeholder?: string
  emptyText?: string
  id?: string
  invalid?: boolean
  disabled?: boolean
  className?: string
}

/** Minúsculas y sin acentos: "Tecnologia" encuentra "Tecnología". */
function normalize(text: string) {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim()
}

/**
 * Input con búsqueda: se escribe directamente para filtrar y se elige con
 * mouse o teclado (↑ ↓ Enter). Opcionalmente permite crear la opción.
 */
export function SearchSelect({
  options,
  value,
  onChange,
  onCreate,
  createLabel = (label) => `Crear «${label}»`,
  placeholder = "Buscar…",
  emptyText = "Sin resultados",
  id,
  invalid,
  disabled,
  className,
}: SearchSelectProps) {
  const [query, setQuery] = React.useState("")
  const selected = options.find((o) => o.value === value) ?? null

  const trimmed = query.trim()
  const canCreate =
    !!onCreate &&
    trimmed.length > 0 &&
    !options.some((o) => normalize(o.label) === normalize(trimmed))

  const items: Item[] = canCreate
    ? [...options, { value: `__create__${trimmed}`, label: trimmed, create: true }]
    : options

  return (
    <ComboboxPrimitive.Root<Item>
      items={items}
      value={selected}
      onValueChange={(item) => {
        if (!item) return
        if (item.create) onCreate?.(item.label)
        else onChange(item.value)
      }}
      onInputValueChange={setQuery}
      isItemEqualToValue={(a, b) => a.value === b.value}
      itemToStringLabel={(item) => item.label}
      filter={(item, q) => item.create === true || normalize(item.label).includes(normalize(q))}
      autoHighlight
      disabled={disabled}
    >
      <ComboboxPrimitive.InputGroup
        className={cn(
          "group/search relative flex h-10 w-full items-center rounded-lg border border-input bg-card transition-colors",
          "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20",
          "has-aria-invalid:border-destructive has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/15",
          "data-disabled:opacity-50",
          className
        )}
      >
        <ComboboxPrimitive.Input
          id={id}
          placeholder={placeholder}
          aria-invalid={invalid || undefined}
          className="h-full w-full min-w-0 rounded-lg bg-transparent pr-9 pl-3 text-base outline-none placeholder:text-muted-foreground md:text-sm"
        />
        <ComboboxPrimitive.Trigger
          aria-label="Ver opciones"
          className="absolute right-1 flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronDown className="size-4 transition-transform group-has-data-popup-open/search:rotate-180" />
        </ComboboxPrimitive.Trigger>
      </ComboboxPrimitive.InputGroup>

      <ComboboxPrimitive.Portal>
        <ComboboxPrimitive.Positioner sideOffset={6} className="isolate z-50 outline-none">
          <ComboboxPrimitive.Popup
            className={cn(
              "w-(--anchor-width) min-w-48 origin-(--transform-origin) overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/10",
              "max-h-[min(var(--available-height),17rem)] overflow-y-auto overscroll-contain p-1",
              "duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
            )}
          >
            <ComboboxPrimitive.Empty className="px-3 py-5 text-center text-sm text-muted-foreground empty:m-0 empty:p-0">
              {emptyText}
            </ComboboxPrimitive.Empty>
            <ComboboxPrimitive.List>
              {(item: Item) => (
                <ComboboxPrimitive.Item
                  key={item.value}
                  value={item}
                  className={cn(
                    "flex cursor-default items-center gap-2 rounded-md px-2.5 py-2 text-sm outline-none select-none",
                    "data-highlighted:bg-accent data-highlighted:text-accent-foreground",
                    item.create && "mt-1 border-t border-border pt-2.5 text-brand"
                  )}
                >
                  {item.create ? (
                    <>
                      <Plus className="size-4 shrink-0" />
                      <span className="truncate font-medium">{createLabel(item.label)}</span>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.hint && <span className="text-xs text-muted-foreground">{item.hint}</span>}
                      <ComboboxPrimitive.ItemIndicator>
                        <Check className="size-4 text-brand" />
                      </ComboboxPrimitive.ItemIndicator>
                    </>
                  )}
                </ComboboxPrimitive.Item>
              )}
            </ComboboxPrimitive.List>
          </ComboboxPrimitive.Popup>
        </ComboboxPrimitive.Positioner>
      </ComboboxPrimitive.Portal>
    </ComboboxPrimitive.Root>
  )
}
