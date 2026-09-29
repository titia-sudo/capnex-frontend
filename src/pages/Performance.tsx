import { useEffect, useState } from 'react'
import { tradesAPI } from '../service/api'

interface Trade {
  id: string
  ticker: string
  dateIn: string
  prixIn: number
  prixOut: number
  capital: number
  sizing: '1X' | '2X' | '3X' | '4X'
  pnl: number
  perf: number
}

function TradeRow({
  trade,
}: {
  trade: Trade
}) {
  const pnl = trade.pnl ?? 0
  const perf = trade.perf ?? 0

  const isPos = pnl >= 0

  const sizingColor =
    trade.sizing === '4X'
      ? 'text-purple-400'
      : trade.sizing === '3X'
        ? 'text-emerald-400'
        : trade.sizing === '2X'
          ? 'text-blue-400'
          : 'text-amber-400'

  return (
    <tr className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
      {/* ACTIF */}
      <td className="px-4 py-3">
        <div className="font-mono font-bold text-white text-sm">
          {trade.ticker}
        </div>

        <div className="text-gray-500 text-xs">
          {trade.dateIn}
        </div>
      </td>

      {/* SIZING */}
      <td className="px-4 py-3 text-center">
        <span className={`font-bold text-xs ${sizingColor}`}>
          {trade.sizing}
        </span>
      </td>

      {/* ENTRÉE */}
      <td className="px-4 py-3 text-center text-white text-sm">
        {trade.prixIn.toLocaleString()}
      </td>

      {/* SORTIE */}
      <td className="px-4 py-3 text-center text-white text-sm">
        {trade.prixOut.toLocaleString()}
      </td>

      {/* CAPITAL */}
      <td className="px-4 py-3 text-center text-white text-sm">
        {trade.capital.toLocaleString()}
      </td>

      {/* P&L */}
      <td className="px-4 py-3 text-center">
        <span
          className={`font-bold text-sm ${isPos ? 'text-emerald-400' : 'text-red-400'
            }`}
        >
          {isPos ? '+' : ''}
          {pnl.toLocaleString(undefined, {
            maximumFractionDigits: 0,
          })}
        </span>
      </td>

      {/* PERFORMANCE */}
      <td className="px-4 py-3 text-center">
        <span
          className={`font-black text-sm ${isPos ? 'text-emerald-400' : 'text-red-400'
            }`}
        >
          {isPos ? '+' : ''}
          {perf.toFixed(1)}%
        </span>
      </td>

      {/* STATUT */}
      <td className="px-4 py-3 text-center">
        <span className="text-xs font-bold px-2 py-1 rounded-lg bg-gray-700 text-gray-400">
          CLÔTURÉ
        </span>
      </td>
    </tr>
  )
}

export default function Performance() {
  const [trades, setTrades] = useState<Trade[]>([])

  const [filtre, setFiltre] =
    useState<'tous' | 'gagnants' | 'perdants'>('tous')

  const [, setLoading] = useState(true)

  useEffect(() => {
    chargerTrades()
  }, [])

  const chargerTrades = async () => {
    try {
      setLoading(true)

      const data = await tradesAPI.getAll()

      setTrades(
        data.map((t: any) => ({
          id: String(t.id),
          ticker: t.ticker,
          dateIn: t.dateIn,
          prixIn: t.prixIn,
          prixOut: t.prixOut ?? 0,
          capital: t.capital,
          sizing: t.sizing,
          pnl: t.pnl ?? 0,
          perf: t.perf ?? 0,
        }))
      )
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // ─────────────────────────────
  // KPI TRACK RECORD
  // ─────────────────────────────

  const gagnants =
    trades.filter(t => t.pnl > 0)

  const perdants =
    trades.filter(t => t.pnl < 0)

  const winRate =
    trades.length > 0
      ? (gagnants.length / trades.length) * 100
      : 0

  const pnlRealise =
    trades.reduce(
      (total, trade) => total + trade.pnl,
      0
    )

  const perfMoy =
    trades.length > 0
      ? trades.reduce(
        (total, trade) => total + trade.perf,
        0
      ) / trades.length
      : 0

  // ─────────────────────────────
  // FILTRES
  // ─────────────────────────────

  const filtres = {
    tous: trades,
    gagnants,
    perdants,
  }

  const filtered = filtres[filtre]

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* HEADER */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-4">
        <div className="max-w-full px-8 mx-auto">
          <h1 className="text-xl font-black text-orange-400">
            Performance
          </h1>

          <p className="text-gray-500 text-xs">
            Track Record · {trades.length} trades
          </p>
        </div>
      </div>

      <div className="max-w-full px-8 mx-auto py-6 space-y-6">

        {/* KPI */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

          {[
            {
              label: 'Total trades',
              value: trades.length,
              sub: 'trades clôturés',
              color: 'text-white',
            },
            {
              label: 'Win Rate',
              value: `${winRate.toFixed(0)}%`,
              sub: `${gagnants.length}/${trades.length} gagnants`,
              color:
                winRate >= 50
                  ? 'text-emerald-400'
                  : 'text-red-400',
            },
            {
              label: 'P&L réalisé',
              value:
                `${pnlRealise >= 0 ? '+' : ''}` +
                pnlRealise.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                }),
              sub: 'XOF',
              color:
                pnlRealise >= 0
                  ? 'text-emerald-400'
                  : 'text-red-400',
            },
            {
              label: 'Perf. moyenne',
              value:
                `${perfMoy >= 0 ? '+' : ''}` +
                `${perfMoy.toFixed(1)}%`,
              sub: 'trades clôturés',
              color:
                perfMoy >= 0
                  ? 'text-emerald-400'
                  : 'text-red-400',
            },
          ].map(k => (
            <div
              key={k.label}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center"
            >
              <div className="text-gray-500 text-xs mb-2 uppercase tracking-wider">
                {k.label}
              </div>

              <div className={`text-2xl font-black ${k.color}`}>
                {k.value}
              </div>

              <div className="text-gray-600 text-xs mt-1">
                {k.sub}
              </div>
            </div>
          ))}

        </div>

        {/* FILTRES */}
        <div className="flex gap-2 overflow-x-auto pb-1">

          {(
            [
              'tous',
              'gagnants',
              'perdants',
            ] as const
          ).map(f => (
            <button
              key={f}
              onClick={() => setFiltre(f)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all capitalize ${filtre === f
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500'
                  : 'bg-gray-800 text-gray-500 border-gray-700'
                }`}
            >
              {f} · {filtres[f].length}
            </button>
          ))}

        </div>

        {/* TABLEAU */}
        {filtered.length > 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">

            <div className="overflow-x-auto">

              <table
                className="w-full text-sm"
                style={{ minWidth: '700px' }}
              >

                <thead>
                  <tr className="border-b border-gray-800 bg-gray-900">

                    {[
                      'ACTIF',
                      'SIZING',
                      'ENTRÉE',
                      'SORTIE',
                      'CAPITAL',
                      'P&L XOF',
                      'PERF %',
                      'STATUT',
                    ].map(h => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}

                  </tr>
                </thead>

                <tbody>
                  {filtered.map(trade => (
                    <TradeRow
                      key={trade.id}
                      trade={trade}
                    />
                  ))}
                </tbody>

              </table>

            </div>
          </div>
        ) : (
          <div className="text-center py-20 space-y-3">

            <div className="text-gray-700 text-5xl">
              📈
            </div>

            <p className="text-gray-600">
              Aucun trade enregistré
            </p>

          </div>
        )}

      </div>
    </div>
  )
}