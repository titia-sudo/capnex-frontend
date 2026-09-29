import { useEffect, useMemo, useState } from 'react'

import {
  tradesAPI,
  type TradeResponse,
} from '../service/api'

export default function Trades() {
  const [trades, setTrades] = useState<TradeResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')

  const chargerTrades = async () => {
    try {
      setLoading(true)
      setErreur('')

      const data = await tradesAPI.getAll()
      setTrades(data)

    } catch (e: unknown) {
      if (e instanceof Error) {
        setErreur(e.message)
      } else {
        setErreur(
          'Erreur lors du chargement des trades'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    chargerTrades()
  }, [])

  const stats = useMemo(() => {
    const closed =
      trades.filter(t => t.statut === 'CLOSED')

    const gagnants =
      closed.filter(t => (t.pnl ?? 0) > 0)

    const pnlTotal =
      closed.reduce(
        (sum, t) => sum + (t.pnl ?? 0),
        0
      )

    const perfMoyenne =
      closed.length > 0
        ? closed.reduce(
            (sum, t) => sum + (t.perf ?? 0),
            0
          ) / closed.length
        : 0

    const winRate =
      closed.length > 0
        ? (gagnants.length / closed.length) * 100
        : 0

    return {
      total: trades.length,
      closed: closed.length,
      pnlTotal,
      perfMoyenne,
      winRate,
    }
  }, [trades])

  const formatMoney = (value: number | null) =>
    value == null
      ? '—'
      : `${Math.round(value).toLocaleString()} XOF`

  const formatPct = (value: number | null) =>
    value == null
      ? '—'
      : `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      <div className="bg-gray-900 border-b border-gray-800 px-4 py-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-xl font-black text-orange-400">
            Historique des Trades
          </h1>

          <p className="text-gray-500 text-xs">
            Suivi des opérations et performances
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">

        {erreur && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-3">
            {erreur}
          </div>
        )}

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

          <Kpi
            label="Trades"
            value={stats.total.toString()}
          />

          <Kpi
            label="Win Rate"
            value={`${stats.winRate.toFixed(1)}%`}
          />

          <Kpi
            label="P&L Total"
            value={formatMoney(stats.pnlTotal)}
          />

          <Kpi
            label="Perf. moyenne"
            value={formatPct(stats.perfMoyenne)}
          />

        </div>

        {/* Tableau */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">

          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Chargement...
            </div>

          ) : trades.length === 0 ? (

            <div className="p-8 text-center text-gray-500">
              Aucun trade enregistré
            </div>

          ) : (

            <div className="overflow-x-auto">
              <table className="w-full text-sm">

                <thead className="bg-gray-800/60 text-gray-400">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      Actif
                    </th>

                    <th className="px-4 py-3 text-right">
                      Entrée
                    </th>

                    <th className="px-4 py-3 text-right">
                      Sortie
                    </th>

                    <th className="px-4 py-3 text-center">
                      Sizing
                    </th>

                    <th className="px-4 py-3 text-right">
                      Capital
                    </th>

                    <th className="px-4 py-3 text-right">
                      P&L
                    </th>

                    <th className="px-4 py-3 text-right">
                      Perf.
                    </th>

                    <th className="px-4 py-3 text-center">
                      Statut
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {trades.map(trade => {

                    const positif =
                      (trade.pnl ?? 0) >= 0

                    return (
                      <tr
                        key={trade.id}
                        className="border-t border-gray-800 hover:bg-gray-800/30"
                      >

                        <td className="px-4 py-3">
                          <div className="font-mono font-bold">
                            {trade.ticker}
                          </div>

                          <div className="text-gray-600 text-xs">
                            {trade.dateIn ?? '—'}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-right">
                          {formatMoney(trade.prixIn)}
                        </td>

                        <td className="px-4 py-3 text-right">
                          {formatMoney(trade.prixOut)}
                        </td>

                        <td className="px-4 py-3 text-center font-bold text-amber-400">
                          {trade.sizing ?? '—'}
                        </td>

                        <td className="px-4 py-3 text-right">
                          {formatMoney(trade.capital)}
                        </td>

                        <td
                          className={`px-4 py-3 text-right font-bold ${
                            positif
                              ? 'text-emerald-400'
                              : 'text-red-400'
                          }`}
                        >
                          {formatMoney(trade.pnl)}
                        </td>

                        <td
                          className={`px-4 py-3 text-right font-bold ${
                            positif
                              ? 'text-emerald-400'
                              : 'text-red-400'
                          }`}
                        >
                          {formatPct(trade.perf)}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span
                            className={
                              trade.statut === 'CLOSED'
                                ? 'text-gray-400'
                                : 'text-blue-400'
                            }
                          >
                            {trade.statut === 'CLOSED'
                              ? 'Clôturé'
                              : 'Ouvert'}
                          </span>
                        </td>

                      </tr>
                    )
                  })}
                </tbody>

              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

function Kpi({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">

      <div className="text-gray-500 text-xs mb-1">
        {label}
      </div>

      <div className="text-white font-black text-lg">
        {value}
      </div>

    </div>
  )
}