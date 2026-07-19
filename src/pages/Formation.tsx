import { useState } from 'react'

interface Partie {
  id: number
  partie: string
  titre: string
  icon: string
  couleur: string
  textCouleur: string
  badgeCouleur: string
  citation: string
  points: string[]
  detail: string
  sousParties: string[]
}

const formations: Partie[] = [
  {
    id: 1,
    partie: 'Partie 1',
    titre: 'Éducation Financière',
    icon: '🧠',
    couleur: 'border-orange-500/40 bg-orange-500/5',
    textCouleur: 'text-orange-400',
    badgeCouleur: 'bg-orange-500/20 border-orange-500/40',
    citation: '"Comprendre l\'argent, c\'est la première étape pour ne plus en manquer."',
    points: [
      'Les 4 types d\'argent : gagné, passif, portfolio et de levier',
      'La psychologie de l\'investisseur : peur, avidité et discipline',
      'Les 3 piliers de la liberté financière',
      'La mentalité de l\'abondance vs la mentalité de la rareté',
    ],
    detail: 'L\'éducation financière est le fondement de tout investissement réussi. Sans comprendre comment fonctionne l\'argent, vous ne pouvez pas le faire travailler pour vous. Cette partie vous donne les bases mentales et conceptuelles pour aborder la bourse avec sérénité et conviction.',
    sousParties: ['Les 4 types d\'argent', 'Psychologie financière', 'Mentalité & Piliers', 'L\'hiver noir expliqué'],
  },
  {
    id: 2,
    partie: 'Partie 2',
    titre: 'Investissement',
    icon: '📈',
    couleur: 'border-blue-500/40 bg-blue-500/5',
    textCouleur: 'text-blue-400',
    badgeCouleur: 'bg-blue-500/20 border-blue-500/40',
    citation: '"Les intérêts composés sont la huitième merveille du monde."',
    points: [
      'La bourse n\'est pas un casino : comprendre le risque calculé',
      'Les intérêts composés : comment 100 000 XOF deviennent des millions',
      'Les dividendes réinvestis : la stratégie des investisseurs patients',
      'Risque vs Rendement : trouver le bon équilibre',
    ],
    detail: 'Investir en bourse, c\'est faire travailler son argent de manière intelligente. Cette partie explique les mécanismes fondamentaux de l\'investissement, du risque et de la création de richesse sur le long terme grâce aux marchés financiers africains.',
    sousParties: ['Comprendre la Bourse', 'Le risque calculé', 'Intérêts composés', 'Dividendes réinvestis'],
  },
  {
    id: 3,
    partie: 'Partie 3',
    titre: 'La BRVM',
    icon: '🌍',
    couleur: 'border-emerald-500/40 bg-emerald-500/5',
    textCouleur: 'text-emerald-400',
    badgeCouleur: 'bg-emerald-500/20 border-emerald-500/40',
    citation: '"La BRVM est notre bourse, notre richesse, notre avenir commun."',
    points: [
      'T+2 : comprendre le délai de règlement-livraison BRVM',
      'Date de détachement des dividendes : ne pas rater le couponnage',
      'FCP, Obligations, Mandats : les véhicules d\'investissement UEMOA',
      'Les 47 actifs cotés : comment les analyser et les choisir',
    ],
    detail: 'La Bourse Régionale des Valeurs Mobilières est le cœur financier de l\'UEMOA. Comprendre son fonctionnement spécifique — ses règles, ses acteurs et ses particularités — est indispensable pour tout investisseur de la zone.',
    sousParties: ['Fonctionnement BRVM', 'T+2 et règlement', 'Dividendes & Coupons', 'FCP · Obligations · Mandat'],
  },
  {
    id: 4,
    partie: 'Partie 4',
    titre: 'Analyse Technique',
    icon: '📊',
    couleur: 'border-purple-500/40 bg-purple-500/5',
    textCouleur: 'text-purple-400',
    badgeCouleur: 'bg-purple-500/20 border-purple-500/40',
    citation: '"Le graphique ne ment jamais. C\'est le marché qui parle."',
    points: [
      'Les chandeliers japonais : lire les émotions du marché en un coup d\'œil',
      'Supports et résistances institutionnels : où le prix rebondit',
      'MM200, Fibonacci et Triple Confluence M/W/D',
      'Premium, Équilibre et Discount : les zones de valeur',
    ],
    detail: 'L\'analyse technique est l\'art de lire les graphiques pour anticiper les mouvements de prix. Cette partie vous enseigne les outils utilisés par les traders professionnels pour identifier les meilleures opportunités d\'entrée et de sortie sur la BRVM.',
    sousParties: ['Chandeliers japonais', 'Supports & Résistances', 'MM 200 · Fibonacci', 'Triple Confluence M/W/D'],
  },
  {
    id: 5,
    partie: 'Partie 5',
    titre: 'Plan d\'Action',
    icon: '🎯',
    couleur: 'border-amber-500/40 bg-amber-500/5',
    textCouleur: 'text-amber-400',
    badgeCouleur: 'bg-amber-500/20 border-amber-500/40',
    citation: '"Un plan sans action est un rêve. Une action sans plan est un cauchemar."',
    points: [
      'Les 5 véhicules d\'investissement : actions, obligations, FCP, immobilier, business',
      'La règle 20/50/20/10 : allouer intelligemment ses revenus',
      'Le Plan 90 jours : transformer sa relation avec l\'argent',
      'Les 30 erreurs à éviter absolument en bourse',
    ],
    detail: 'La connaissance sans action ne vaut rien. Cette partie transforme tout ce que vous avez appris en un plan concret et actionnable. En 90 jours, vous pouvez transformer votre rapport à l\'argent et commencer à construire votre liberté financière.',
    sousParties: ['Les 5 véhicules', 'Règle 20/50/20/10', 'Plan 90 jours', '30 erreurs à éviter'],
  },
]

function ModalFormation({ partie, onClose }: { partie: Partie; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        
        {/* Header modal */}
        <div className={`p-6 border-b border-gray-800 rounded-t-2xl ${partie.couleur}`}>
          <div className="flex items-start justify-between">
            <div>
              <span className={`text-xs font-bold ${partie.textCouleur}`}>{partie.partie}</span>
              <h2 className="text-2xl font-black text-white mt-1">
                {partie.icon} {partie.titre}
              </h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
          </div>
          <p className={`text-sm italic mt-3 ${partie.textCouleur}`}>{partie.citation}</p>
        </div>

        <div className="p-6 space-y-5">
          {/* Description */}
          <p className="text-gray-300 text-sm leading-relaxed">{partie.detail}</p>

          {/* Sous-parties */}
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-3">Contenu</p>
            <div className="grid grid-cols-2 gap-2">
              {partie.sousParties.map((s, i) => (
                <div key={i} className={`border rounded-xl px-3 py-2 text-xs font-bold ${partie.badgeCouleur} ${partie.textCouleur}`}>
                  {i + 1}. {s}
                </div>
              ))}
            </div>
          </div>

          {/* Points clés */}
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-3">Points clés</p>
            <div className="space-y-2">
              {partie.points.map((p, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className={`text-xs font-black mt-0.5 flex-shrink-0 ${partie.textCouleur}`}>→</span>
                  <p className="text-gray-300 text-sm">{p}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-gray-800 text-center">
            <p className="text-gray-600 text-xs">
              Extrait de <span className="text-orange-400 font-bold">Le Bienheureux Bambou du Sahel</span>
            </p>
            <p className="text-gray-700 text-xs italic mt-1">
              "Investir en bourse : s'éloigner de l'hiver noir"
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Formation() {
  const [partieSelectionnee, setPartieSelectionnee] = useState<Partie | null>(null)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-orange-400">Formation</h1>
            <p className="text-gray-500 text-xs"></p>
          </div>
          <span className="text-xs text-orange-400 border border-orange-500/30 bg-orange-500/10 px-3 py-1 rounded-full font-bold">
            📚 5 Parties
          </span>
        </div>
      </div>

      <div className="px-8 py-6 space-y-6">

        {/* Hero */}
        <div className="bg-gradient-to-r from-orange-500/10 via-gray-900 to-blue-500/10 border border-orange-500/20 rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-orange-400 font-bold text-sm uppercase tracking-wider">Édition Mondiale</p>
              <h2 className="text-2xl font-black text-white">Le Bienheureux Bambou du Sahel</h2>
              <p className="text-gray-400 text-sm italic">La Révolution d'une Mentalité Financière à la Liberté Financière</p>
              <p className="text-orange-300 font-bold">"Investir en bourse : s'éloigner de l'hiver noir"</p>
            </div>
            <div className="text-6xl flex-shrink-0">📖</div>
          </div>
          <div className="mt-4 flex gap-3">
            <button className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-5 py-2 rounded-xl transition-colors text-sm">
              Obtenir le livre →
            </button>
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <span>ÉPARGNE · INVESTISSEMENT · ANALYSE TECHNIQUE · DISCIPLINE · LIBERTÉ</span>
            </div>
          </div>
        </div>

        {/* Parties */}
        <div>
          <h2 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">
            Contenu du guide — Édition complète
          </h2>

          <div className="space-y-3">
            {formations.map(f => (
              <div key={f.id}
                onClick={() => setPartieSelectionnee(f)}
                className={`border rounded-2xl p-5 cursor-pointer hover:brightness-110 transition-all ${f.couleur}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`text-3xl flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${f.badgeCouleur}`}>
                      {f.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold ${f.textCouleur}`}>{f.partie}</span>
                        <span className="text-white font-black text-lg">— {f.titre}</span>
                      </div>
                      <p className={`text-xs italic mb-2 ${f.textCouleur} truncate`}>{f.citation}</p>
                      <div className="flex gap-2 flex-wrap">
                        {f.sousParties.map((s, i) => (
                          <span key={i} className={`text-xs px-2 py-0.5 rounded-lg border ${f.badgeCouleur} ${f.textCouleur}`}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-3 py-2 rounded-xl border flex-shrink-0 ${f.badgeCouleur} ${f.textCouleur}`}>
                    Lire →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Annexes */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-white font-black mb-3">📎 Annexes</h3>
          <div className="grid grid-cols-2 gap-2">
            {['Lexique financier', 'SGI — Sociétés de Gestion', 'Calculateurs', 'BRVM.org', 'Sika Finance', 'Routine hebdomadaire'].map((a, i) => (
              <div key={i} className="bg-gray-800 rounded-xl px-3 py-2 text-gray-400 text-xs">
                · {a}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Modal */}
      {partieSelectionnee && (
        <ModalFormation
          partie={partieSelectionnee}
          onClose={() => setPartieSelectionnee(null)}
        />
      )}
    </div>
  )
}