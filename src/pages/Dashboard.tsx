import { useState } from 'react'
import { getActifsCache } from '../service/actifsStore'

type Sizing = 1 | 2 | 3 | 4

interface Actif {
  ticker: string
  nom: string
  prix: number
  score: number
  sizing: Sizing
}

const SIZING_CONFIG: Record<Sizing, { label: string; sublabel: string; color: string; border: string; bg: string; text: string; badge: string }> = {
  4: { label: '4X', sublabel: 'Fort', color: 'emerald', border: 'border-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-400', badge: 'bg-emerald-500' },
  3: { label: '3X', sublabel: 'Bon', color: 'blue', border: 'border-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-400', badge: 'bg-blue-500' },
  2: { label: '2X', sublabel: 'Moyen', color: 'amber', border: 'border-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-400', badge: 'bg-amber-500' },
  1: { label: '1X', sublabel: 'Faible', color: 'red', border: 'border-red-500', bg: 'bg-red-500/10', text: 'text-red-400', badge: 'bg-red-500' },
}

function SizingModal({ sizing, actifsList, onClose }: { sizing: Sizing, actifsList: Actif[], onClose: () => void }) {
  const config = SIZING_CONFIG[sizing]
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xl font-bold ${config.text}`}>Actifs {config.label} — {config.sublabel}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {actifsList.map(a => (
            <div key={a.ticker} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
              <div>
                <span className="font-mono font-bold text-white">{a.ticker}</span>
                <span className="text-gray-400 text-sm ml-2">{a.nom}</span>
              </div>
              <div className="text-right">
                <div className="text-white font-medium">{a.prix.toLocaleString()} XOF</div>
                <div className="text-gray-400 text-xs">Score {a.score}/100</div>
              </div>
            </div>
          ))}
        </div>
        {actifsList.length === 0 && (
          <p className="text-gray-500 text-center py-8">Aucun actif dans cette catégorie</p>
        )}
      </div>
    </div>
  )
}

function SizingCard({ sizing, actifsList, onClick }: { sizing: Sizing, actifsList: Actif[], onClick: () => void }) {
  const config = SIZING_CONFIG[sizing]
  const count = actifsList.length
  const tickers = actifsList.slice(0, 3).map(a => a.ticker).join(', ')
  const more = count > 3 ? ` +${count - 3}` : ''

  return (
    <button
      onClick={onClick}
      className={`${config.bg} ${config.border} border rounded-2xl p-5 text-left w-full transition-all hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className={`text-3xl font-black ${config.text}`}>{config.label}</span>
        <span className={`${config.badge} text-white text-xs font-bold px-2 py-1 rounded-full`}>
          {count} actif{count > 1 ? 's' : ''}
        </span>
      </div>
      <div className="text-gray-300 font-medium mb-1">{config.sublabel}</div>
      <div className="text-gray-500 text-xs font-mono truncate">
        {count > 0 ? tickers + more : '—'}
      </div>
    </button>
  )
}

export default function Dashboard() {
  const [modalSizing, setModalSizing] = useState<Sizing | null>(null)

  const actifs: Actif[] = getActifsCache()
  const bySize = (s: Sizing) => actifs.filter(a => a.sizing === s)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-orange-400 tracking-tight">Dashboard</h1>
            <p className="text-gray-500 text-xs">BRVM · Zone UEMOA · 47 actifs</p>
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-gray-900 rounded-xl p-3 text-center border border-gray-800">
            <div className="text-2xl font-black text-emerald-400">{bySize(4).length}</div>
            <div className="text-gray-500 text-xs mt-1">3X Fort</div>
          </div>
          <div className="bg-gray-900 rounded-xl p-3 text-center border border-gray-800">
            <div className="text-2xl font-black text-blue-400">{bySize(3).length}</div>
            <div className="text-gray-500 text-xs mt-1">2X Bon</div>
          </div>
          <div className="bg-gray-900 rounded-xl p-3 text-center border border-gray-800">
            <div className="text-2xl font-black text-amber-400">{bySize(2).length}</div>
            <div className="text-gray-500 text-xs mt-1">1X Moyen</div>
          </div>
          <div className={`rounded-xl p-3 text-center border ${bySize(1).length > 0 ? 'bg-red-500/10 border-red-500/50 animate-pulse' : 'bg-gray-900 border-gray-800'}`}>
            <div className={`text-2xl font-black ${bySize(1).length > 0 ? 'text-red-400' : 'text-gray-600'}`}>
              {bySize(1).length}
            </div>
            <div className="text-gray-500 text-xs mt-1">⚠ 0X Faible</div>
          </div>
        </div>

        {/* Grille Sizing 2x2 */}
        <div>
          <h2 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">Sizing dynamique</h2>
          <div className="grid grid-cols-2 gap-3">
            {([4, 3, 2, 1] as Sizing[]).map(s => (
              <SizingCard
                key={s}
                sizing={s}
                actifsList={bySize(s)}
                onClick={() => setModalSizing(s)}
              />
            ))}
          </div>
        </div>

        {/* Date mise à jour */}
        <p className="text-center text-gray-700 text-xs">
          Mis à jour le {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Modal */}
      {modalSizing !== null && (
        <SizingModal
          sizing={modalSizing}
          actifsList={bySize(modalSizing)}
          onClose={() => setModalSizing(null)}
        />
      )}
    </div>
  )
}