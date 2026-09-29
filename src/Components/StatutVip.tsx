interface StatutVipProps {
  vipActif: boolean
  vipCharge: boolean
  onOpenSubscription: () => void
}

export default function StatutVip({
  vipActif,
  vipCharge,
  onOpenSubscription,
}: StatutVipProps) {

  /*
   * Tant que le statut VIP est en cours
   * de chargement, on n'affiche rien.
   */
  if (!vipCharge) {
    return null
  }

  /*
   * Utilisateur VIP.
   */
  if (vipActif) {
    return (
      <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400">
        VIP ACTIF
      </span>
    )
  }

  /*
   * Utilisateur FREE.
   */
  return (
    <button
      type="button"
      onClick={onOpenSubscription}
      className="text-xs font-bold px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors"
    >
      OFFRES VIP
    </button>
  )
}