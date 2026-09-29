import { useState } from 'react'

import Dashboard from './AdminDashboard'
import Users from './AdminUsers'

type AdminPage =
  | 'dashboard'
  | 'users'

export default function AdminLayout() {

  const [page, setPage] =
    useState<AdminPage>('dashboard')

  return (

    <div className="min-h-screen bg-gray-950 text-white">

      <div className="border-b border-gray-800 bg-gray-900">

        <div className="max-w-6xl mx-auto flex gap-3 p-4">

          <button
            onClick={() => setPage('dashboard')}
          >
            📊 Dashboard
          </button>

          <button
            onClick={() => setPage('users')}
          >
            👥 Utilisateurs
          </button>

        </div>

      </div>

      <div className="max-w-6xl mx-auto p-6">

        {page === 'dashboard' &&
          <Dashboard />
        }

        {page === 'users' &&
          <Users />
        }

      </div>

    </div>

  )

}