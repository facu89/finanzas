import type { ReactNode } from 'react'
import { cn } from 'cn'

export function PageHeader({ title, description, children }: { title: string, description?: string, children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}

export function StatCard({ label, value, hint, tone = 'default', className }: {
  label: string
  value: string
  hint?: ReactNode
  tone?: 'default' | 'income' | 'expense'
  className?: string
}) {
  return (
    <div className={cn('rounded-xl border bg-card p-4 md:p-5', className)}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={cn(
        'num mt-2 text-xl font-semibold tracking-tight md:text-2xl',
        tone === 'income' && 'text-income',
        tone === 'expense' && 'text-expense',
      )}>
        {value}
      </p>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  )
}
