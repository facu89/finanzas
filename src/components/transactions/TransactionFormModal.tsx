'use client'

import { useEffect, useMemo, useRef, useState, useTransition, type KeyboardEvent, type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useForm, useWatch, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { NumericFormat } from 'react-number-format'
import { AlertCircle, Loader2, Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SearchSelect } from '@/components/ui/combobox'
import { QuickAddButton } from '@/components/transactions/QuickAddButton'
import { saveTransaction, deleteTransaction, createCategory, createAccount, getUniqueMerchants } from '@/actions/transactions'
import { fetchDolarRates } from '@/actions/dolarAPI'
import { transactionSchema, type TransactionInput } from '@/lib/schemas'
import { TYPE_LABELS, currentMonthISO, formatMonth, isIncome, shiftMonth, todayISO } from '@/lib/format'
import type { Account, AccountType, Category, CategoryType, Transaction, TransactionType } from '@/types/supabase'
import { cn } from 'cn'

const TYPE_ORDER: TransactionType[] = ['gasto', 'ingreso_operativo', 'capital_proyectos', 'transferencia']

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  banco: 'Banco',
  efectivo: 'Efectivo',
  tarjeta_credito: 'Tarjeta de crédito',
  crypto: 'Crypto',
}

const inputBase =
  'flex h-10 w-full min-w-0 rounded-lg border border-input bg-card px-3 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/15 md:text-sm'

function defaultsFor(tx?: Transaction | null): Partial<TransactionInput> {
  return {
    type: tx?.type ?? 'gasto',
    account_id: tx?.account_id ?? '',
    category_id: tx?.category_id ?? '',
    amount: tx ? Number(tx.amount) : undefined,
    currency: tx?.currency ?? 'ARS',
    exchange_rate: tx?.exchange_rate != null ? Number(tx.exchange_rate) : null,
    date: tx?.date ?? todayISO(),
    description: tx?.description ?? '',
    merchant: tx?.merchant ?? '',
    installments: tx?.installments ?? null,
    tags: tx?.tags ?? [],
  }
}

function Field({ label, htmlFor, error, children, className }: { label: string, htmlFor?: string, error?: string, children: ReactNode, className?: string }) {
  return (
    <div className={cn('grid gap-1.5', className)}>
      <Label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

interface TransactionDialogProps {
  accounts: Account[]
  categories: Category[]
  tx?: Transaction | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TransactionDialog({ accounts, categories, tx, open, onOpenChange }: TransactionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-lg max-h-[92dvh] overflow-y-auto">
        {/* El contenido se desmonta al cerrar: cada apertura arranca con el formulario limpio. */}
        <TransactionForm accounts={accounts} categories={categories} tx={tx} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function TransactionForm({ accounts, categories, tx, onClose }: Omit<TransactionDialogProps, 'open' | 'onOpenChange'> & { onClose: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [isCreating, startCreating] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const [merchants, setMerchants] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [pendingAccountName, setPendingAccountName] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  // Lo creado en esta sesión del form se muestra al instante, sin esperar a que el servidor refresque las props.
  const [extraCategories, setExtraCategories] = useState<Category[]>([])
  const [extraAccounts, setExtraAccounts] = useState<Account[]>([])

  const { handleSubmit, control, setValue, register, formState: { errors } } = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: defaultsFor(tx),
  })

  useEffect(() => {
    getUniqueMerchants().then(setMerchants).catch(() => setMerchants([]))
  }, [])

  const router = useRouter()
  const pathname = usePathname()

  const [type, accountId, currency, exchangeRate, tags, date] = useWatch({
    control,
    name: ['type', 'account_id', 'currency', 'exchange_rate', 'tags', 'date'],
  })

  const allAccounts = useMemo(() => mergeById(accounts, extraAccounts), [accounts, extraAccounts])
  const allCategories = useMemo(() => mergeById(categories, extraCategories), [categories, extraCategories])

  const categoryKind = type === 'gasto' ? 'gasto' : isIncome(type) ? 'ingreso' : null
  const categoryOptions = allCategories
    .filter(c => !categoryKind || c.type === categoryKind)
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
    .map(c => ({ value: c.id, label: c.name }))
  const accountOptions = allAccounts.map(a => ({ value: a.id, label: a.name, hint: ACCOUNT_TYPE_LABELS[a.type] }))
  const merchantOptions = merchants.map(m => ({ value: m, label: m }))

  const isCreditCard = allAccounts.find(a => a.id === accountId)?.type === 'tarjeta_credito'

  // Si se cambia de gasto a ingreso (o viceversa) la categoría elegida deja de ser válida.
  const categoryId = useWatch({ control, name: 'category_id' })
  useEffect(() => {
    if (categoryId && categoryKind && !allCategories.some(c => c.id === categoryId && c.type === categoryKind)) {
      setValue('category_id', '')
    }
  }, [categoryKind, categoryId, allCategories, setValue])

  // Al pasar a USD se sugiere la cotización MEP del día (editable). Una sola vez por apertura.
  const rateRequested = useRef(false)
  useEffect(() => {
    if (currency === 'USD' && !exchangeRate && !rateRequested.current) {
      rateRequested.current = true
      fetchDolarRates().then(r => { if (r.mep) setValue('exchange_rate', r.mep) })
    }
  }, [currency, exchangeRate, setValue])

  const onSubmit = (data: TransactionInput) => {
    const pendingTag = tagInput.trim()
    const finalTags = pendingTag && !data.tags?.includes(pendingTag) ? [...(data.tags ?? []), pendingTag] : data.tags
    setServerError(null)
    startTransition(async () => {
      const result = await saveTransaction({
        ...data,
        tags: finalTags,
        installments: isCreditCard ? data.installments : null,
        exchange_rate: data.currency === 'USD' ? data.exchange_rate : null,
      }, tx?.id)
      if (!result.success) {
        setServerError(result.error)
        return
      }
      onClose()
      showMonthOf(data.date)
    })
  }

  // Si el movimiento cae en otro mes del que se está viendo (ej. uno cargado a futuro),
  // se navega a ese mes para que no parezca que desapareció.
  const showMonthOf = (date: string) => {
    if (pathname !== '/dashboard' && pathname !== '/transactions') return
    const viewed = new URLSearchParams(window.location.search).get('month') ?? currentMonthISO()
    const target = date.slice(0, 7)
    if (viewed === 'all' || viewed === target) return
    router.push(target === currentMonthISO() ? pathname : `${pathname}?month=${target}`, { scroll: false })
  }

  const today = todayISO()
  const nextMonthFirst = `${shiftMonth(today.slice(0, 7), 1)}-01`
  const dateShortcuts = [
    { label: 'Hoy', value: today },
    { label: `1° de ${formatMonth(nextMonthFirst.slice(0, 7)).split(' ')[0]}`, value: nextMonthFirst },
  ]

  const handleDelete = () => {
    if (!tx) return
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    startTransition(async () => {
      const result = await deleteTransaction(tx.id)
      if (!result.success) {
        setServerError(result.error)
        setConfirmDelete(false)
        return
      }
      onClose()
    })
  }

  const handleCreateCategory = (name: string, kind: CategoryType | null = categoryKind) => new Promise<boolean>(resolve => {
    if (!kind) {
      setServerError('Elegí gasto o ingreso antes de crear una categoría.')
      resolve(false)
      return
    }
    // Si ya existe con ese nombre, se selecciona en vez de duplicarla.
    const existing = allCategories.find(c => c.type === kind && sameName(c.name, name))
    if (existing) {
      setValue('category_id', existing.id, { shouldValidate: true })
      resolve(true)
      return
    }
    startCreating(async () => {
      const result = await createCategory({ name, type: kind })
      if (!result.success) {
        setServerError(result.error)
        resolve(false)
        return
      }
      setServerError(null)
      setExtraCategories(prev => [...prev, result.category])
      setValue('category_id', result.category.id, { shouldValidate: true })
      resolve(true)
    })
  })

  const handleAddMerchant = (name: string) => {
    const existing = merchants.find(m => sameName(m, name))
    if (!existing) setMerchants(prev => [...prev, name])
    setValue('merchant', existing ?? name, { shouldDirty: true })
    return true
  }

  const handleCreateAccount = (accountType: AccountType) => {
    if (!pendingAccountName) return
    startCreating(async () => {
      const result = await createAccount({ name: pendingAccountName, type: accountType })
      if (!result.success) {
        setServerError(result.error)
        return
      }
      setExtraAccounts(prev => [...prev, result.account])
      setValue('account_id', result.account.id, { shouldValidate: true })
      setPendingAccountName(null)
    })
  }

  const addTag = () => {
    const val = tagInput.trim().replace(/,$/, '')
    const current = tags ?? []
    if (val && !current.includes(val)) setValue('tags', [...current, val])
    setTagInput('')
  }

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    } else if (e.key === 'Backspace' && !tagInput && tags?.length) {
      setValue('tags', tags.slice(0, -1))
    }
  }

  return (
    <>
        <DialogHeader className="px-5 pt-5 pb-4">
          <DialogTitle className="text-lg font-semibold">{tx ? 'Editar movimiento' : 'Nuevo movimiento'}</DialogTitle>
          <DialogDescription>{tx ? 'Modificá los datos y guardá los cambios.' : 'Registrá un gasto o ingreso.'}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid gap-4 px-5 pb-5">
            {/* Tipo */}
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <div role="radiogroup" aria-label="Tipo de movimiento" className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 sm:grid-cols-4">
                  {TYPE_ORDER.map(t => (
                    <button
                      key={t}
                      type="button"
                      role="radio"
                      aria-checked={field.value === t}
                      onClick={() => field.onChange(t)}
                      className={cn(
                        'h-8 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground',
                        field.value === t && 'bg-card text-foreground shadow-sm ring-1 ring-foreground/5',
                        field.value === t && t === 'gasto' && 'text-expense',
                        field.value === t && isIncome(t) && 'text-income',
                      )}
                    >
                      {TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              )}
            />

            {/* Monto */}
            <Field label="Monto" htmlFor="amount" error={errors.amount?.message}>
              <div className="flex gap-2">
                <Controller
                  control={control}
                  name="currency"
                  render={({ field }) => (
                    <div className="flex shrink-0 rounded-lg bg-muted p-1">
                      {(['ARS', 'USD'] as const).map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => field.onChange(c)}
                          aria-pressed={field.value === c}
                          className={cn(
                            'h-10 rounded-md px-3 text-xs font-semibold text-muted-foreground transition-colors',
                            field.value === c && 'bg-card text-foreground shadow-sm ring-1 ring-foreground/5',
                          )}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                />
                <Controller
                  control={control}
                  name="amount"
                  render={({ field: { onChange, value, ref, onBlur } }) => (
                    <NumericFormat
                      id="amount"
                      getInputRef={ref}
                      onBlur={onBlur}
                      autoFocus={!tx}
                      inputMode="decimal"
                      aria-invalid={!!errors.amount || undefined}
                      className={cn(inputBase, 'h-12 num text-2xl font-semibold md:text-2xl')}
                      placeholder="0,00"
                      thousandSeparator="."
                      decimalSeparator=","
                      decimalScale={2}
                      allowNegative={false}
                      value={value ?? ''}
                      onValueChange={(values) => onChange(values.floatValue)}
                    />
                  )}
                />
              </div>
            </Field>

            {currency === 'USD' && (
              <Field label="Cotización (ARS por USD)" htmlFor="exchange_rate" error={errors.exchange_rate?.message}>
                <Controller
                  control={control}
                  name="exchange_rate"
                  render={({ field: { onChange, value, ref } }) => (
                    <NumericFormat
                      id="exchange_rate"
                      getInputRef={ref}
                      inputMode="decimal"
                      className={cn(inputBase, 'num')}
                      placeholder="Cargando cotización…"
                      thousandSeparator="."
                      decimalSeparator=","
                      decimalScale={2}
                      allowNegative={false}
                      value={value ?? ''}
                      onValueChange={(values) => onChange(values.floatValue ?? null)}
                    />
                  )}
                />
                <p className="text-xs text-muted-foreground">Sugerida: dólar MEP del día. Se usa para convertir a pesos en los totales.</p>
              </Field>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Fecha" htmlFor="date" error={errors.date?.message}>
                <Input id="date" type="date" className="h-10 bg-card" {...register('date')} />
                <div className="flex flex-wrap gap-1.5">
                  {dateShortcuts.map(s => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setValue('date', s.value, { shouldValidate: true })}
                      aria-pressed={date === s.value}
                      className={cn(
                        'h-6 rounded-md border px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                        date === s.value && 'border-foreground/20 bg-muted text-foreground',
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                {date > today && (
                  <p className="text-xs text-muted-foreground">Fecha futura: lo vas a ver en {formatMonth(date.slice(0, 7))}.</p>
                )}
              </Field>

              <Field label="Cuenta" htmlFor="account" error={errors.account_id?.message}>
                <Controller
                  control={control}
                  name="account_id"
                  render={({ field }) => (
                    <SearchSelect
                      id="account"
                      options={accountOptions}
                      value={field.value}
                      onChange={field.onChange}
                      onCreate={setPendingAccountName}
                      createLabel={(l) => `Crear cuenta «${l}»`}
                      placeholder="Buscar cuenta…"
                      invalid={!!errors.account_id}
                    />
                  )}
                />
              </Field>
            </div>

            {pendingAccountName && (
              <div className="rounded-lg border border-dashed bg-muted/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm">¿Qué tipo de cuenta es <span className="font-medium">«{pendingAccountName}»</span>?</p>
                  <button type="button" onClick={() => setPendingAccountName(null)} className="text-muted-foreground hover:text-foreground" aria-label="Cancelar">
                    <X className="size-4" />
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[]).map(t => (
                    <Button key={t} type="button" size="sm" variant="outline" disabled={isCreating} onClick={() => handleCreateAccount(t)}>
                      {ACCOUNT_TYPE_LABELS[t]}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {isCreditCard && (
              <Field label="Cuotas" htmlFor="installments">
                <Input
                  id="installments"
                  type="number"
                  min={1}
                  max={48}
                  placeholder="1"
                  className="h-10 bg-card sm:w-32"
                  {...register('installments', { setValueAs: v => (v === '' || v == null ? null : parseInt(v, 10)) })}
                />
              </Field>
            )}

            <Field label="Categoría" htmlFor="category" error={errors.category_id?.message}>
              <Controller
                control={control}
                name="category_id"
                render={({ field }) => (
                  <div className="flex gap-2">
                    <SearchSelect
                      id="category"
                      options={categoryOptions}
                      value={field.value}
                      onChange={field.onChange}
                      onCreate={(name) => { handleCreateCategory(name) }}
                      createLabel={(l) => `Crear categoría «${l}»`}
                      placeholder={isCreating ? 'Creando…' : 'Buscar categoría…'}
                      invalid={!!errors.category_id}
                      disabled={isCreating}
                      className="flex-1"
                    />
                    <QuickAddButton<CategoryType>
                      title="Nueva categoría"
                      placeholder="Ej. Farmacia"
                      kinds={categoryKind ? undefined : [{ value: 'gasto', label: 'Gasto' }, { value: 'ingreso', label: 'Ingreso' }]}
                      defaultKind={categoryKind ?? 'gasto'}
                      onAdd={(name, kind) => handleCreateCategory(name, kind ?? categoryKind)}
                    />
                  </div>
                )}
              />
            </Field>

            <Field label={type === 'gasto' ? 'Lugar de gasto' : 'Origen'} htmlFor="merchant">
              <Controller
                control={control}
                name="merchant"
                render={({ field }) => (
                  <div className="flex gap-2">
                    <SearchSelect
                      id="merchant"
                      options={merchantOptions}
                      value={field.value}
                      onChange={field.onChange}
                      onCreate={handleAddMerchant}
                      createLabel={(l) => `Usar «${l}»`}
                      placeholder={type === 'gasto' ? 'Ej. supermercado, farmacia…' : 'Ej. empresa, cliente…'}
                      emptyText="Sin coincidencias"
                      className="flex-1"
                    />
                    <QuickAddButton
                      title={type === 'gasto' ? 'Nuevo lugar de gasto' : 'Nuevo origen'}
                      placeholder={type === 'gasto' ? 'Ej. Carrefour' : 'Ej. Empresa S.A.'}
                      onAdd={(name) => handleAddMerchant(name)}
                    />
                  </div>
                )}
              />
            </Field>

            <Field label="Descripción" htmlFor="description">
              <Input id="description" placeholder="Opcional" className="h-10 bg-card" {...register('description')} />
            </Field>

            <Field label="Etiquetas" htmlFor="tags">
              <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-input bg-card px-2 py-1.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20">
                {(tags ?? []).map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium">
                    {tag}
                    <button type="button" aria-label={`Quitar ${tag}`} onClick={() => setValue('tags', (tags ?? []).filter(t => t !== tag))} className="text-muted-foreground hover:text-foreground">
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
                <input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={() => tagInput.trim() && addTag()}
                  placeholder={tags?.length ? '' : 'Escribí y presioná Enter'}
                  className="min-w-24 flex-1 bg-transparent px-1 text-base outline-none placeholder:text-muted-foreground md:text-sm"
                />
              </div>
            </Field>

            {serverError && (
              <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                {serverError}
              </div>
            )}
          </div>

          <DialogFooter className="m-0 items-center rounded-b-xl px-5 py-4">
            {tx && (
              <Button
                type="button"
                variant={confirmDelete ? 'destructive' : 'ghost'}
                onClick={handleDelete}
                disabled={isPending}
                className="h-9 text-destructive sm:mr-auto"
              >
                <Trash2 className="size-4" />
                {confirmDelete ? 'Confirmar eliminación' : 'Eliminar'}
              </Button>
            )}
            <Button type="button" variant="outline" className="h-9" onClick={() => onClose()}>Cancelar</Button>
            <Button type="submit" className="h-9 min-w-28" disabled={isPending || isCreating}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isPending ? 'Guardando…' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
    </>
  )
}

function sameName(a: string, b: string) {
  const norm = (t: string) => t.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
  return norm(a) === norm(b)
}

function mergeById<T extends { id: string }>(base: T[], extra: T[]) {
  const ids = new Set(base.map(i => i.id))
  return [...base, ...extra.filter(i => !ids.has(i.id))]
}

/** Botón "Nuevo movimiento" con su diálogo. `variant="fab"` es el botón flotante de mobile. */
export function NewTransactionButton({ accounts, categories, variant = 'default' }: { accounts: Account[], categories: Category[], variant?: 'default' | 'fab' }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      {variant === 'fab' ? (
        <Button
          size="icon"
          aria-label="Nuevo movimiento"
          onClick={() => setOpen(true)}
          className="fixed right-5 bottom-5 z-40 size-14 rounded-full shadow-lg shadow-foreground/15 md:hidden"
        >
          <Plus className="size-6" />
        </Button>
      ) : (
        <Button onClick={() => setOpen(true)} className="h-9 gap-1.5 px-3">
          <Plus className="size-4" /> Nuevo movimiento
        </Button>
      )}
      <TransactionDialog accounts={accounts} categories={categories} open={open} onOpenChange={setOpen} />
    </>
  )
}
