import React from 'react'

type Page =
  | 'dashboard'
  | 'scanner'
  | 'portefeuille'
  | 'analyse'
  | 'performance'
  | 'alertes'
  | 'mentions'
  | 'simulateur'
  | 'graphiques'
  | 'formation'
  | 'subscription'
  | 'admin'

type Role = 'user' | 'admin'

interface NavigationItem {
  id: Page
  label: React.ReactNode
  title: string
}

interface BottomNavigationProps {
  role: Role
  vipActif: boolean
  page: Page
  nonLues: number
  onNavigate: (page: Page) => void
}

export default function BottomNavigation({
  role,
  vipActif,
  page,
  nonLues,
  onNavigate,
}: BottomNavigationProps) {

  const navUser: NavigationItem[] = [
    {
      id: 'dashboard',
      label: '📊',
      title: 'Dashboard',
    },
    {
      id: 'graphiques',
      label: '📉',
      title: 'Charts',
    },
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
      title: 'Alertes',
    },
    {
      id: 'mentions',
      label: 'ℹ',
      title: 'Infos',
    },
    {
      id: 'formation',
      label: '✏️',
      title: 'Formation',
    },
  ]

  const navVip: NavigationItem[] = [
    ...navUser,

    {
      id: 'portefeuille',
      label: '💼',
      title: 'Portefeuille',
    },

    {
      id: 'performance',
      label: '📈',
      title: 'Perf',
    },

    {
      id: 'simulateur',
      label: '🧮',
      title: 'Simul.',
    },

    {
      id: 'scanner',
      label: '🔍',
      title: 'Scanner',
    },

    {
      id: 'analyse',
      label: '🧠',
      title: 'Analyse',
    },
  ]

  const navAdmin: NavigationItem[] = [
    {
      id: 'admin',
      label: '⚙️',
      title: 'Admin',
    },
  ]

  const navigation =
    role === 'admin'
      ? navAdmin
      : vipActif
        ? navVip
        : navUser
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-50">

      <div className="flex overflow-x-auto">

        {navigation.map(item => (

          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            className={`flex-1 min-w-[52px] py-2 flex flex-col items-center gap-0.5 transition-colors ${
              page === item.id
                ? 'text-emerald-400'
                : 'text-gray-600 hover:text-gray-400'
            }`}
          >
            <span className="text-base">
              {item.label}
            </span>

            <span className="text-[9px] font-bold">
              {item.title}
            </span>

          </button>

        ))}

      </div>

    </nav>
  )
}