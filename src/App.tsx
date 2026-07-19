import { useState, useEffect } from 'react'
import { chargerActifs, mettreAJourPrix } from './service/actifsStore'
import { connecterWebSocket, deconnecterWebSocket, onPrixUpdate, onAlerteUpdate } from './service/websocket'
import { alertesAPI } from './service/api'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Scanner from './pages/Scanner'
import Portefeuille from './pages/Portefeuille'
import AnalysePrivee from './pages/AnalysePrivee'
import Performance from './pages/Performance'
import Alertes from './pages/Alertes'
import Mentions from './pages/Mentions'
import Simulateur from './pages/Simulateur'
import Graphiques from './pages/Graphiques'
import Formation from './pages/Formation'

type Page = 'dashboard' | 'scanner' | 'portefeuille' | 'analyse' | 'performance' | 'alertes' | 'notes' | 'mentions' | 'simulateur' | 'graphiques' | 'formation'
type Role = 'user' | 'analyste'

export default function App() {
  const [role, setRole] = useState<Role | null>(() => {
    const user = localStorage.getItem('capnex_user')
    if (user) {
      const parsed = JSON.parse(user)
      return parsed.role === 'ANALYSTE' ? 'analyste' : 'user'
    }
    return null
  })
  const [nom, setNom] = useState<string>(() => {
    const user = localStorage.getItem('capnex_user')
    return user ? JSON.parse(user).nom : ''
  })
  const [page, setPage] = useState<Page>('dashboard')
  const [actifsCharges, setActifsCharges] = useState(false)
  const [, forceUpdate] = useState(0)
  const [nonLues, setNonLues] = useState(0)

  useEffect(() => {
    chargerActifs().then(() => setActifsCharges(true))
  }, [])

  useEffect(() => {
    if (!role) return

    // Charger le count initial des alertes
    alertesAPI.getCount().then(d => setNonLues(d.nonLues)).catch(() => {})

    connecterWebSocket()

    const unsubPrix = onPrixUpdate((prix) => {
      mettreAJourPrix(prix)
      forceUpdate(n => n + 1)
    })

    const unsubAlerte = onAlerteUpdate(() => {
      alertesAPI.getCount().then(d => setNonLues(d.nonLues)).catch(() => {})
    })

    return () => {
      unsubPrix()
      unsubAlerte()
      deconnecterWebSocket()
    }
  }, [role])

  const handleLogin = (r: Role, _token: string, n: string) => {
    setRole(r)
    setNom(n)
    chargerActifs().then(() => setActifsCharges(true))
  }

  const handleLogout = () => {
    localStorage.removeItem('capnex_token')
    localStorage.removeItem('capnex_user')
    setRole(null)
    setNom('')
    setPage('dashboard')
  }

  if (!role) return <Login onLogin={handleLogin} />

  if (!actifsCharges) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-emerald-400 text-2xl font-black">CAPNEX PRO</div>
          <div className="text-gray-500 text-sm">Chargement des cours BRVM...</div>
        </div>
      </div>
    )
  }

  const navUser = [
    { id: 'dashboard', label: '📊', title: 'Dashboard' },
    { id: 'portefeuille', label: '💼', title: 'Portefeuille' },
    { id: 'performance', label: '📈', title: 'Perf' },
    { id: 'simulateur', label: '🧮', title: 'Simul.' },
    { id: 'graphiques', label: '📉', title: 'Charts' },
    {
      id: 'alertes',
      label: (
        <div className="relative inline-block">
          <span>🔔</span>
          {nonLues > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
              {nonLues > 9 ? '9+' : nonLues}
            </span>
          )}
        </div>
      ),
      title: 'Alertes'
    },
    // { id: 'notes', label: '📝', title: 'Notes' },
    { id: 'mentions', label: 'ℹ', title: 'Infos' },
    { id: 'formation', label: '✏️', title: 'Formation' },
  ]

  const navAnalyste = [
    ...navUser,
    { id: 'scanner', label: '🔍', title: 'Scanner' },
    { id: 'analyse', label: '🧠', title: 'Analyse' },
  ]

  const nav = role === 'analyste' ? navAnalyste : navUser

  return (
    <div>
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-gray-900 border-b border-gray-800 z-40 px-4 py-2">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
        <span className="text-orange-400 font-black text-sm">CAPNEX PRO</span>
          <div className="flex items-center gap-3">
            <span className="text-gray-500 text-xs">{nom}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${role === 'analyste' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
              {role === 'analyste' ? 'ANALYSTE' : 'USER'}
            </span>
            <button onClick={handleLogout} className="text-gray-600 hover:text-red-400 text-xs transition-colors">
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      {/* Nav bottom */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-50">
        <div className="flex overflow-x-auto">
          {nav.map(n => (
            <button
              key={n.id}
              onClick={() => setPage(n.id as Page)}
              className={`flex-1 min-w-[52px] py-2 flex flex-col items-center gap-0.5 transition-colors ${page === n.id ? 'text-emerald-400' : 'text-gray-600 hover:text-gray-400'}`}
            >
              <span className="text-base">{n.label as React.ReactNode}</span>
              <span className="text-[9px] font-bold">{n.title}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Pages */}
      <div className="pt-12 pb-16">
        {(() => {
          if (page === 'dashboard') return <Dashboard />
          if (page === 'portefeuille') return <Portefeuille />
          if (page === 'performance') return <Performance />
          if (page === 'simulateur') return <Simulateur />
          if (page === 'graphiques') return <Graphiques />
          if (page === 'alertes') return <Alertes />
          // if (page === 'notes') return <Notes />
          if (page === 'mentions') return <Mentions />
          if (page === 'scanner' && role === 'analyste') return <Scanner />
          if (page === 'analyse' && role === 'analyste') return <AnalysePrivee />
          if (page === 'formation') return <Formation />
          return <Dashboard />
        })()}
      </div>
    </div>
  )
}