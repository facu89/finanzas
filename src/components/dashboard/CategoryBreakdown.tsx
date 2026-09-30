import { formatMoney } from '@/lib/format'

export function CategoryBreakdown({ items, limit = 6 }: { items: { name: string, value: number }[], limit?: number }) {
  if (items.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Sin gastos en este periodo.</p>
  }

  const total = items.reduce((acc, i) => acc + i.value, 0)
  const top = items.slice(0, limit)
  const rest = items.slice(limit).reduce((acc, i) => acc + i.value, 0)
  const rows = rest > 0 ? [...top, { name: 'Otras', value: rest }] : top
  const max = rows[0]?.value || 1

  return (
    <ul className="grid gap-3.5">
      {rows.map((row, i) => (
        <li key={row.name}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{row.name}</span>
            <span className="num shrink-0 font-medium">
              {formatMoney(row.value)}
              <span className="ml-2 inline-block w-10 text-right text-xs font-normal text-muted-foreground">
                {Math.round((row.value / total) * 100)}%
              </span>
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(row.value / max) * 100}%`,
                background: i === 0 ? 'var(--color-expense)' : 'color-mix(in oklch, var(--color-expense) 45%, var(--color-muted))',
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
