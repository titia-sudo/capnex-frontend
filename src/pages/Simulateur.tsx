import { useState } from 'react'
import { getActifsCache } from '../service/actifsStore'
import { portefeuilleAPI } from '../service/api'

interface PositionSim {
  ticker: string
  nom: string
  sizing: number
  prix: number
  lots: number
  montant: number
}

interface SimResult {
  capitalDepart: number
  unite1X: number
  positions: PositionSim[]
  capitalAlloue: number
  capitalRestant: number
  totalPositions: number
}

export default function Simulateur() {
  const [nomPortefeuille, setNomPortefeuille] = useState('')
  const [capital, setCapital] = useState('')
  const [result, setResult] = useState<SimResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [erreur, setErreur] = useState('')

  const actifs = getActifsCache()

  const calculerAllocation = () => {
    const cap = Number(capital)
    if (!cap || cap <= 0) return setErreur('Entre un capital valide')
    if (!nomPortefeuille.trim()) return setErreur('Donne un nom à ton portefeuille')
    setErreur('')

    const eligibles = actifs.filter((a: any) => a.sizing > 1)
    const totalUnites = eligibles.reduce((s: number, a: any) => s + (a.sizing - 1), 0)

    if (totalUnites === 0) return setErreur('Aucun actif éligible actuellement')

    const unite1X = Math.floor(cap / totalUnites)

    const positions: PositionSim[] = eligibles
      .map((a: any) => {
        const sizingEffectif = a.sizing - 1
        const montant = unite1X * sizingEffectif
        const lots = Math.floor(montant / a.prix)
        const montantReel = lots * a.prix
        return {
          ticker: a.ticker,
          nom: a.nom,
          sizing: a.sizing,
          prix: a.prix,
          lots,
          montant: montantReel,
        }
      })
      .filter((p: PositionSim) => p.lots > 0)
      .sort((a: PositionSim, b: PositionSim) => b.sizing - a.sizing)

    const capitalAlloue = positions.reduce((s, p) => s + p.montant, 0)
    const capitalRestant = cap - capitalAlloue

    setResult({
      capitalDepart: cap,
      unite1X,
      positions,
      capitalAlloue,
      capitalRestant,
      totalPositions: positions.length,
    })
    setSuccess(false)
  }

  const creerPortefeuille = async () => {
    if (!result) return
    setLoading(true)
    setErreur('')

    try {
      // Créer le portefeuille avec ses positions
      await portefeuilleAPI.creer({
        nom: nomPortefeuille.trim(),
        capitalInitial: result.capitalDepart,
        positions: result.positions.map(p => ({
          ticker: p.ticker,
          lots: p.lots,
          prixEntree: p.prix,
        }))
      })
      setSuccess(true)
    } catch (e: any) {
      setErreur(e.message)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setResult(null)
    setCapital('')
    setNomPortefeuille('')
    setSuccess(false)
    setErreur('')
  }

  const SIZING_LABEL: Record<number, string> = {
    4: '3X', 3: '2X', 2: '1X', 1: '0X'
  }

  const SIZING_COLOR: Record<number, string> = {
    4: 'text-emerald-400',
    3: 'text-blue-400',
    2: 'text-amber-400',
    1: 'text-red-400',
  }

  const SIZING_BG: Record<number, string> = {
    4: 'bg-emerald-500/10 border-emerald-500/30',
    3: 'bg-blue-500/10 border-blue-500/30',
    2: 'bg-amber-500/10 border-amber-500/30',
    1: 'bg-red-500/10 border-red-500/30',
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-xl font-black text-orange-400">Simulateur</h1>
          <p className="text-gray-500 text-xs">Allocation automatique · Formule D.W</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">

        {/* Formulaire */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-lg">⚡</span>
            <span className="text-white font-black">ALLOCATION — FORMULE AUTOMATIQUE</span>
          </div>

          <p className="text-gray-500 text-xs">
            Nomme ton portefeuille et entre ton capital — l'algorithme calcule automatiquement l'allocation optimale.
          </p>

          {/* Nom du portefeuille */}
          <div>
            <label className="text-gray-400 text-sm block mb-1">Nom du portefeuille</label>
            <input
              type="text"
              value={nomPortefeuille}
              onChange={e => setNomPortefeuille(e.target.value)}
              placeholder="ex: Mon Portefeuille BRVM Juin 2026"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          {/* Capital */}
          <div>
            <label className="text-gray-400 text-sm block mb-1">Capital de départ (XOF)</label>
            <input
              type="number"
              value={capital}
              onChange={e => setCapital(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && calculerAllocation()}
              placeholder="Ex: 5 000 000"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-orange-500 transition-colors"
            />
            {capital && Number(capital) > 0 && actifs.filter((a: any) => a.sizing > 1).length > 0 && (
              <p className="text-gray-500 text-xs mt-1">
                Unité 1X estimée ≈ {Math.floor(
                  Number(capital) / actifs.filter((a: any) => a.sizing > 1).reduce((s: number, a: any) => s + (a.sizing - 1), 0)
                ).toLocaleString()} XOF
              </p>
            )}
          </div>

          {erreur && <p className="text-red-400 text-sm">{erreur}</p>}

          <div className="flex gap-2">
            <button
              onClick={calculerAllocation}
              disabled={!capital || Number(capital) <= 0 || !nomPortefeuille.trim()}
              className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-black py-3 rounded-xl transition-colors"
            >
              ⚡ Calculer l'allocation
            </button>
            {result && (
              <button onClick={reset} className="px-4 py-3 bg-gray-800 text-gray-400 rounded-xl text-sm hover:text-white transition-colors">
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Résultats */}
        {result && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
                <div className="text-gray-500 text-xs mb-1">Portefeuille</div>
                <div className="text-white font-black text-sm truncate">{nomPortefeuille}</div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
                <div className="text-gray-500 text-xs mb-1">Unité 1X</div>
                <div className="text-amber-400 font-black text-lg">{result.unite1X.toLocaleString()}</div>
                <div className="text-gray-600 text-xs">XOF</div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
                <div className="text-gray-500 text-xs mb-1">Capital alloué</div>
                <div className="text-emerald-400 font-black text-lg">{result.capitalAlloue.toLocaleString()}</div>
                <div className="text-gray-600 text-xs">XOF · {((result.capitalAlloue / result.capitalDepart) * 100).toFixed(1)}%</div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
                <div className="text-gray-500 text-xs mb-1">Positions</div>
                <div className="text-white font-black text-lg">{result.totalPositions}</div>
                <div className="text-gray-600 text-xs">actifs sélectionnés</div>
              </div>
            </div>

            {/* Cash restant */}
            {result.capitalRestant > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-gray-400 text-sm">Cash restant</span>
                <span className="text-white font-bold">{result.capitalRestant.toLocaleString()} XOF</span>
              </div>
            )}

            {/* Liste positions par sizing */}
            {[4, 3, 2].map(s => {
              const posSize = result.positions.filter(p => p.sizing === s)
              if (posSize.length === 0) return null
              return (
                <div key={s} className={`border rounded-2xl overflow-hidden ${SIZING_BG[s]}`}>
                  <div className="px-4 py-3 border-b border-gray-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`font-black text-lg ${SIZING_COLOR[s]}`}>{SIZING_LABEL[s]}</span>
                      <span className="text-gray-400 text-sm">{posSize.length} actif{posSize.length > 1 ? 's' : ''}</span>
                    </div>
                    <span className="text-gray-400 text-sm">
                      {posSize.reduce((sum, p) => sum + p.montant, 0).toLocaleString()} XOF
                    </span>
                  </div>
                  <div className="divide-y divide-gray-800/30">
                    {posSize.map(p => (
                      <div key={p.ticker} className="px-4 py-3 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white text-sm">{p.ticker}</span>
                            <span className="text-gray-500 text-xs">{p.nom}</span>
                          </div>
                          <div className="text-gray-600 text-xs mt-0.5">
                            {p.lots} lots × {p.prix.toLocaleString()} XOF
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-bold text-sm">{p.montant.toLocaleString()}</div>
                          <div className="text-gray-600 text-xs">XOF</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            {/* Bouton créer portefeuille */}
            {!success ? (
              <button
                onClick={creerPortefeuille}
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-black py-4 rounded-2xl transition-colors text-lg"
              >
                {loading ? 'Création en cours...' : `✅ CRÉER "${nomPortefeuille.toUpperCase()}"`}
              </button>
            ) : (
              <div className="bg-emerald-500/20 border border-emerald-500 rounded-2xl p-4 text-center space-y-2">
                <div className="text-emerald-400 font-black text-lg">✅ Portefeuille créé !</div>
                <p className="text-gray-400 text-sm">
                  "{nomPortefeuille}" — {result.totalPositions} positions dans ton Portefeuille
                </p>
                <button onClick={reset} className="text-emerald-400 text-sm hover:text-emerald-300 transition-colors">
                  Nouvelle simulation →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}