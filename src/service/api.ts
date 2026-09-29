const BASE_URL = 'https://capnex-backend.onrender.com/api'
// const BASE_URL = 'http://localhost:8080/api'

function getToken(): string | null {
  return localStorage.getItem('capnex_token')
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  console.log('TOKEN ENVOYÉ :', token)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers })

  if (!res.ok) {
    const contentType = res.headers.get('content-type')

    if (contentType?.includes('application/json')) {
      const errorData = await res.json()

      throw new Error(
        errorData.message ||
        errorData.error ||
        `Erreur ${res.status}`
      )
    }

    const errorText = await res.text()

    throw new Error(
      errorText || `Erreur ${res.status}`
    )
  }

  if (res.status === 204) return null as T
  return res.json()
}

// ── AUTH ──
export const authAPI = {
  login: (email: string, password: string) =>
    request<{ token: string; email: string; nom: string; role: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (
    nom: string,
    email: string,
    password: string
  ) =>
    request<{
      token: string
      email: string
      nom: string
      role: string
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        nom,
        email,
        password,
      }),
    }),
}

// ── ACTIFS ──
export const actifsAPI = {
  getAll: () => request<any[]>('/actifs'),
  getByTicker: (ticker: string) => request<any>(`/actifs/${ticker}`),
  update: (ticker: string, data: any) =>
    request<any>(`/actifs/${ticker}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  historique: (ticker: string, jours: number) =>
    request<{ date: string; prix: number }[]>(`/actifs/${ticker}/historique?jours=${jours}`),

}

// ── PORTEFEUILLE ──
export const portefeuilleAPI = {
  getAll: () => request<any[]>('/portefeuille'),
  creer: (data: any) =>
    request<any>('/portefeuille', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  supprimer: (id: number) =>
    request<void>(`/portefeuille/${id}`, { method: 'DELETE' }),
  getPositions: (id: number) =>
    request<any[]>(`/portefeuille/${id}/positions`),

  // ── POSITIONS ──
  ajouterPosition: (data: any) =>
    request<any>('/portefeuille/position', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  supprimerPosition: (id: number) =>
    request<void>(`/portefeuille/position/${id}`, { method: 'DELETE' }),
  cloturer: (id: number, prixSortie: number) =>
    request<any>(`/portefeuille/position/${id}/cloturer`, {
      method: 'POST',
      body: JSON.stringify({ prixSortie }),
    }),
}
// ── TRADES ──
export type TradeStatus = 'OPEN' | 'CLOSED'

export interface TradeResponse {
  id: number
  ticker: string

  dateIn: string | null

  prixIn: number | null
  prixOut: number | null

  capital: number | null
  sizing: string | null

  statut: TradeStatus

  pnl: number | null
  perf: number | null

  createdAt: string | null
}
export const tradesAPI = {
  getAll: () => request<TradeResponse[]>('/trades'),
  ajouter: (data: any) =>
    request<TradeResponse>('/trades', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  cloturer: (id: number, prixOut: number) =>
    request<TradeResponse>(`/trades/${id}/cloturer`, {
      method: 'PUT',
      body: JSON.stringify({ prixOut }),
    }),
  supprimer: (id: number) =>
    request<void>(`/trades/${id}`, { method: 'DELETE' }),
}
export const alertesAPI = {
  getAll: () => request<any[]>('/alertes'),
  getCount: () => request<{ nonLues: number }>('/alertes/count'),
  marquerLu: (id: number) => request<void>(`/alertes/${id}/lu`, { method: 'PUT' }),
  toutMarquerLu: () => request<void>('/alertes/tout-lu', { method: 'PUT' }),
  supprimer: (id: number) => request<void>(`/alertes/${id}`, { method: 'DELETE' }),
}

// ── SOUSCRIPTIONS ──

export type SubscriptionType =
  | 'FREE'
  | 'VIP_MONTHLY'
  | 'VIP_YEARLY'

export type SubscriptionStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'CANCELLED'

export interface SubscriptionPlan {
  type: SubscriptionType
  price: number
  durationInMonths: number
}

export interface SubscriptionResponse {
  id: number
  userId: number
  type: SubscriptionType
  status: SubscriptionStatus
  startDate: string | null
  endDate: string | null
  createdAt: string
  vip: boolean
  valid: boolean
}

export const subscriptionsAPI = {
  getPlans: () =>
    request<SubscriptionPlan[]>('/subscriptions/plans'),

  creer: (type: SubscriptionType) =>
    request<SubscriptionResponse>('/subscriptions/me', {
      method: 'POST',
      body: JSON.stringify({ type }),
    }),

  getCurrent: () =>
    request<SubscriptionResponse>('/subscriptions/me'),

  hasVipAccess: () =>
    request<boolean>('/subscriptions/me/vip-access'),

  disableUser: (id: number) =>
    request<void>(
      `/admin/users/${id}/disable`,
      { method: 'PUT' }
    ),

  enableUser: (id: number) =>
    request<void>(
      `/admin/users/${id}/enable`,
      { method: 'PUT' }
    ),
}


// ── PAIEMENTS ──

export type PaymentProvider =
  | 'ORANGE_MONEY'
  | 'VISA'

export type PaymentStatus =
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED'

export interface PaymentRequest {
  provider: PaymentProvider
  phoneNumber: string
  otp: string
}

export interface PaymentResponse {
  id: number
  subscriptionId: number
  provider: PaymentProvider
  status: PaymentStatus
  paymentReference: string
  providerReference: string | null
  providerStatus: string | null
  providerMessage: string | null
  amount: number
  currency: string
  payerPhone: string | null
  createdAt: string
  paidAt: string | null
}
export interface AdminDashboardResponse {
  totalUsers: number
  activeSubscriptions: number
  pendingSubscriptions: number
  successfulPayments: number
  failedPayments: number
  totalRevenue: number
}
export interface AdminUserResponse {
  id: number
  nom: string
  email: string
  role: string
  actif: boolean
  vip: boolean
  createdAt: string
}


export const adminAPI = {
  getDashboard: () => request<AdminDashboardResponse>('/admin/dashboard'),

  getSubscriptionPlans: () =>
    request<SubscriptionPlanAdmin[]>(
      '/admin/subscription-plans'
    ),

  updateSubscriptionPlan: (
    type: SubscriptionPlanAdmin['type'],
    data: SubscriptionPlanUpdate
  ) =>
    request<SubscriptionPlanAdmin>(
      `/admin/subscription-plans/${type}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    ),

  getUsers: () => request<AdminUserResponse[]>('/admin/users'),

  disableUser: (id: number) => request<void>(`/admin/users/${id}/disable`,
      {
        method: 'PUT',
      }
    ),

  enableUser: (id: number) =>
    request<void>(
      `/admin/users/${id}/enable`,
      {
        method: 'PUT',
      }
    ),
}

export const paymentsAPI = {
  initialize: (data: PaymentRequest) =>
    request<PaymentResponse>('/payments/initialize', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getByReference: (paymentReference: string) =>
    request<PaymentResponse>(
      `/payments/reference/${encodeURIComponent(paymentReference)}`
    ),

  checkStatus: (paymentReference: string) =>
    request<PaymentResponse>(
      `/payments/reference/${encodeURIComponent(
        paymentReference
      )}/status`
    ),

  getMyPayments: () =>
    request<PaymentResponse[]>('/payments/me'),

}

export type SimulationPosition = {
  ticker: string
  nom: string
  sizing: number
  prix: number
  lots: number
  montant: number
}

export type SimulationResponse = {
  capitalDepart: number
  unite1X: number
  positions: SimulationPosition[]
  capitalAlloue: number
  capitalRestant: number
  totalPositions: number
}

export const simulationAPI = {
  simuler: (capital: number) =>
    request<SimulationResponse>('/simulation', {
      method: 'POST',
      body: JSON.stringify({
        capital,
      }),
    }),

   simulerOptimisee: (capital: number) =>
    request<SimulationOptimiseeResponse>('/simulation/optimisee', {
      method: 'POST',
      body: JSON.stringify({
        capital,
      }),
    }),
}

export type SimulationOptimiseePosition = {
  ticker: string
  nom: string
  sizingEffectif: number
  prix: number
  quantite: number
  montant: number
}

export type SimulationOptimiseeResponse = {
  capitalDepart: number
  reserve: number
  capitalInvestissable: number
  capitalAlloue: number
  reliquatArrondi: number
  capitalNonDeploie: number
  cashRestant: number
  nombreLignesCible: number
  nombreLignesRetenues: number
  positions: SimulationOptimiseePosition[]
}

export type SubscriptionPlanAdmin = {
  id: number
  type: 'FREE' | 'VIP_MONTHLY' | 'VIP_YEARLY'
  price: number
  currency: string
  durationInMonths: number
  active: boolean
}

export type SubscriptionPlanUpdate = {
  price: number
  currency: string
  durationInMonths: number
  active: boolean
}

