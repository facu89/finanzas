'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDown, Loader2 } from 'lucide-react'
import type { Currency } from '@/types/supabase'

export interface PDFRow {
  fecha: string
  categoria: string
  descripcion: string
  tags: string
  lugar: string
  cuenta: string
  tipo: string
  monto: number
  moneda: Currency
  /** -1 gasto, 1 ingreso, 0 transferencia */
  signo: number
}

interface ReportPDFButtonProps {
  data: PDFRow[]
  from: string
  to: string
  totalGastos: number
  totalIngresos: number
}

// Las fuentes estándar de jsPDF no tienen el signo "−" (U+2212): se usa "-" ASCII.
function money(amount: number, currency: Currency = 'ARS', signed = false) {
  const body = Math.abs(amount).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const sign = amount < 0 ? '-' : signed && amount > 0 ? '+' : ''
  return `${sign}${currency === 'USD' ? 'US$' : '$'} ${body}`
}

export function ReportPDFButton({ data, from, to, totalGastos, totalIngresos }: ReportPDFButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = async () => {
    setIsGenerating(true)
    try {
      // Carga diferida: jsPDF pesa bastante y solo se necesita al descargar.
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const fmtDate = (iso: string) => iso.split('-').reverse().join('/')
      const balance = totalIngresos - totalGastos

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.text('Reporte de movimientos', 14, 18)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(110)
      doc.text(`Periodo: ${fmtDate(from)} al ${fmtDate(to)}   ·   Generado el ${new Date().toLocaleDateString('es-AR')}`, 14, 25)

      doc.setTextColor(30)
      doc.setFont('helvetica', 'bold')
      doc.text(`Ingresos: ${money(totalIngresos)}`, 14, 34)
      doc.text(`Gastos: ${money(totalGastos)}`, 90, 34)
      doc.text(`Balance: ${money(balance)}`, 166, 34)

      autoTable(doc, {
        startY: 40,
        head: [['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Lugar', 'Cuenta', 'Etiquetas', 'Monto']],
        body: data.map(row => [
          row.fecha, row.tipo, row.categoria, row.descripcion, row.lugar, row.cuenta, row.tags,
          money(row.signo === 0 ? row.monto : row.signo * row.monto, row.moneda, row.signo !== 0),
        ]),
        foot: [['', '', '', '', '', '', 'Balance (ARS)', money(balance, 'ARS', true)]],
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [38, 42, 52], textColor: 255, fontStyle: 'bold' },
        footStyles: { fillColor: [240, 240, 236], textColor: 30, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [250, 250, 248] },
        columnStyles: { 0: { cellWidth: 22 }, 7: { halign: 'right', fontStyle: 'bold' } },
        didParseCell: (hook) => {
          if (hook.section === 'body' && hook.column.index === 7) {
            const row = data[hook.row.index]
            if (row?.signo === -1) hook.cell.styles.textColor = [185, 60, 50]
            if (row?.signo === 1) hook.cell.styles.textColor = [30, 120, 80]
          }
          if (hook.section === 'foot' && hook.column.index === 7) hook.cell.styles.halign = 'right'
        },
      })

      doc.save(`reporte_${from}_${to}.pdf`)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleDownload} disabled={data.length === 0 || isGenerating} className="h-9 gap-2">
      {isGenerating ? <Loader2 className="size-4 animate-spin" /> : <FileDown className="size-4" />}
      Descargar PDF
    </Button>
  )
}
