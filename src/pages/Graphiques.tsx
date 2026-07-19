import { useState, useEffect } from 'react'
import { getActifsCache } from '../service/actifsStore'
import { actifsAPI } from '../service/api'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'

interface PointHistorique {
  date: string
  prix: number
}

const PERIODES = [
  { label: '1S', jours: 7 },
  { label: '1M', jours: 30 },
  { label: '3M', jours: 90 },
  { label: '6M', jours: 180 },
  { label: '1A', jours: 365 },
]

const SIZING_COLOR: Record<number, string> = {
  3: '#10b981',
  2: '#3b82f6',
  1: '#f59e0b',
  0: '#ef4444',
}

export default function Graphiques() {
  const [periode, setPeriode] = useState(30)
  const [historique, setHistorique] = useState<PointHistorique[]>([])
  const [loadingHisto, setLoadingHisto] = useState(false)

  const actifs = getActifsCache()
  const [ticker, setTicker] = useState<string>(() => {
    const cache = getActifsCache()
    return cache.length > 0 ? cache[0].ticker : ''
  })
  const actif = actifs.find((a: any) => a.ticker === ticker) ?? actifs[0] ?? null

  useEffect(() => {
    if (!ticker && actifs.length > 0) {
      setTicker(actifs[0].ticker)
      return
    }
    if (!ticker) return
    chargerHistorique()
  }, [ticker, periode, actifs.length])

  const chargerHistorique = async () => {
    setLoadingHisto(true)
    try {
      const data = await actifsAPI.historique(ticker, periode)
      setHistorique(data)
    } catch (e) {
      console.error(e)
      setHistorique([])
    } finally {
      setLoadingHisto(false)
    }
  }

  // Si pas encore d'historique, afficher le prix actuel comme point unique
  const donnees: PointHistorique[] = historique.length > 0
    ? historique
    : actif ? [{ date: 'Aujourd\'hui', prix: actif.prix }] : []

  const prixMin = donnees.length > 0 ? Math.min(...donnees.map(d => d.prix)) : 0
  const prixMax = donnees.length > 0 ? Math.max(...donnees.map(d => d.prix)) : 0
  const prixDebut = donnees[0]?.prix ?? 0
  const prixActuel = actif?.prix ?? 0
  const variation = prixDebut > 0 ? ((prixActuel - prixDebut) / prixDebut) * 100 : 0
  const isPos = variation >= 0
  const couleur = actif ? SIZING_COLOR[actif.sizing] ?? '#10b981' : '#10b981'

  const step = Math.max(1, Math.floor(donnees.length / 6))
  const ticksX = donnees.filter((_, i) => i % step === 0).map(d => d.date)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-black text-orange-400">Graphiques</h1>
          <p className="text-gray-500 text-xs">Historique des cours BRVM</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Sélecteur */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-gray-500 text-xs block mb-1">Actif</label>
            <select
              value={ticker}
              onChange={e => setTicker(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              {actifs.map((a: any) => (
                <option key={a.ticker} value={a.ticker}>{a.ticker} — {a.nom}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-gray-500 text-xs block mb-1">Période</label>
            <div className="flex gap-1">
              {PERIODES.map(p => (
                <button
                  key={p.label}
                  onClick={() => setPeriode(p.jours)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    periode === p.jours
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                      : 'bg-gray-800 text-gray-500 border border-gray-700 hover:text-gray-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* KPIs */}
        {actif && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-white text-2xl">{actif.ticker}</span>
                  <span className="text-xs font-black px-2 py-1 rounded-lg border"
                    style={{ color: couleur, borderColor: couleur + '60', backgroundColor: couleur + '20' }}>
                    {actif.sizing}X
                  </span>
                </div>
                <p className="text-gray-500 text-xs mt-0.5">{actif.nom} · {actif.secteur}</p>
              </div>
              <div className="text-right">
                <div className="text-white font-black text-xl">{actif.prix.toLocaleString()}</div>
                <div className="text-gray-500 text-xs">XOF</div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { label: 'Score', value: `${actif.score}/100`, color: actif.score >= 70 ? 'text-emerald-400' : actif.score >= 50 ? 'text-blue-400' : 'text-amber-400' },
                { label: 'Variation', value: `${isPos ? '+' : ''}${variation.toFixed(1)}%`, color: isPos ? 'text-emerald-400' : 'text-red-400' },
                { label: 'Plus haut', value: prixMax.toLocaleString(), color: 'text-emerald-400' },
                { label: 'Plus bas', value: prixMin.toLocaleString(), color: 'text-red-400' },
              ].map(k => (
                <div key={k.label} className="bg-gray-800 rounded-xl p-2">
                  <div className="text-gray-500 text-xs mb-1">{k.label}</div>
                  <div className={`font-bold text-sm ${k.color}`}>{k.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Graphique */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          {loadingHisto ? (
            <div className="h-64 flex items-center justify-center text-gray-600">
              Chargement...
            </div>
          ) : donnees.length <= 1 ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-600 space-y-2">
              <div className="text-4xl">📈</div>
              <p className="text-sm">Historique en cours de constitution</p>
              <p className="text-xs text-gray-700">Les données s'accumulent à chaque jour de cotation</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={donnees} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d42" vertical={false} />
                <XAxis dataKey="date" ticks={ticksX} tick={{ fill: '#5a6a82', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis
                  domain={[prixMin * 0.98, prixMax * 1.02]}
                  tick={{ fill: '#5a6a82', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => v.toLocaleString()}
                  width={60}
                />
                <Tooltip
                  contentStyle={{ background: '#0d1219', border: '1px solid #1e2d42', borderRadius: '12px', color: '#e8f0fe', fontSize: '12px' }}
                  formatter={(value: any) => [`${Number(value).toLocaleString()} XOF`, 'Prix']}
                />
                {actif?.entree && <ReferenceLine y={actif.entree} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Entrée', fill: '#f59e0b', fontSize: 10 }} />}
                {actif?.sl && <ReferenceLine y={actif.sl} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'SL', fill: '#ef4444', fontSize: 10 }} />}
                {actif?.tp && <ReferenceLine y={actif.tp} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'TP', fill: '#10b981', fontSize: 10 }} />}
                <Line type="monotone" dataKey="prix" stroke={couleur} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: couleur }} />
              </LineChart>
            </ResponsiveContainer>
          )}

          <div className="flex items-center justify-center gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-4 border-t border-dashed border-amber-400"></span>Entrée</span>
            <span className="flex items-center gap-1"><span className="w-4 border-t border-dashed border-red-400"></span>SL</span>
            <span className="flex items-center gap-1"><span className="w-4 border-t border-dashed border-emerald-400"></span>TP</span>
          </div>

          {historique.length === 0 && (
            <p className="text-center text-gray-700 text-xs mt-2">
              {donnees.length} point{donnees.length > 1 ? 's' : ''} — historique en construction
            </p>
          )}
        </div>

        {/* Signaux */}
        {actif && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">Signaux</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Monthly', value: (actif.sigM ?? 'non').toUpperCase(), ok: actif.sigM === 'oui' },
                { label: 'Weekly', value: (actif.sigW ?? 'non').toUpperCase(), ok: actif.sigW === 'oui' || actif.sigW === 'moyen' },
                { label: 'Daily', value: (actif.sigD ?? 'non').toUpperCase(), ok: actif.sigD === 'oui' },
              ].map(s => (
                <div key={s.label} className={`rounded-xl p-3 text-center border ${s.ok ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-gray-800 border-gray-700'}`}>
                  <div className="text-gray-500 text-xs mb-1">{s.label}</div>
                  <div className={`font-bold text-sm ${s.ok ? 'text-emerald-400' : 'text-gray-500'}`}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}