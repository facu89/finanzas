import * as z from 'zod'

export const transactionSchema = z.object({
  type: z.enum(['ingreso_operativo', 'capital_proyectos', 'gasto', 'transferencia']),
  account_id: z.string().min(1, 'Elegí una cuenta'),
  category_id: z.string().min(1, 'Elegí una categoría'),
  amount: z.number({ required_error: 'Ingresá un monto', invalid_type_error: 'Ingresá un monto' }).positive('El monto debe ser mayor a 0'),
  currency: z.enum(['ARS', 'USD']),
  exchange_rate: z.number().positive('Cotización inválida').nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  description: z.string().trim().max(200).optional(),
  merchant: z.string().trim().max(100).optional(),
  installments: z.number().int().min(1).max(48).nullable().optional(),
  tags: z.array(z.string().trim().min(1)).max(10).optional(),
})

export type TransactionInput = z.infer<typeof transactionSchema>
