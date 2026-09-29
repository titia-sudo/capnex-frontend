import { useEffect, useState } from 'react'
import {
  adminAPI,
  type AdminDashboardResponse,
  type SubscriptionPlanAdmin,
} from '../../service/api'

export default function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardResponse | null>(null)
  const [plans, setPlans] = useState<SubscriptionPlanAdmin[]>([])
  const [savingPlan, setSavingPlan] = useState<string | null>(null)
  const [planMessage, setPlanMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const chargerDashboard = async () => {
      try {
        setLoading(true)
        setError('')

        const [dashboardResult, plansResult] =
          await Promise.all([
            adminAPI.getDashboard(),
            adminAPI.getSubscriptionPlans(),
          ])

        setData(dashboardResult)
        setPlans(plansResult)

      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : 'Impossible de charger le dashboard'
        )
      } finally {
        setLoading(false)
      }
    }

    void chargerDashboard()
  }, [])

  const modifierPlan = async (
    plan: SubscriptionPlanAdmin
  ) => {
    try {
      setSavingPlan(plan.type)
      setPlanMessage('')
      setError('')

      const updated =
        await adminAPI.updateSubscriptionPlan(
          plan.type,
          {
            price: plan.price,
            currency: plan.currency,
            durationInMonths: plan.durationInMonths,
            active: plan.active,
          }
        )

      setPlans(current =>
        current.map(p =>
          p.type === updated.type
            ? updated
            : p
        )
      )

      setPlanMessage(
        `Plan ${formatPlanName(plan.type)} mis à jour.`
      )
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Impossible de modifier le plan'
      )
    } finally {
      setSavingPlan(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-500">
          Chargement du tableau de bord...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-6">
        <div className="max-w-5xl mx-auto bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-400">
          {error}
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-black text-orange-400">
            Administration
          </h1>

          <p className="text-gray-500 text-sm mt-1">
            Vue globale de l'activité CAPNEX
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* ========================= */}
        {/* STATISTIQUES */}
        {/* ========================= */}

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">

          <StatCard
            icon="👥"
            label="Utilisateurs"
            value={data.totalUsers.toString()}
          />

          <StatCard
            icon="👑"
            label="VIP actifs"
            value={data.activeSubscriptions.toString()}
          />

          <StatCard
            icon="⏳"
            label="Souscriptions en attente"
            value={data.pendingSubscriptions.toString()}
          />

          <StatCard
            icon="✅"
            label="Paiements réussis"
            value={data.successfulPayments.toString()}
          />

          <StatCard
            icon="❌"
            label="Paiements échoués"
            value={data.failedPayments.toString()}
          />

          <StatCard
            icon="💰"
            label="Revenus"
            value={`${formatAmount(data.totalRevenue)} XOF`}
          />

        </div>

        {/* ========================= */}
        {/* PLANS D'ABONNEMENT */}
        {/* ========================= */}

        <div className="mt-8">

          <div className="mb-4">
            <h2 className="text-xl font-black text-white">
              Plans d'abonnement
            </h2>

            <p className="text-gray-500 text-sm mt-1">
              Gestion des tarifs et durées des abonnements CAPNEX
            </p>
          </div>

          {planMessage && (
            <div className="mb-4 bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-green-400 text-sm">
              {planMessage}
            </div>
          )}

          <div className="space-y-3">

            {plans.map(plan => (
              <div
                key={plan.type}
                className="bg-gray-900 border border-gray-800 rounded-xl p-4"
              >

                <div className="grid lg:grid-cols-[1fr_130px_90px_120px_100px_auto] gap-3 items-end">

                  <div>
                    <p className="font-bold text-white">
                      {formatPlanName(plan.type)}
                    </p>

                    <p className="text-gray-500 text-xs mt-1">
                      {plan.type}
                    </p>
                  </div>

                  <div>
                    <label className="text-gray-500 text-xs">
                      Prix
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={plan.price}
                      onChange={e => {
                        const price = Number(e.target.value)

                        setPlans(current =>
                          current.map(p =>
                            p.type === plan.type
                              ? { ...p, price }
                              : p
                          )
                        )
                      }}
                      className="mt-1 w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-gray-500 text-xs">
                      Devise
                    </label>

                    <input
                      type="text"
                      maxLength={3}
                      value={plan.currency}
                      onChange={e => {
                        const currency =
                          e.target.value.toUpperCase()

                        setPlans(current =>
                          current.map(p =>
                            p.type === plan.type
                              ? { ...p, currency }
                              : p
                          )
                        )
                      }}
                      className="mt-1 w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-gray-500 text-xs">
                      Durée (mois)
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={plan.durationInMonths}
                      onChange={e => {
                        const durationInMonths =
                          Number(e.target.value)

                        setPlans(current =>
                          current.map(p =>
                            p.type === plan.type
                              ? {
                                ...p,
                                durationInMonths,
                              }
                              : p
                          )
                        )
                      }}
                      className="mt-1 w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <label className="flex items-center gap-2 pb-2">
                    <input
                      type="checkbox"
                      checked={plan.active}
                      onChange={e => {
                        const active = e.target.checked

                        setPlans(current =>
                          current.map(p =>
                            p.type === plan.type
                              ? { ...p, active }
                              : p
                          )
                        )
                      }}
                    />

                    <span
                      className={
                        plan.active
                          ? 'text-green-400 text-sm'
                          : 'text-gray-500 text-sm'
                      }
                    >
                      {plan.active
                        ? 'Actif'
                        : 'Inactif'}
                    </span>
                  </label>
                  <button
                    type="button"
                    disabled={savingPlan === plan.type}
                    onClick={() => void modifierPlan(plan)}
                    className="h-[42px] bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-black text-sm font-bold px-4 rounded-xl"
                  >
                    {savingPlan === plan.type
                      ? 'Enregistrement...'
                      : 'Enregistrer'}
                  </button>
                </div>

              </div>
            ))}

          </div>
        </div>

      </div>

    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: string
  label: string
  value: string
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center gap-2">
        <span className="text-lg">
          {icon}
        </span>

        <p className="text-gray-500 text-xs">
          {label}
        </p>
      </div>

      <p className="text-white text-xl font-black mt-2">
        {value}
      </p>
    </div>
  )
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount)
}

function formatPlanName(
  type: SubscriptionPlanAdmin['type']
): string {
  switch (type) {
    case 'FREE':
      return 'Gratuit'

    case 'VIP_MONTHLY':
      return 'VIP Mensuel'

    case 'VIP_YEARLY':
      return 'VIP Annuel'
  }
}