import { useState, useEffect } from 'react'
import { alertesAPI } from '../service/api'
import { onAlerteUpdate } from '../service/websocket'

interface Alerte {
  id: number
  ticker: string
  message: string
  type: 'SIGNAL' | 'STOP_LOSS' | 'FAIBLE'
  ancienSizing: number
  nouveauSizing: number
  lu: boolean
  createdAt: string
}

const SIZING_LABEL: Record<number, string> = {
  4: '3X Fort', 3: '2X Bon', 2: '1X Moyen', 1: '0X Faible'
}

const SIZING_COLOR: Record<number, string> = {
  4: 'text-emerald-400', 3: 'text-blue-400', 2: 'text-amber-400', 1: 'text-red-400'
}

const TYPE_CONFIG = {
  SIGNAL:    { icon: '📡', bg: 'bg-blue-500/20',   border: 'border-blue-500/40',   text: 'text-blue-400',   label: 'SIGNAL' },
  FAIBLE:    { icon: '⚠',  bg: 'bg-red-500/20',    border: 'border-red-500/40',    text: 'text-red-400',    label: 'FAIBLE' },
  STOP_LOSS: { icon: '🛑', bg: 'bg-orange-500/20', border: 'border-orange-500/40', text: 'text-orange-400', label: 'STOP LOSS' },
}

export default function Alertes() {
  const [alertes, setAlertes] = useState<Alerte[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    chargerAlertes()

    // Écoute WebSocket pour nouvelles alertes en temps réel
    const unsub = onAlerteUpdate(() => {
      chargerAlertes()
    })

    return () => unsub()
  }, [])

  const chargerAlertes = async () => {
    try {
      const data = await alertesAPI.getAll()
      setAlertes(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const marquerLu = async (id: number) => {
    await alertesAPI.marquerLu(id)
    setAlertes(prev => prev.map(a => a.id === id ? { ...a, lu: true } : a))
  }

  const supprimer = async (id: number) => {
    await alertesAPI.supprimer(id)
    setAlertes(prev => prev.filter(a => a.id !== id))
  }

  const toutMarquerLu = async () => {
    await alertesAPI.toutMarquerLu()
    setAlertes(prev => prev.map(a => ({ ...a, lu: true })))
  }

  const nonLues = alertes.filter(a => !a.lu).length

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-amber-400">Alertes</h1>
            <p className="text-gray-500 text-xs">
              {nonLues > 0 ? `${nonLues} non lue${nonLues > 1 ? 's' : ''}` : 'Tout lu'}
            </p>
          </div>
          {nonLues > 0 && (
            <button onClick={toutMarquerLu}
              className="text-xs text-gray-400 hover:text-white border border-gray-700 px-3 py-1.5 rounded-xl transition-colors">
              Tout marquer lu
            </button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-3">
        {loading && <div className="text-center py-20 text-gray-600">Chargement...</div>}

        {!loading && alertes.length === 0 && (
          <div className="text-center py-20 space-y-3">
            <div className="text-5xl text-gray-700">🔔</div>
            <p className="text-gray-600">Aucune alerte</p>
            <p className="text-gray-700 text-xs">Les alertes apparaissent automatiquement quand un actif change de signal</p>
          </div>
        )}

        {!loading && alertes.map(a => {
          const config = TYPE_CONFIG[a.type] ?? TYPE_CONFIG.SIGNAL
          return (
            <div key={a.id}
              className={`bg-gray-900 border rounded-2xl p-4 transition-all ${a.lu ? 'border-gray-800 opacity-60' : 'border-gray-700'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg border flex-shrink-0 ${config.bg} ${config.border} ${config.text}`}>
                    {config.icon} {config.label}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-white">{a.ticker}</span>
                      {a.ancienSizing && a.nouveauSizing && (
                        <div className="flex items-center gap-1 text-xs">
                          <span className={SIZING_COLOR[a.ancienSizing]}>{SIZING_LABEL[a.ancienSizing]}</span>
                          <span className="text-gray-600">→</span>
                          <span className={SIZING_COLOR[a.nouveauSizing]}>{SIZING_LABEL[a.nouveauSizing]}</span>
                        </div>
                      )}
                    </div>
                    <p className={`text-sm mt-1 ${a.lu ? 'text-gray-500' : 'text-gray-300'}`}>
                      {a.message}
                    </p>
                    <p className="text-gray-600 text-xs mt-1">
                      {new Date(a.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!a.lu && (
                    <button onClick={() => marquerLu(a.id)}
                      className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                      ✓
                    </button>
                  )}
                  <button onClick={() => supprimer(a.id)}
                    className="text-gray-600 hover:text-red-400 transition-colors text-lg leading-none">
                    ×
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}