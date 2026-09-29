import { useEffect, useState } from 'react'

import Header from './Components/Header'
import BottomNavigation from './Components/BottomNavigation'
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
import Subscription from './pages/Subscription'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminLayout from './pages/admin/AdminLayout'

import {
  chargerActifs,
  mettreAJourPrix,
} from './service/actifsStore'

import {
  connecterWebSocket,
  deconnecterWebSocket,
  onPrixUpdate,
  onAlerteUpdate,
} from './service/websocket'

import {
  alertesAPI,
  subscriptionsAPI,
  type SubscriptionResponse,
} from './service/api'

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

export default function App() {

  /*
   * ============================
   * UTILISATEUR CONNECTÉ
   * ============================
   */

  const [role, setRole] = useState<Role | null>(() => {
    const user = localStorage.getItem('capnex_user')

    if (!user) {
      return null
    }

    try {
      const parsed = JSON.parse(user)

      return parsed.role === 'ADMIN'
        ? 'admin'
        : 'user'

    } catch {
      return null
    }
  })

  const [nom, setNom] = useState<string>(() => {
    const user = localStorage.getItem('capnex_user')

    if (!user) {
      return ''
    }

    try {
      return JSON.parse(user).nom ?? ''
    } catch {
      return ''
    }
  })

  /*
   * ============================
   * NAVIGATION
   * ============================
   */

  const [page, setPage] = useState<Page>(() => {
    const user = localStorage.getItem('capnex_user')

    if (!user) {
      return 'dashboard'
    }

    try {
      const parsed = JSON.parse(user)

      return parsed.role === 'ADMIN'
        ? 'admin'
        : 'dashboard'
    } catch {
      return 'dashboard'
    }
  })

  /*
   * ============================
   * DONNÉES GLOBALES
   * ============================
   */

  const [actifsCharges, setActifsCharges] =
    useState(false)

  const [, forceUpdate] =
    useState(0)

  const [nonLues, setNonLues] =
    useState(0)

  /*
   * ============================
   * ABONNEMENT
   * ============================
   */

  const [vipActif, setVipActif] =
    useState(false)

  const [vipCharge, setVipCharge] =
    useState(false)

  const [
    currentSubscription,
    setCurrentSubscription,
  ] = useState<SubscriptionResponse | null>(null)

  /*
   * ============================
   * 1. CHARGEMENT DES ACTIFS
   * ============================
   */

  useEffect(() => {

    const initialiserActifs = async () => {
      try {

        await chargerActifs()

        setActifsCharges(true)

      } catch (error) {

        console.error(
          'Impossible de charger les actifs',
          error
        )
      }
    }

    void initialiserActifs()

  }, [])

  /*
   * ============================
   * 2. CHARGEMENT ABONNEMENT
   * ============================
   */

  useEffect(() => {

    if (!role) {

      setVipActif(false)
      setVipCharge(false)
      setCurrentSubscription(null)

      return
    }

    /*
     * Un ADMIN n'a pas besoin
     * d'une souscription VIP.
     */
    if (role === 'admin') {

      setVipActif(false)
      setVipCharge(true)
      setCurrentSubscription(null)

      return
    }

    const chargerAbonnement = async () => {

      try {

        setVipCharge(false)

        const subscription =
          await subscriptionsAPI.getCurrent()

        setCurrentSubscription(
          subscription
        )

        setVipActif(
          subscription.valid
        )

      } catch {

        /*
         * Aucun abonnement :
         * utilisateur FREE.
         */
        setCurrentSubscription(null)
        setVipActif(false)

      } finally {

        setVipCharge(true)
      }
    }

    void chargerAbonnement()

  }, [role])

  /*
   * ============================
   * 3. ALERTES + WEBSOCKET
   * ============================
   */

  useEffect(() => {

    if (!role) {
      return
    }

    const chargerAlertes = async () => {

      try {

        const data =
          await alertesAPI.getCount()

        setNonLues(
          data.nonLues
        )

      } catch (error) {

        console.error(
          'Impossible de charger les alertes',
          error
        )
      }
    }

    void chargerAlertes()

    connecterWebSocket()

    const unsubPrix =
      onPrixUpdate(prix => {

        mettreAJourPrix(prix)

        forceUpdate(
          valeur => valeur + 1
        )
      })

    const unsubAlerte =
      onAlerteUpdate(() => {

        void chargerAlertes()
      })

    return () => {

      unsubPrix()
      unsubAlerte()

      deconnecterWebSocket()
    }

  }, [role])

  /*
   * ============================
   * LOGIN
   * ============================
   */

  const handleLogin = (
    nouveauRole: Role,
    _token: string,
    nouveauNom: string
  ) => {

    setRole(nouveauRole)

    setNom(nouveauNom)

    /*
     * Un ADMIN arrive directement
     * sur son tableau d'administration.
     */
    setPage(
      nouveauRole === 'admin'
        ? 'admin'
        : 'dashboard'
    )
  }

  /*
   * ============================
   * LOGOUT
   * ============================
   */

  const handleLogout = () => {

    localStorage.removeItem(
      'capnex_token'
    )

    localStorage.removeItem(
      'capnex_user'
    )

    setRole(null)
    setNom('')

    setPage('dashboard')

    setVipActif(false)
    setVipCharge(false)

    setCurrentSubscription(null)

    setNonLues(0)
  }

  const actualiserAbonnement = async (): Promise<boolean> => {

    try {

      const subscription =
        await subscriptionsAPI.getCurrent()

      setCurrentSubscription(subscription)

      setVipActif(subscription.valid)

      return subscription.valid

    } catch (error) {

      console.error(
        "Impossible d'actualiser l'abonnement",
        error
      )

      return false
    }
  }

  /*
   * ============================
   * UTILISATEUR NON CONNECTÉ
   * ============================
   */

  if (!role) {
    return (
      <Login
        onLogin={handleLogin}
      />
    )
  }

  /*
   * ============================
   * CHARGEMENT INITIAL
   * ============================
   */

  if (!actifsCharges) {

    return (

      <div className="min-h-screen bg-gray-950 flex items-center justify-center">

        <div className="text-center space-y-3">

          <div className="text-emerald-400 text-2xl font-black">
            CAPNEX PRO
          </div>

          <div className="text-gray-500 text-sm">
            Chargement des cours BRVM...
          </div>

        </div>

      </div>
    )
  }

  /*
   * ============================
   * AFFICHAGE
   * ============================
   */

  return (

    <div>

      {/* HEADER */}

      <Header
        nom={nom}
        role={role}
        vipActif={vipActif}
        vipCharge={vipCharge}
        onOpenSubscription={() =>
          setPage('subscription')
        }
        onLogout={handleLogout}
      />

      {/* CONTENU */}

      <div className="pt-12 pb-16">

        {(() => {

          /*
           * ADMIN
           */
          if (page === 'admin' && role === 'admin') {
            return <AdminLayout />
          }

          /*
           * Un ADMIN qui arrive sur une page
           * utilisateur retourne au dashboard admin.
           */
          if (role === 'admin') {
            return <AdminDashboard />
          }

          /*
           * DASHBOARD
           */
          if (page === 'dashboard') {
            return <Dashboard />
          }

          /*
           * GRAPHIQUES
           */
          if (page === 'graphiques') {
            return <Graphiques />
          }

          /*
           * ALERTES
           */
          if (page === 'alertes') {
            return <Alertes />
          }

          /*
           * INFOS
           */
          if (page === 'mentions') {
            return <Mentions />
          }

          /*
           * FORMATION
           */
          if (page === 'formation') {
            return <Formation />
          }

          /*
           * MON ABONNEMENT
           */
          if (page === 'subscription') {

            return (

              <Subscription
                currentSubscription={
                  currentSubscription
                }

                onBack={() =>
                  setPage('dashboard')
                }

                onSubscriptionActivated={async () => {

                  const actif =
                    await actualiserAbonnement()

                  if (actif) {
                    setPage('portefeuille')
                  }
                }}
              />

            )
          }

          /*
           * ============================
           * PAGES VIP
           * ============================
           */

          if (
            page === 'portefeuille'
            && vipActif
          ) {

            return (

              <Portefeuille
                onOpenSubscription={() =>
                  setPage('subscription')
                }
              />

            )
          }

          if (
            page === 'performance'
            && vipActif
          ) {
            return <Performance />
          }

          if (
            page === 'simulateur'
            && vipActif
          ) {
            return <Simulateur />
          }

          if (
            page === 'scanner'
            && vipActif
          ) {
            return <Scanner />
          }

          if (
            page === 'analyse'
            && vipActif
          ) {
            return <AnalysePrivee />
          }

          /*
           * Si un utilisateur FREE arrive
           * malgré tout sur une page VIP,
           * on lui affiche les offres.
           */
          if (
            page === 'portefeuille'
            || page === 'performance'
            || page === 'simulateur'
            || page === 'scanner'
            || page === 'analyse'
          ) {

            return (

              <Subscription
                currentSubscription={
                  currentSubscription
                }

                onBack={() =>
                  setPage('dashboard')
                }

                onSubscriptionActivated={async () => {

                  const actif = await actualiserAbonnement()

                  if (actif) {
                    setPage('portefeuille')
                  }
                }}
              />

            )
          }

          return <Dashboard />

        })()}

      </div>

      {/* NAVIGATION BAS */}

      <BottomNavigation
        role={role}
        vipActif={vipActif}
        page={page}
        nonLues={nonLues}
        onNavigate={setPage}
      />

    </div>
  )
}