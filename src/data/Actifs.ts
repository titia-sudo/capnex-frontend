export type Sizing = 1 | 2 | 3 | 4
export type Secteur = 'Banque' | 'Telecom' | 'Energie' | 'Industrie' | 'Agriculture' | 'Distribution' | 'Transport'

export interface Actif {
  // Identité
  ticker: string
  nom: string
  pays: string
  secteur: Secteur

  // Cours
  prix: number
  entree: number
  prixADate: number
  sl: number
  tp: number

  // Notation 0-10 (vraie formule)
  liq: number
  ca: number
  croiss: number
  marge: number
  per5: number
  freq: number
  notediv: number

  // Signaux (saisie manuelle analyste)
  sigM: string
  sigW: string
  sigD: string
  dailyM: number

  // Calculés automatiquement
  note: number    // ((LIQ+CA+CROISS+MARGE+PER5+FREQ)/6)×10
  score: number   // GLOBAL = NOTE×0.7 + NOTEDIV×0.3
  sizing: Sizing
}

// Anciens types gardés pour compatibilité
export type Etoile = 1 | 2 | 3
export type Croissance = 1 | 2 | 3
export type SignalOui = 'oui' | 'non'
export type SignalWeekly = 'oui' | 'moyen' | 'faible' | 'non'
export type Note = 1 | 2 | 3 | 4 | 5

export const actifs: Actif[] = []