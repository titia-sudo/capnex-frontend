const BASE_URL = 'https://capnex-backend.onrender.com/api'

function getToken(): string | null {
  return localStorage.getItem('capnex_token')
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(error || `Erreur ${res.status}`)
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

  register: (nom: string, email: string, password: string, role: string) =>
    request<{ token: string; email: string; nom: string; role: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nom, email, password, role }),
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
export const tradesAPI = {
  getAll: () => request<any[]>('/trades'),
  ajouter: (data: any) =>
    request<any>('/trades', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  cloturer: (id: number, prixOut: number) =>
    request<any>(`/trades/${id}/cloturer`, {
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

