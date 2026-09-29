import { useEffect, useState } from 'react'

import {
  adminAPI,
  type AdminUserResponse,
} from '../../service/api'

export default function Users() {
  const [users, setUsers] =
    useState<AdminUserResponse[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const [processingUserId, setProcessingUserId] =
    useState<number | null>(null)

  /*
   * Chargement initial des utilisateurs
   */
  useEffect(() => {
    const chargerUtilisateurs = async () => {
      try {
        setLoading(true)
        setError('')

        const data =
          await adminAPI.getUsers()

        setUsers(data)

      } catch (e) {

        setError(
          e instanceof Error
            ? e.message
            : 'Impossible de charger les utilisateurs'
        )

      } finally {

        setLoading(false)
      }
    }

    void chargerUtilisateurs()

  }, [])

  /*
   * Active ou désactive un utilisateur
   */
  const changerStatutUtilisateur = async (
    user: AdminUserResponse
  ) => {

    try {

      setProcessingUserId(user.id)
      setError('')

      if (user.actif) {

        await adminAPI.disableUser(
          user.id
        )

      } else {

        await adminAPI.enableUser(
          user.id
        )
      }

      /*
       * Mise à jour locale immédiate.
       * Pas besoin de refaire GET /admin/users.
       */
      setUsers(currentUsers =>
        currentUsers.map(item =>
          item.id === user.id
            ? {
                ...item,
                actif: !item.actif,
              }
            : item
        )
      )

    } catch (e) {

      setError(
        e instanceof Error
          ? e.message
          : "Impossible de modifier l'utilisateur"
      )

    } finally {

      setProcessingUserId(null)
    }
  }

  /*
   * Chargement
   */
  if (loading) {
    return (
      <p className="text-gray-500">
        Chargement des utilisateurs...
      </p>
    )
  }

  return (
    <div>

      {/* TITRE */}

      <div className="mb-6">

        <h1 className="text-2xl font-black text-white">
          Utilisateurs
        </h1>

        <p className="text-gray-500 text-sm mt-1">
          Gestion des comptes CAPNEX
        </p>

      </div>

      {/* ERREUR */}

      {error && (
        <div className="mb-5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4">
          {error}
        </div>
      )}

      {/* AUCUN UTILISATEUR */}

      {users.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">

          <p className="text-gray-500">
            Aucun utilisateur trouvé.
          </p>

        </div>
      )}

      {/* LISTE */}

      <div className="space-y-3">

        {users.map(user => (

          <div
            key={user.id}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-4"
          >

            {/* INFORMATIONS PRINCIPALES */}

            <div className="flex items-start justify-between gap-4">

              <div>

                <h3 className="text-white font-bold">
                  {user.nom}
                </h3>

                <p className="text-gray-500 text-sm mt-1">
                  {user.email}
                </p>

                <p className="text-gray-600 text-xs mt-2">
                  Inscrit le {formatDate(user.createdAt)}
                </p>

              </div>

              {/* BADGES */}

              <div className="flex flex-wrap gap-2 justify-end">

                {/* ROLE */}

                <span
                  className={`text-xs font-bold px-2 py-1 rounded-lg ${
                    user.role === 'ADMIN'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}
                >
                  {user.role}
                </span>

                {/* VIP */}

                {user.role !== 'ADMIN' && (
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-lg ${
                      user.vip
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-gray-800 text-gray-500'
                    }`}
                  >
                    {user.vip
                      ? 'VIP'
                      : 'FREE'}
                  </span>
                )}

                {/* STATUT */}

                <span
                  className={`text-xs font-bold px-2 py-1 rounded-lg ${
                    user.actif
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {user.actif
                    ? 'ACTIF'
                    : 'INACTIF'}
                </span>

              </div>

            </div>

            {/* ACTION */}

            {user.role !== 'ADMIN' && (

              <div className="mt-4 pt-4 border-t border-gray-800">

                <button
                  type="button"
                  disabled={
                    processingUserId === user.id
                  }
                  onClick={() =>
                    void changerStatutUtilisateur(user)
                  }
                  className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 ${
                    user.actif
                      ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                  }`}
                >

                  {processingUserId === user.id
                    ? 'Traitement...'
                    : user.actif
                      ? 'Désactiver le compte'
                      : 'Réactiver le compte'}

                </button>

              </div>

            )}

          </div>

        ))}

      </div>

    </div>
  )
}

function formatDate(
  date: string
): string {

  return new Intl.DateTimeFormat(
    'fr-FR',
    {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }
  ).format(
    new Date(date)
  )
}