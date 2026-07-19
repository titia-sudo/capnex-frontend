import { useState } from 'react'
import { getActifsCache } from '../service/actifsStore'

type Sizing = 1 | 2 | 3 | 4

interface Actif {
  ticker: string
  nom: string
  pays: string
  prix: number
  score: number
  sizing: Sizing
}

  const SIZING_CONFIG: Record<number, { label: string; text: string; bg: string; border: string }> = {
    4: { label: '4X', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/40' },
    3: { label: '3X', text: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/40' },
    2: { label: '2X', text: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/40' },
    1: { label: '1X', text: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/40' },
  }

const CONF_CONFIG: Record<string, { label: string; text: string }> = {
  fort:    { label: 'FORT',    text: 'text-emerald-400' },
  bon:   { label: 'BON',   text: 'text-blue-400' },
  moyen:  { label: 'MOYEN',  text: 'text-amber-400' },
  faible: { label: 'FAIBLE', text: 'text-red-400' },
}

function getConf(sizing: number): string {
  if (sizing === 4) return 'fort'
  if (sizing === 3) return 'bon'
  if (sizing === 2) return 'moyen'
  return 'faible'
}

function BadgeSizing({ actif }: { actif: Actif }) {
  const conf = getConf(actif.sizing)
  const sc = SIZING_CONFIG[actif.sizing]
  const cc = CONF_CONFIG[conf]

  if (actif.sizing === 1) {
    return (
      <span className="inline-flex items-center gap-1 bg-red-500/20 border border-red-500 text-red-400 text-xs font-bold px-2 py-1 rounded-lg animate-pulse">
        ⚠ SORTIR
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center ${sc.bg} border ${sc.border} text-xs font-bold px-2 py-1 rounded-lg`}>
      <span className={cc.text}>{cc.label}</span>
      <span className="text-gray-500 mx-1">│</span>
      <span className={sc.text}>{sc.label}</span>
    </span>
  )
}

function BandeauSizing({ actifs, filtre, setFiltre }: {
  actifs: Actif[]
  filtre: Sizing | null
  setFiltre: (s: Sizing | null) => void
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {([4, 3, 2, 1] as Sizing[]).map(s => {
        const count = actifs.filter(a => a.sizing === s).length
        const sc = SIZING_CONFIG[s]
        const actif = filtre === s
        return (
          <button
            key={s}
            onClick={() => setFiltre(actif ? null : s)}
            className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-bold transition-all
              ${actif ? `${sc.bg} ${sc.border} ${sc.text}` : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'}`}
          >
            <span>{sc.label}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${actif ? 'bg-white/20' : 'bg-gray-700'}`}>
              {count}
            </span>
          </button>
        )
      })}
      {filtre !== null && (
        <button
          onClick={() => setFiltre(null)}
          className="flex-shrink-0 px-3 py-2 rounded-xl border border-gray-700 text-gray-500 text-sm hover:text-white transition-all"
        >
          Tout
        </button>
      )}
    </div>
  )
}

function ActifRow({ actif }: { actif: Actif }) {
  const scoreColor = actif.score >= 70 ? 'text-emerald-400' : actif.score >= 50 ? 'text-amber-400' : 'text-red-400'

  return (
    <div className="flex items-center justify-between bg-gray-900 hover:bg-gray-800 transition-colors rounded-xl px-4 py-3 border border-gray-800">
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-white text-sm">{actif.ticker}</span>
            <span className="text-gray-600 text-xs bg-gray-800 px-1.5 py-0.5 rounded">{actif.pays}</span>
          </div>
          <div className="text-gray-500 text-xs truncate mt-0.5">{actif.nom}</div>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-right hidden sm:block">
          <div className="text-white text-sm font-medium">{actif.prix.toLocaleString()}</div>
          <div className="text-gray-600 text-xs">XOF</div>
        </div>
        <div className="text-right hidden sm:block">
          <div className={`text-sm font-bold ${scoreColor}`}>{actif.score}</div>
          <div className="text-gray-600 text-xs">/100</div>
        </div>
        <BadgeSizing actif={actif} />
      </div>
    </div>
  )
}

export default function Scanner() {
  const [filtre, setFiltre] = useState<Sizing | null>(null)
  const [recherche, setRecherche] = useState('')

  const actifs: Actif[] = getActifsCache()

  const actifsFiltres = actifs
    .filter((a: any) => filtre === null || a.sizing === filtre)
    .filter(a =>
      recherche === '' ||
      a.ticker.toLowerCase().includes(recherche.toLowerCase()) ||
      a.nom.toLowerCase().includes(recherche.toLowerCase())
    )
    .sort((a, b) => b.score - a.score)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black text-orange-400">Scanner BRVM</h1>
              <p className="text-gray-500 text-xs">{actifsFiltres.length} actifs affichés</p>
            </div>
          </div>

          <BandeauSizing actifs={actifs} filtre={filtre} setFiltre={setFiltre} />

          <input
            type="text"
            placeholder="Rechercher un actif..."
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-400 transition-colors"
          />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-2">
        {actifsFiltres.map(a => (
          <ActifRow key={a.ticker} actif={a} />
        ))}
        {actifsFiltres.length === 0 && (
          <div className="text-center text-gray-600 py-16">Aucun actif trouvé</div>
        )}
      </div>
    </div>
  )
}