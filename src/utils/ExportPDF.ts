import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { actifs } from '../data/Actifs'

interface Position {
  id: number
  ticker: string
  lots: number
  prixEntree: number
  dateEntree: string
}

function getPrixActuel(ticker: string): number {
  const actif = actifs.find(a => a.ticker === ticker)
  return actif?.prix ?? 0
}

function getSizing(ticker: string): number {
  const actif = actifs.find(a => a.ticker === ticker)
  return actif?.sizing ?? 0
}

export function exportPortefeuillePDF(positions: Position[]) {
  const doc = new jsPDF()
  const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

  // Couleurs
  const VERT = [16, 185, 129] as [number, number, number]
  const NOIR = [3, 7, 18] as [number, number, number]
  const GRIS = [55, 65, 81] as [number, number, number]

  // Header
  doc.setFillColor(...NOIR)
  doc.rect(0, 0, 210, 40, 'F')

  doc.setTextColor(...VERT)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('CAPNEX PRO', 14, 18)

  doc.setTextColor(200, 200, 200)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Rapport Portefeuille — BRVM · Zone UEMOA', 14, 26)
  doc.text(`Généré le ${date}`, 14, 33)

  // Calculs globaux
  const totalInvesti = positions.reduce((s, p) => s + p.lots * p.prixEntree, 0)
  const totalActuel = positions.reduce((s, p) => s + p.lots * getPrixActuel(p.ticker), 0)
  const totalPnl = totalActuel - totalInvesti
  const totalPnlPct = totalInvesti > 0 ? (totalPnl / totalInvesti) * 100 : 0
  const isPositif = totalPnl >= 0

  // KPIs
  doc.setFillColor(240, 240, 240)
  doc.rect(0, 44, 210, 38, 'F')

  const kpis = [
    { label: 'Capital investi', value: `${totalInvesti.toLocaleString('fr-FR')} XOF` },
    { label: 'Valeur actuelle', value: `${totalActuel.toLocaleString('fr-FR')} XOF` },
    { label: 'P&L total', value: `${isPositif ? '+' : ''}${totalPnl.toLocaleString('fr-FR')} XOF` },
    { label: 'Performance', value: `${isPositif ? '+' : ''}${totalPnlPct.toFixed(2)}%` },
  ]

  kpis.forEach((kpi, i) => {
    const x = 14 + i * 47
    doc.setTextColor(...GRIS)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(kpi.label, x, 54)

    const isPerf = kpi.label === 'Performance' || kpi.label === 'P&L total'
    if (isPerf) {
      doc.setTextColor(isPositif ? 16 : 220, isPositif ? 185 : 38, isPositif ? 129 : 38)
    } else {
      doc.setTextColor(...NOIR)
    }
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(kpi.value, x, 63)
  })

  // Tableau positions
  doc.setTextColor(...NOIR)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Détail des positions', 14, 94)

  const rows = positions.map(p => {
    const prixActuel = getPrixActuel(p.ticker)
    const valeurEntree = p.lots * p.prixEntree
    const valeurActuelle = p.lots * prixActuel
    const pnl = valeurActuelle - valeurEntree
    const pnlPct = valeurEntree > 0 ? (pnl / valeurEntree) * 100 : 0
    const sizing = getSizing(p.ticker)
    const sizingLabel = sizing === 3 ? '3X Fort' : sizing === 2 ? '2X Achat' : sizing === 1 ? '1X Faible' : '0X Sortir'

    return [
      p.ticker,
      p.lots.toString(),
      `${p.prixEntree.toLocaleString('fr-FR')}`,
      `${prixActuel.toLocaleString('fr-FR')}`,
      `${valeurActuelle.toLocaleString('fr-FR')}`,
      `${pnl >= 0 ? '+' : ''}${pnl.toLocaleString('fr-FR')}`,
      `${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(1)}%`,
      sizingLabel,
    ]
  })

  autoTable(doc, {
    startY: 98,
    head: [['Ticker', 'Lots', 'Prix entrée', 'Prix actuel', 'Valeur (XOF)', 'P&L (XOF)', 'P&L %', 'Sizing']],
    body: rows,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: NOIR,
      textColor: VERT,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248],
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const col = data.column.index
        const val = data.cell.raw as string
        if ((col === 6 || col === 5) && typeof val === 'string') {
          if (val.startsWith('+')) {
            data.cell.styles.textColor = [16, 185, 129]
          } else if (val.startsWith('-')) {
            data.cell.styles.textColor = [220, 38, 38]
          }
        }
        if (col === 7) {
          if (val === '0X Sortir') data.cell.styles.textColor = [220, 38, 38]
          else if (val === '3X Fort') data.cell.styles.textColor = [16, 185, 129]
          else if (val === '2X Achat') data.cell.styles.textColor = [59, 130, 246]
          else data.cell.styles.textColor = [245, 158, 11]
        }
      }
    },
  })

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.text('CAPNEX PRO v3.0 — Confidentiel — Usage exclusif UEMOA', 14, 290)
    doc.text(`Page ${i} / ${pageCount}`, 196, 290, { align: 'right' })
  }

  doc.save(`CAPNEX_Portefeuille_${new Date().toISOString().split('T')[0]}.pdf`)
}