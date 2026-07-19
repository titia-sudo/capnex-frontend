import { useState, useEffect } from 'react'
import { getActifsCache } from '../service/actifsStore'
import { tradesAPI } from '../service/api'

interface Trade {
  id: string
  ticker: string
  dateIn: string
  prixIn: number
  prixOut: number
  capital: number
  sizing: '1X' | '2X' | '3X'
  statut: 'open' | 'closed'
  pnl: number
  perf: number
}

function getPrixActuel(ticker: string): number {
  return getActifsCache().find((a: any) => a.ticker === ticker)?.prix ?? 0
}

function calculerPnl(trade: Trade): { pnl: number; perf: number } {
  const prixRef = trade.statut === 'closed' ? trade.prixOut : getPrixActuel(trade.ticker)
  const perf = trade.prixIn > 0 ? ((prixRef - trade.prixIn) / trade.prixIn) * 100 : 0
  const pnl = (perf / 100) * trade.capital
  return { pnl, perf }
}

function AjouterTradeModal({ onAjouter, onClose }: {
  onAjouter: (t: Omit<Trade, 'id' | 'pnl' | 'perf'>) => void
  onClose: () => void
}) {
  const [ticker, setTicker] = useState('')
  const [dateIn, setDateIn] = useState(new Date().toISOString().split('T')[0])
  const [prixIn, setPrixIn] = useState('')
  const [capital, setCapital] = useState('')
  const [sizing, setSizing] = useState<'1X' | '2X' | '3X'>('1X')
  const [erreur, setErreur] = useState('')

  const tickers = getActifsCache().map((a: any) => a.ticker).sort()

  const handleAjouter = () => {
    if (!ticker) return setErreur('Sélectionne un actif')
    if (!prixIn || Number(prixIn) <= 0) return setErreur('Prix invalide')
    if (!capital || Number(capital) <= 0) return setErreur('Capital invalide')

    onAjouter({
      ticker,
      dateIn,
      prixIn: Number(prixIn),
      prixOut: 0,
      capital: Number(capital),
      sizing,
      statut: 'open',
    })
    onClose()
  }

  const actifSel = getActifsCache().find((a: any) => a.ticker === ticker)

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">+ Nouveau Trade</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        <div>
          <label className="text-gray-400 text-sm block mb-1">Actif</label>
          <select
            value={ticker}
            onChange={e => {
              setTicker(e.target.value)
              const a = getActifsCache().find((x: any) => x.ticker === e.target.value)
              if (a) setPrixIn(String(a.prix))
            }}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="">Sélectionner...</option>
            {tickers.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {actifSel && <p className="text-gray-500 text-xs mt-1">{actifSel.nom}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-gray-400 text-sm block mb-1">Date entrée</label>
            <input type="date" value={dateIn} onChange={e => setDateIn(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-1">Prix entrée</label>
            <input type="number" value={prixIn} onChange={e => setPrixIn(e.target.value)} placeholder="XOF"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-emerald-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-gray-400 text-sm block mb-1">Capital (XOF)</label>
            <input type="number" value={capital} onChange={e => setCapital(e.target.value)} placeholder="ex: 500000"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-1">Sizing</label>
            <select value={sizing} onChange={e => setSizing(e.target.value as '1X' | '2X' | '3X')}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-emerald-500">
              <option value="1X">1X</option>
              <option value="2X">2X</option>
              <option value="3X">3X</option>
            </select>
          </div>
        </div>

        {erreur && <p className="text-red-400 text-sm">{erreur}</p>}

        <button onClick={handleAjouter}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-xl transition-colors">
          Ajouter le trade
        </button>
      </div>
    </div>
  )
}

function ClotureModal({ trade, onCloturer, onClose }: {
  trade: Trade
  onCloturer: (prixOut: number) => void
  onClose: () => void
}) {
  const [prixOut, setPrixOut] = useState(String(getPrixActuel(trade.ticker)))

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-white">Clôturer {trade.ticker}</h2>
        <div>
          <label className="text-gray-400 text-sm block mb-1">Prix de sortie (XOF)</label>
          <input type="number" value={prixOut} onChange={e => setPrixOut(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500" />
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 bg-gray-800 text-gray-400 font-bold py-3 rounded-xl">Annuler</button>
          <button onClick={() => onCloturer(Number(prixOut))}
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-xl">
            Clôturer
          </button>
        </div>
      </div>
    </div>
  )
}

function TradeRow({ trade, onCloturer, onSupprimer }: {
  trade: Trade
  onCloturer: (id: string, prixOut: number) => void
  onSupprimer: (id: string) => void
}) {
  const [showCloture, setShowCloture] = useState(false)
  const { pnl, perf } = calculerPnl(trade)
  const isPos = pnl >= 0
  const sizingColor = trade.sizing === '3X' ? 'text-emerald-400' : trade.sizing === '2X' ? 'text-blue-400' : 'text-amber-400'

  return (
    <>
      <tr className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
        <td className="px-4 py-3">
          <div className="font-mono font-bold text-white text-sm">{trade.ticker}</div>
          <div className="text-gray-500 text-xs">{trade.dateIn}</div>
        </td>
        <td className="px-4 py-3 text-center">
          <span className={`font-bold text-xs ${sizingColor}`}>{trade.sizing}</span>
        </td>
        <td className="px-4 py-3 text-center text-white text-sm">{trade.prixIn.toLocaleString()}</td>
        <td className="px-4 py-3 text-center text-sm">
          {trade.statut === 'closed'
            ? <span className="text-white">{trade.prixOut.toLocaleString()}</span>
            : <span className="text-gray-500 text-xs">En cours</span>}
        </td>
        <td className="px-4 py-3 text-center text-white text-sm">{trade.capital.toLocaleString()}</td>
        <td className="px-4 py-3 text-center">
          <span className={`font-bold text-sm ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPos ? '+' : ''}{pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </td>
        <td className="px-4 py-3 text-center">
          <span className={`font-black text-sm ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPos ? '+' : ''}{perf.toFixed(1)}%
          </span>
        </td>
        <td className="px-4 py-3 text-center">
          <span className={`text-xs font-bold px-2 py-1 rounded-lg ${trade.statut === 'open' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700 text-gray-400'}`}>
            {trade.statut === 'open' ? 'OUVERT' : 'CLÔTURÉ'}
          </span>
        </td>
        <td className="px-4 py-3 text-center">
          <div className="flex items-center gap-2 justify-center">
            {trade.statut === 'open' && (
              <button onClick={() => setShowCloture(true)}
                className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-1 rounded-lg hover:bg-emerald-500/30 transition-colors">
                Clôturer
              </button>
            )}
            <button onClick={() => onSupprimer(trade.id)}
              className="text-gray-600 hover:text-red-400 transition-colors text-lg leading-none">
              ×
            </button>
          </div>
        </td>
      </tr>
      {showCloture && (
        <ClotureModal
          trade={trade}
          onCloturer={(prixOut) => { onCloturer(trade.id, prixOut); setShowCloture(false) }}
          onClose={() => setShowCloture(false)}
        />
      )}
    </>
  )
}

export default function Performance() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [showModal, setShowModal] = useState(false)
  const [filtre, setFiltre] = useState<'tous' | 'open' | 'closed' | 'gagnants' | 'perdants'>('tous')
  const [, setLoading] = useState(true)

  useEffect(() => {
    chargerTrades()
  }, [])

  const chargerTrades = async () => {
    try {
      setLoading(true)
      const data = await tradesAPI.getAll()
      setTrades(data.map((t: any) => ({
        id: String(t.id),
        ticker: t.ticker,
        dateIn: t.dateIn,
        prixIn: t.prixIn,
        prixOut: t.prixOut ?? 0,
        capital: t.capital,
        sizing: t.sizing,
        statut: t.statut === 'OPEN' ? 'open' : 'closed',
        pnl: t.pnl ?? 0,
        perf: t.perf ?? 0,
      })))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }
  const ajouterTrade = async (t: Omit<Trade, 'id' | 'pnl' | 'perf'>) => {
  try {
    await tradesAPI.ajouter({
      ticker: t.ticker,
      prixIn: t.prixIn,
      capital: t.capital,
      sizing: t.sizing,
      dateIn: t.dateIn,
    })
    await chargerTrades()
  } catch (e) {
    console.error(e)
  }
}

const cloturerTrade = async (id: string, prixOut: number) => {
  try {
    await tradesAPI.cloturer(Number(id), prixOut)
    await chargerTrades()
  } catch (e) {
    console.error(e)
  }
}

  const supprimerTrade = async (id: string) => {
  try {
    await tradesAPI.supprimer(Number(id))
    setTrades(prev => prev.filter(t => t.id !== id))
  } catch (e) {
    console.error(e)
  }
}

  // KPIs
  const closed = trades.filter(t => t.statut === 'closed')
  const open = trades.filter(t => t.statut === 'open')
  const gagnants = closed.filter(t => calculerPnl(t).pnl > 0)
  const winRate = closed.length > 0 ? (gagnants.length / closed.length) * 100 : 0
  const totalPnl = trades.reduce((s, t) => s + calculerPnl(t).pnl, 0)
  const perfMoy = closed.length > 0
    ? closed.reduce((s, t) => s + calculerPnl(t).perf, 0) / closed.length
    : 0

  const filtres = {
    tous: trades,
    open: open,
    closed: closed,
    gagnants: trades.filter(t => calculerPnl(t).pnl > 0),
    perdants: trades.filter(t => calculerPnl(t).pnl < 0),
  }
  const filtered = filtres[filtre]

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-4">
        <div className="max-w-full px-8 mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-orange-400">Performance</h1>
            <p className="text-gray-500 text-xs">Track Record · {trades.length} trades</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="bg-orange-500 hover:bg-orange-400 text-black font-bold px-4 py-2 rounded-xl text-sm transition-colors">
            + Trade
          </button>
        </div>
      </div>

      <div className="max-w-full px-8 mx-auto px-4 py-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total trades', value: trades.length, sub: `${open.length} ouverts`, color: 'text-white' },
            { label: 'Win Rate', value: `${winRate.toFixed(0)}%`, sub: `${gagnants.length}/${closed.length} clôturés`, color: winRate >= 50 ? 'text-emerald-400' : 'text-red-400' },
            { label: 'P&L Total', value: `${totalPnl >= 0 ? '+' : ''}${totalPnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, sub: 'XOF', color: totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400' },
            { label: 'Perf. moyenne', value: `${perfMoy >= 0 ? '+' : ''}${perfMoy.toFixed(1)}%`, sub: 'trades clôturés', color: perfMoy >= 0 ? 'text-emerald-400' : 'text-red-400' },
          ].map(k => (
            <div key={k.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
              <div className="text-gray-500 text-xs mb-2 uppercase tracking-wider">{k.label}</div>
              <div className={`text-2xl font-black ${k.color}`}>{k.value}</div>
              <div className="text-gray-600 text-xs mt-1">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['tous', 'open', 'closed', 'gagnants', 'perdants'] as const).map(f => (
            <button key={f} onClick={() => setFiltre(f)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all capitalize ${filtre === f ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
              {f} · {filtres[f].length}
            </button>
          ))}
        </div>

        {/* Tableau */}
        {filtered.length > 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: '700px' }}>
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-900">
                    {['ACTIF', 'SIZING', 'ENTRÉE', 'SORTIE', 'CAPITAL', 'P&L XOF', 'PERF %', 'STATUT', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => (
                    <TradeRow key={t.id} trade={t} onCloturer={cloturerTrade} onSupprimer={supprimerTrade} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 space-y-3">
            <div className="text-gray-700 text-5xl">📈</div>
            <p className="text-gray-600">Aucun trade enregistré</p>
            <button onClick={() => setShowModal(true)} className="text-emerald-400 text-sm hover:text-emerald-300">
              Ajouter ton premier trade →
            </button>
          </div>
        )}
      </div>

      {showModal && <AjouterTradeModal onAjouter={ajouterTrade} onClose={() => setShowModal(false)} />}
    </div>
  )
}