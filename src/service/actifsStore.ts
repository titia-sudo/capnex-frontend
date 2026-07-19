import { actifsAPI } from './api'

let cache: any[] = []

export async function chargerActifs(): Promise<any[]> {
  if (cache.length > 0) return cache
  try {
    cache = await actifsAPI.getAll()
    return cache
  } catch (e) {
    console.error('Erreur chargement actifs:', e)
    return []
  }
}

export function getActifsCache(): any[] {
  return cache
}

export function getPrixActuel(ticker: string): number {
  return cache.find(a => a.ticker === ticker)?.prix ?? 0
}

export function getSizingActif(ticker: string): number {
  return cache.find(a => a.ticker === ticker)?.sizing ?? 0
}

// Mise à jour du cache via WebSocket
export function mettreAJourPrix(prix: Record<string, number>) {
  cache = cache.map(a => {
    if (prix[a.ticker] !== undefined) {
      return { ...a, prix: prix[a.ticker] }
    }
    return a
  })
}