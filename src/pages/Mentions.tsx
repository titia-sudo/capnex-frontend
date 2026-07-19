export default function Mentions() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-black text-gray-400">Mentions légales</h1>
          <p className="text-gray-500 text-xs">CAPNEX PRO v3.0</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6 text-sm text-gray-400">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
          <h2 className="text-white font-bold text-base">Avertissement</h2>
          <p>CAPNEX PRO est un outil d'aide à la décision d'investissement. Les informations et analyses fournies ne constituent pas des conseils en investissement.</p>
          <p>Tout investissement en bourse comporte des risques, y compris la perte totale du capital investi.</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
          <h2 className="text-white font-bold text-base">Propriété intellectuelle</h2>
          <p>La Formule D.W, l'algorithme de scoring et le système de sizing dynamique sont des propriétés intellectuelles exclusives protégées par accord de confidentialité (NDA).</p>
          <p>Toute reproduction ou diffusion est strictement interdite.</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
          <h2 className="text-white font-bold text-base">Données</h2>
          <p>Les données sont stockées localement sur votre appareil. Aucune donnée personnelle n'est transmise à des serveurs tiers, à l'exception des analyses IA via l'API Anthropic.</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-2">
          <h2 className="text-white font-bold text-base">Informations</h2>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between"><span className="text-gray-600">Produit</span><span>CAPNEX PRO v3.0</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Marché</span><span>BRVM · Zone UEMOA · 8 États</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Actifs couverts</span><span>47 titres BRVM</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Version</span><span>3.0 — Sizing Dynamique</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Année</span><span>2026</span></div>
          </div>
        </div>

        <p className="text-center text-gray-700 text-xs pb-4">
          © 2026 CAPNEX PRO · Tous droits réservés · Confidentiel 
        </p>
      </div>
    </div>
  )
}