import { useState, useEffect } from 'react'
import { getActifsCache } from '../service/actifsStore'
import { exportPortefeuillePDF } from '../utils/ExportPDF'
import { portefeuilleAPI } from '../service/api'

interface PortefeuilleItem {
  id: number
  nom: string
  capitalInitial: number
  createdAt: string
}

interface Position {
  id: number
  ticker: string
  lots: number
  prixEntree: number
  dateEntree: string
}

interface CloturResult {
  ticker: string
  lots: number
  prixEntree: number
  prixSortie: number
  capital: number
  pnl: number
  perf: number
  sizing: string
  message: string
}

function getPrixActuel(ticker: string): number {
  return getActifsCache().find((a: any) => a.ticker === ticker)?.prix ?? 0
}

function getSizing(ticker: string): number {
  return getActifsCache().find((a: any) => a.ticker === ticker)?.sizing ?? 1
}

// ── TOAST ──
function Toast({ result, onClose }: { result: CloturResult; onClose: () => void }) {
  const isPos = result.pnl >= 0
  useEffect(() => {
    const t = setTimeout(onClose, 5000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className="fixed top-16 left-0 right-0 z-50 px-4">
      <div className={`max-w-5xl mx-auto rounded-2xl p-4 border shadow-2xl ${isPos ? 'bg-orange-500/20 border-orange-500' : 'bg-red-500/20 border-red-500'}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-white font-black">{result.ticker}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${isPos ? 'bg-orange-500/30 text-orange-400' : 'bg-red-500/30 text-red-400'}`}>Clôturé</span>
            </div>
            <p className="text-gray-300 text-sm">{result.lots} lots · {result.prixEntree.toLocaleString()} → {result.prixSortie.toLocaleString()} XOF</p>
            <div className="flex items-center gap-3">
              <span className={`font-black text-lg ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
                {isPos ? '+' : ''}{result.pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })} XOF
              </span>
              <span className={`font-bold ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
                {isPos ? '+' : ''}{result.perf.toFixed(1)}%
              </span>
            </div>
            <p className="text-gray-500 text-xs">✅ Trade créé automatiquement dans Track Record</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none flex-shrink-0">×</button>
        </div>
      </div>
    </div>
  )
}

// ── MODAL CLOTURE ──
function ClotureModal({ position, onCloturer, onClose }: {
  position: Position
  onCloturer: (prixSortie: number) => void
  onClose: () => void
}) {
  const prixActuel = getPrixActuel(position.ticker)
  const [prixSortie, setPrixSortie] = useState(String(prixActuel || position.prixEntree))

  const prixVal = Number(prixSortie)
  const pnl = position.lots * (prixVal - position.prixEntree)
  const perf = ((prixVal - position.prixEntree) / position.prixEntree) * 100
  const isPos = pnl >= 0

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Clôturer {position.ticker}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>
        <div className="bg-gray-800 rounded-xl p-3 text-sm space-y-1">
          <div className="flex justify-between text-gray-400">
            <span>Lots</span><span className="text-white">{position.lots}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Prix entrée</span><span className="text-white">{position.prixEntree.toLocaleString()} XOF</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Prix actuel</span><span className="text-white">{prixActuel.toLocaleString()} XOF</span>
          </div>
        </div>
        <div>
          <label className="text-gray-400 text-sm block mb-1">Prix de sortie (XOF)</label>
          <input type="number" value={prixSortie} onChange={e => setPrixSortie(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-center text-lg font-bold focus:outline-none focus:border-orange-500 transition-colors" />
        </div>
        {prixSortie && (
          <div className={`rounded-xl p-3 text-center ${isPos ? 'bg-orange-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
            <div className={`text-2xl font-black ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPos ? '+' : ''}{pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })} XOF
            </div>
            <div className={`text-sm font-bold mt-1 ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPos ? '+' : ''}{perf.toFixed(1)}%
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 bg-gray-800 text-gray-400 font-bold py-3 rounded-xl">Annuler</button>
          <button onClick={() => onCloturer(Number(prixSortie))} disabled={!prixSortie || Number(prixSortie) <= 0}
            className="flex-1 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-black font-bold py-3 rounded-xl transition-colors">
            Clôturer
          </button>
        </div>
      </div>
    </div>
  )
}

// ── POSITION CARD ──
function PositionCard({ position, onSupprimer, onCloturer }: {
  position: Position
  onSupprimer: (id: number) => void
  onCloturer: (position: Position) => void
}) {
  const prixActuel = getPrixActuel(position.ticker)
  const sizing = getSizing(position.ticker)
  const valeurEntree = position.lots * position.prixEntree
  const valeurActuelle = position.lots * prixActuel
  const pnl = valeurActuelle - valeurEntree
  const pnlPct = valeurEntree > 0 ? (pnl / valeurEntree) * 100 : 0
  const isPositif = pnl >= 0
  const isAlerteSort = sizing === 1

  return (
    <div className={`bg-gray-900 rounded-2xl border p-4 space-y-3 ${isAlerteSort ? 'border-red-500/60' : 'border-gray-800'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono font-black text-white text-lg">{position.ticker}</span>
          {isAlerteSort && (
            <span className="bg-red-500/20 border border-red-500 text-red-400 text-xs font-bold px-2 py-0.5 rounded-lg animate-pulse">
              ⚠ FAIBLE
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onCloturer(position)}
            className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/40 px-3 py-1.5 rounded-xl hover:bg-orange-500/30 transition-colors font-bold">
            Clôturer
          </button>
          <button onClick={() => onSupprimer(position.id)}
            className="text-gray-600 hover:text-red-400 transition-colors text-xl leading-none">
            ×
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-gray-800 rounded-xl p-2">
          <div className="text-white font-bold">{position.lots}</div>
          <div className="text-gray-500 text-xs">Lots</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-2">
          <div className="text-white font-bold text-sm">{position.prixEntree.toLocaleString()}</div>
          <div className="text-gray-500 text-xs">Prix entrée</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-2">
          <div className="text-white font-bold text-sm">{prixActuel.toLocaleString()}</div>
          <div className="text-gray-500 text-xs">Prix actuel</div>
        </div>
      </div>

      <div className={`rounded-xl p-3 flex items-center justify-between ${isPositif ? 'bg-orange-500/10 border border-orange-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
        <div>
          <div className="text-gray-400 text-xs mb-1">P&L</div>
          <div className={`font-black text-lg ${isPositif ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPositif ? '+' : ''}{pnl.toLocaleString()} XOF
          </div>
        </div>
        <div className={`text-2xl font-black ${isPositif ? 'text-emerald-400' : 'text-red-400'}`}>
          {isPositif ? '+' : ''}{pnlPct.toFixed(1)}%
        </div>
      </div>

      <div className="text-gray-600 text-xs text-right">
        Valeur actuelle : {valeurActuelle.toLocaleString()} XOF
      </div>
    </div>
  )
}

// ── MODAL AJOUTER POSITION ──
function AjouterPositionModal({ portefeuilleId, onAjouter, onClose }: {
  portefeuilleId: number
  onAjouter: (p: { ticker: string; lots: number; prixEntree: number; portefeuilleId: number }) => void
  onClose: () => void
}) {
  const actifs = getActifsCache()
  const [ticker, setTicker] = useState('')
  const [lots, setLots] = useState('')
  const [prixEntree, setPrixEntree] = useState('')
  const [erreur, setErreur] = useState('')

  const tickersDisponibles = actifs.map((a: any) => a.ticker).sort()
  const actifSelectionne = actifs.find((a: any) => a.ticker === ticker)

  const handleAjouter = () => {
    if (!ticker) return setErreur('Sélectionne un actif')
    if (!lots || Number(lots) <= 0) return setErreur('Nombre de lots invalide')
    if (!prixEntree || Number(prixEntree) <= 0) return setErreur("Prix d'entrée invalide")
    onAjouter({ ticker, lots: Number(lots), prixEntree: Number(prixEntree), portefeuilleId })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Nouvelle position</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>
        <div>
          <label className="text-gray-400 text-sm block mb-1">Actif</label>
          <select value={ticker} onChange={e => {
            setTicker(e.target.value)
            const a = actifs.find((x: any) => x.ticker === e.target.value)
            if (a) setPrixEntree(String(a.prix))
          }} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors">
            <option value="">Sélectionner un actif...</option>
            {tickersDisponibles.map((t: string) => <option key={t} value={t}>{t}</option>)}
          </select>
          {actifSelectionne && (
            <p className="text-gray-500 text-xs mt-1">{actifSelectionne.nom} — Score {actifSelectionne.score}/100</p>
          )}
        </div>
        <div>
          <label className="text-gray-400 text-sm block mb-1">Nombre de lots</label>
          <input type="number" value={lots} onChange={e => setLots(e.target.value)} placeholder="ex: 100"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors" />
        </div>
        <div>
          <label className="text-gray-400 text-sm block mb-1">Prix d'entrée (XOF)</label>
          <input type="number" value={prixEntree} onChange={e => setPrixEntree(e.target.value)} placeholder="ex: 15000"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors" />
        </div>
        {erreur && <p className="text-red-400 text-sm">{erreur}</p>}
        <button onClick={handleAjouter}
          className="w-full bg-orange-500 hover:bg-orange-400 text-black font-bold py-3 rounded-xl transition-colors">
          Ajouter la position
        </button>
      </div>
    </div>
  )
}

// ── MODAL CRÉER PORTEFEUILLE ──
function CreerPortefeuilleModal({ onCreer, onClose }: {
  onCreer: (nom: string, capitalInitial: number) => void
  onClose: () => void
}) {
  const [nom, setNom] = useState('')
  const [capital, setCapital] = useState('')
  const [erreur, setErreur] = useState('')

  const handleCreer = () => {
    if (!nom.trim()) return setErreur('Entre un nom pour le portefeuille')
    if (!capital || Number(capital) <= 0) return setErreur('Entre un capital initial valide')
    onCreer(nom.trim(), Number(capital))
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Nouveau portefeuille</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>
        <div>
          <label className="text-gray-400 text-sm block mb-1">Nom du portefeuille</label>
          <input type="text" value={nom} onChange={e => setNom(e.target.value)} placeholder="ex: Mon Portefeuille BRVM"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors" />
        </div>
        <div>
          <label className="text-gray-400 text-sm block mb-1">Capital initial (XOF)</label>
          <input type="number" value={capital} onChange={e => setCapital(e.target.value)} placeholder="ex: 5 000 000"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors" />
        </div>
        {erreur && <p className="text-red-400 text-sm">{erreur}</p>}
        <button onClick={handleCreer}
          className="w-full bg-orange-500 hover:bg-orange-400 text-black font-bold py-3 rounded-xl transition-colors">
          Créer le portefeuille
        </button>
      </div>
    </div>
  )
}

// ── VUE POSITIONS D'UN PORTEFEUILLE ──
function VuePositions({ portefeuille, onRetour }: {
  portefeuille: PortefeuilleItem
  onRetour: () => void
}) {
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [positionACloturer, setPositionACloturer] = useState<Position | null>(null)
  const [toastResult, setToastResult] = useState<CloturResult | null>(null)

  useEffect(() => {
    chargerPositions()
  }, [])

  const chargerPositions = async () => {
    try {
      setLoading(true)
      const data = await portefeuilleAPI.getPositions(portefeuille.id)
      setPositions(data.map((p: any) => ({
        id: p.id,
        ticker: p.ticker,
        lots: p.lots,
        prixEntree: p.prixEntree,
        dateEntree: p.dateEntree,
      })))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const ajouterPosition = async (p: { ticker: string; lots: number; prixEntree: number; portefeuilleId: number }) => {
    try {
      await portefeuilleAPI.ajouterPosition(p)
      await chargerPositions()
    } catch (e) {
      console.error(e)
    }
  }

  const supprimerPosition = async (id: number) => {
    try {
      await portefeuilleAPI.supprimerPosition(id)
      setPositions(prev => prev.filter(p => p.id !== id))
    } catch (e) {
      console.error(e)
    }
  }

  const cloturerPosition = async (prixSortie: number) => {
    if (!positionACloturer) return
    try {
      const result = await portefeuilleAPI.cloturer(positionACloturer.id, prixSortie)
      setPositions(prev => prev.filter(p => p.id !== positionACloturer.id))
      setToastResult(result)
      setPositionACloturer(null)
    } catch (e) {
      console.error(e)
    }
  }

  const totalInvesti = positions.reduce((s, p) => s + p.lots * p.prixEntree, 0)
  const totalActuel = positions.reduce((s, p) => s + p.lots * getPrixActuel(p.ticker), 0)
  const totalPnl = totalActuel - totalInvesti
  const totalPnlPct = totalInvesti > 0 ? (totalPnl / totalInvesti) * 100 : 0
  const isPositif = totalPnl >= 0

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {toastResult && <Toast result={toastResult} onClose={() => setToastResult(null)} />}

      <div className="bg-gray-900 border-b border-gray-800 px-4 py-4">
        <div className="max-w-5xl mx-auto">
          <button onClick={onRetour} className="text-gray-400 hover:text-white text-sm mb-2 flex items-center gap-1 transition-colors">
            ← Retour
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black text-orange-400">{portefeuille.nom}</h1>
              <p className="text-gray-500 text-xs">{positions.length} position{positions.length > 1 ? 's' : ''} · Capital : {portefeuille.capitalInitial.toLocaleString()} XOF</p>
            </div>
            <div className="flex gap-2">
              {positions.length > 0 && (
                <button onClick={() => exportPortefeuillePDF(positions)}
                  className="bg-gray-800 hover:bg-gray-700 text-cyan-400 font-bold px-3 py-2 rounded-xl text-sm border border-gray-700">
                  ↓ PDF
                </button>
              )}
              <button onClick={() => setShowModal(true)}
                className="bg-orange-500 hover:bg-orange-400 text-black font-bold px-4 py-2 rounded-xl text-sm">
                + Ajouter
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {loading && <div className="text-center py-20 text-gray-600">Chargement...</div>}

        {!loading && (
  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
    <div className="grid grid-cols-3 gap-3 text-center">
      <div>
        <div className="text-gray-400 text-xs mb-1">Capital initial</div>
        <div className="text-white font-bold text-sm">{portefeuille.capitalInitial.toLocaleString()}</div>
        <div className="text-gray-500 text-xs">XOF</div>
      </div>
      <div>
        <div className="text-gray-400 text-xs mb-1">Investi</div>
        <div className="text-white font-bold text-sm">{totalInvesti.toLocaleString()}</div>
        <div className="text-gray-500 text-xs">XOF</div>
      </div>
      <div>
        <div className="text-gray-400 text-xs mb-1">Cash restant</div>
        <div className={`font-bold text-sm ${(portefeuille.capitalInitial - totalInvesti) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {(portefeuille.capitalInitial - totalInvesti).toLocaleString()}
        </div>
        <div className="text-gray-500 text-xs">XOF</div>
      </div>
    </div>

    {positions.length > 0 && (
      <div className={`mt-3 pt-3 border-t border-gray-800 flex items-center justify-between`}>
        <span className="text-gray-400 text-xs">P&L global</span>
        <span className={`font-black text-lg ${isPositif ? 'text-emerald-400' : 'text-red-400'}`}>
          {isPositif ? '+' : ''}{totalPnl.toLocaleString(undefined, { maximumFractionDigits: 0 })} XOF
          <span className="text-sm ml-2">({isPositif ? '+' : ''}{totalPnlPct.toFixed(1)}%)</span>
        </span>
      </div>
    )}
  </div>
)}

        {!loading && positions.map(p => (
          <PositionCard key={p.id} position={p} onSupprimer={supprimerPosition} onCloturer={setPositionACloturer} />
        ))}

        {!loading && positions.length === 0 && (
          <div className="text-center py-20 space-y-3">
            <div className="text-gray-700 text-5xl">📭</div>
            <p className="text-gray-600">Aucune position dans ce portefeuille</p>
            <button onClick={() => setShowModal(true)} className="text-orange-400 text-sm hover:text-orange-300">
              Ajouter ta première position →
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <AjouterPositionModal
          portefeuilleId={portefeuille.id}
          onAjouter={ajouterPosition}
          onClose={() => setShowModal(false)}
        />
      )}

      {positionACloturer && (
        <ClotureModal
          position={positionACloturer}
          onCloturer={cloturerPosition}
          onClose={() => setPositionACloturer(null)}
        />
      )}
    </div>
  )
}

// ── PAGE PRINCIPALE — LISTE DES PORTEFEUILLES ──
export default function Portefeuille() {
  const [portefeuilles, setPortefeuilles] = useState<PortefeuilleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreer, setShowCreer] = useState(false)
  const [portefeuilleSelectionne, setPortefeuilleSelectionne] = useState<PortefeuilleItem | null>(null)

  useEffect(() => {
    chargerPortefeuilles()
  }, [])

  const chargerPortefeuilles = async () => {
    try {
      setLoading(true)
      const data = await portefeuilleAPI.getAll()
      setPortefeuilles(data.map((p: any) => ({
        id: p.id,
        nom: p.nom,
        capitalInitial: p.capitalInitial,
        createdAt: p.createdAt,
      })))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const creerPortefeuille = async (nom: string, capitalInitial: number) => {
    try {
      await portefeuilleAPI.creer({ nom, capitalInitial, positions: [] })
      await chargerPortefeuilles()
    } catch (e) {
      console.error(e)
    }
  }

  const supprimerPortefeuille = async (id: number) => {
    try {
      await portefeuilleAPI.supprimer(id)
      setPortefeuilles(prev => prev.filter(p => p.id !== id))
    } catch (e) {
      console.error(e)
    }
  }

  // Vue positions d'un portefeuille
  if (portefeuilleSelectionne) {
    return (
      <VuePositions
        portefeuille={portefeuilleSelectionne}
        onRetour={() => {
          setPortefeuilleSelectionne(null)
          chargerPortefeuilles()
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-orange-400">Portefeuilles</h1>
            <p className="text-gray-500 text-xs">{portefeuilles.length} portefeuille{portefeuilles.length > 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => setShowCreer(true)}
            className="bg-orange-500 hover:bg-orange-400 text-black font-bold px-4 py-2 rounded-xl text-sm">
            + Nouveau
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-3">
        {loading && <div className="text-center py-20 text-gray-600">Chargement...</div>}

        {!loading && portefeuilles.map(p => (
          <div key={p.id}
            onClick={() => setPortefeuilleSelectionne(p)}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-4 cursor-pointer hover:border-orange-500/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💼</span>
                  <div>
                    <h3 className="text-white font-bold">{p.nom}</h3>
                    <p className="text-gray-500 text-xs">{p.capitalInitial.toLocaleString()} XOF · {new Date(p.createdAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">→</span>
                <button
                  onClick={e => { e.stopPropagation(); supprimerPortefeuille(p.id) }}
                  className="text-gray-600 hover:text-red-400 transition-colors text-lg leading-none ml-2">
                  ×
                </button>
              </div>
            </div>
          </div>
        ))}

        {!loading && portefeuilles.length === 0 && (
          <div className="text-center py-20 space-y-3">
            <div className="text-gray-700 text-5xl">💼</div>
            <p className="text-gray-600">Aucun portefeuille</p>
            <button onClick={() => setShowCreer(true)} className="text-orange-400 text-sm hover:text-orange-300">
              Créer ton premier portefeuille →
            </button>
          </div>
        )}
      </div>

      {showCreer && (
        <CreerPortefeuilleModal
          onCreer={creerPortefeuille}
          onClose={() => setShowCreer(false)}
        />
      )}
    </div>
  )
}