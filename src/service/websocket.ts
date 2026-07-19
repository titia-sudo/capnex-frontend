import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

type PrixCallback = (prix: Record<string, number>) => void
type AlerteCallback = (alerte: { ticker: string; sizing: number; type: string; message: string }) => void

let client: Client | null = null
const prixCallbacks: PrixCallback[] = []
const alerteCallbacks: AlerteCallback[] = []

export function connecterWebSocket() {
  if (client?.active) return

  client = new Client({
    webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
    reconnectDelay: 5000,

    onConnect: () => {
      console.log('WebSocket connecté')

      // Écoute les prix
      client!.subscribe('/topic/prix', (message) => {
        const prix = JSON.parse(message.body)
        prixCallbacks.forEach(cb => cb(prix))
      })

      // Écoute les alertes
      client!.subscribe('/topic/alertes', (message) => {
        const alerte = JSON.parse(message.body)
        alerteCallbacks.forEach(cb => cb(alerte))
      })
    },

    onDisconnect: () => {
      console.log('WebSocket déconnecté')
    },

    onStompError: (frame) => {
      console.error('Erreur STOMP:', frame)
    },
  })

  client.activate()
}

export function deconnecterWebSocket() {
  client?.deactivate()
  client = null
}

export function onPrixUpdate(callback: PrixCallback) {
  prixCallbacks.push(callback)
  return () => {
    const idx = prixCallbacks.indexOf(callback)
    if (idx > -1) prixCallbacks.splice(idx, 1)
  }
}

export function onAlerteUpdate(callback: AlerteCallback) {
  alerteCallbacks.push(callback)
  return () => {
    const idx = alerteCallbacks.indexOf(callback)
    if (idx > -1) alerteCallbacks.splice(idx, 1)
  }
}