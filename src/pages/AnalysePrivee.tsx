import { useState, useEffect } from 'react'
import { getActifsCache } from '../service/actifsStore'
import { actifsAPI } from '../service/api'
import type { Actif, Sizing } from '../data/Actifs'

const SIZING_STYLE: Record<Sizing, string> = {
  4: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
  3: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  2: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
  1: 'bg-red-500/20 text-red-400 border-red-500/50',
}

// ── RECALCUL SCORE & SIZING ──
function recalcNote(a: Actif): number {
  const liq = a.liq ?? 0
  const ca = a.ca ?? 0
  const croiss = a.croiss ?? 0
  const marge = a.marge ?? 0
  const per5 = a.per5 ?? 0
  const freq = a.freq ?? 0
  return Math.round(((liq + ca + croiss + marge + per5 + freq) / 6) * 10 * 10) / 10
}

function recalcGlobal(note: number, notediv: number): number {
  return Math.round(((note * 0.7) + (notediv * 0.3)) * 10) / 10
}

function recalcSizing(global: number): Sizing {
  if (global > 80) return 4
  if (global >= 60) return 3
  if (global >= 40) return 2
  return 1
}

function recalc(a: Actif): Actif {
  const note = recalcNote(a)
  const global = recalcGlobal(note, a.notediv ?? 0)
  const sizing = recalcSizing(global)
  return { ...a, note, score: global, sizing }
}

// ── MODAL IA ──
type ModuleIA = { type: 'fonda' | 'tech'; ticker: string } | null

function ModalIA({ info, actif, onApply, onClose }: {
  info: ModuleIA
  actif: Actif
  onApply: (updates: Partial<Actif>) => void
  onClose: () => void
}) {
  const [image, setImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resultat, setResultat] = useState<string | null>(null)
  const [updates, setUpdates] = useState<Partial<Actif>>({})

  if (!info) return null

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImage(reader.result as string)
    reader.readAsDataURL(file)
  }

  const analyser = async () => {
    if (!image) return
    setLoading(true)
    setResultat(null)

    const base64 = image.split(',')[1]
    const mediaType = image.split(';')[0].split(':')[1]

    const prompt = info.type === 'fonda'
      ? `Tu es un analyste financier BRVM expert. Analyse cette capture de résultats financiers pour ${actif.nom} (${actif.ticker}).
Réponds UNIQUEMENT en JSON valide sans markdown:
{
  "liq": number entre 0 et 10,
  "ca": number entre 0 et 10,
  "croiss": number entre 0 et 10,
  "marge": number entre 0 et 10,
  "per5": number entre 0 et 10,
  "freq": number entre 0 et 10,
  "notediv": number entre 0 et 10,
  "commentaire": "string court"
}`
      : `Tu es un analyste technique BRVM expert. Analyse ce graphique de prix pour ${actif.nom} (${actif.ticker}).
Réponds UNIQUEMENT en JSON valide sans markdown:
{
  "sigM": "oui"|"non",
  "sigW": "oui"|"moyen"|"faible"|"non",
  "sigD": "oui"|"non",
  "dailyM": 1|2|3,
  "commentaire": "string court"
}`

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
              { type: 'text', text: prompt }
            ]
          }]
        })
      })
      const data = await res.json()
      const text = data.content?.[0]?.text ?? ''
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      setUpdates(parsed)
      setResultat(parsed.commentaire ?? 'Analyse complète')
    } catch {
      setResultat('Erreur — vérifie ta connexion ou la clé API')
    }
    setLoading(false)
  }

  const isFonda = info.type === 'fonda'

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">
              {isFonda ? '📊 Analyse Fondamentale' : '📈 Analyse Technique'} IA
            </h2>
            <p className="text-gray-500 text-xs">{actif.ticker} — {actif.nom}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        <p className="text-gray-400 text-sm">
          {isFonda ? 'Envoie une capture des résultats financiers BRVM' : 'Envoie un graphique TradingView du titre'}
        </p>

        <input
          type="file"
          accept="image/*"
          onChange={handleImage}
          className="w-full text-sm text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-emerald-500/20 file:text-emerald-400 file:font-bold cursor-pointer"
        />

        {image && (
          <img src={image} alt="preview" className="w-full rounded-xl max-h-48 object-cover border border-gray-700" />
        )}

        {resultat && (
          <div className="bg-gray-800 rounded-xl p-3 text-sm text-gray-300 border border-gray-700">
            <p className="text-emerald-400 font-bold mb-1">Résultat IA</p>
            <p>{resultat}</p>
            {isFonda && (
              <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-gray-400">
                {updates.liq !== undefined && <span>LIQ : {updates.liq}/10</span>}
                {updates.ca !== undefined && <span>CA : {updates.ca}/10</span>}
                {updates.croiss !== undefined && <span>CROISS : {updates.croiss}/10</span>}
                {updates.marge !== undefined && <span>MARGE : {updates.marge}/10</span>}
                {updates.per5 !== undefined && <span>PER5 : {updates.per5}/10</span>}
                {updates.freq !== undefined && <span>FREQ : {updates.freq}/10</span>}
                {updates.notediv !== undefined && <span>NOTEDIV : {updates.notediv}/10</span>}
              </div>
            )}
            {!isFonda && updates.sigM && (
              <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-gray-400">
                <span>Monthly : {String(updates.sigM).toUpperCase()}</span>
                <span>Weekly : {String(updates.sigW).toUpperCase()}</span>
                <span>Daily : {String(updates.sigD).toUpperCase()}</span>
                <span>Daily.M : {'★'.repeat(updates.dailyM as number ?? 0)}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={analyser}
            disabled={!image || loading}
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-bold py-3 rounded-xl transition-colors"
          >
            {loading ? 'Analyse en cours...' : 'Analyser'}
          </button>
          {resultat && Object.keys(updates).length > 0 && (
            <button
              onClick={() => { onApply(updates); onClose() }}
              className="flex-1 bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 rounded-xl transition-colors"
            >
              Appliquer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── LIGNE ACTIF ──
function ActifLigne({ actif, onUpdate }: { actif: Actif; onUpdate: (a: Actif) => void }) {
  const [modalIA, setModalIA] = useState<ModuleIA>(null)

  const update = (changes: Partial<Actif>) => {
    onUpdate(recalc({ ...actif, ...changes }))
  }

  const inputNote = (field: keyof Actif, value: number) => {
    const clamped = Math.max(0, Math.min(10, value))
    update({ [field]: clamped })
  }

  const noteField = (field: keyof Actif, color: string = 'text-white') => (
    <input
      type="number"
      min={0}
      max={10}
      step={0.5}
      value={(actif[field] as number) ?? 0}
      onChange={e => inputNote(field, Number(e.target.value))}
      className={`w-14 bg-gray-800 border border-gray-700 rounded-lg px-1 py-1 ${color} text-xs text-center focus:outline-none focus:border-emerald-500`}
    />
  )

  const rr = actif.entree > 0
    ? ((actif.tp - actif.entree) / (actif.entree - actif.sl)).toFixed(1)
    : '—'

  const cycle = <T,>(val: T, values: T[]) => {
    const idx = values.indexOf(val)
    return values[(idx + 1) % values.length]
  }

  return (
    <>
      <tr className="hover:bg-gray-800/50 transition-colors border-b border-gray-800/50">
        <td className="px-3 py-2.5 whitespace-nowrap">
          <div className="font-mono font-bold text-white text-xs">{actif.ticker}</div>
          <div className="text-gray-500 text-xs truncate max-w-[100px]">{actif.nom}</div>
        </td>
        <td className="px-3 py-2.5 text-center">
          <span className="font-black text-sm text-amber-400">{(actif.note ?? 0).toFixed(1)}</span>
          <span className="text-gray-600 text-xs">/100</span>
        </td>
        <td className="px-3 py-2.5 text-center">
          <span className={`font-black text-sm ${
            (actif.score ?? 0) > 80 ? 'text-emerald-400' :
            (actif.score ?? 0) >= 60 ? 'text-blue-400' :
            (actif.score ?? 0) >= 40 ? 'text-amber-400' : 'text-red-400'
          }`}>{(actif.score ?? 0).toFixed(1)}</span>
          <span className="text-gray-600 text-xs">/100</span>
        </td>
        <td className="px-3 py-2.5 text-center">
          <input
            type="number"
            value={actif.prix ?? 0}
            onChange={e => update({ prix: Number(e.target.value) })}
            className="w-20 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-white text-xs text-center focus:outline-none focus:border-emerald-500"
          />
        </td>
        <td className="px-3 py-2.5 text-center">{noteField('liq', 'text-amber-400')}</td>
        <td className="px-3 py-2.5 text-center">{noteField('ca', 'text-blue-400')}</td>
        <td className="px-3 py-2.5 text-center">{noteField('croiss', 'text-emerald-400')}</td>
        <td className="px-3 py-2.5 text-center">{noteField('marge', 'text-purple-400')}</td>
        <td className="px-3 py-2.5 text-center">{noteField('per5', 'text-cyan-400')}</td>
        <td className="px-3 py-2.5 text-center">{noteField('freq', 'text-pink-400')}</td>
        <td className="px-3 py-2.5 text-center">{noteField('notediv', 'text-yellow-400')}</td>
        <td className="px-3 py-2.5 text-center">
          <button onClick={() => setModalIA({ type: 'fonda', ticker: actif.ticker })}
            className="bg-purple-500/20 text-purple-400 border border-purple-500/40 text-xs font-bold px-2 py-1 rounded-lg hover:bg-purple-500/30 transition-colors">
            IA
          </button>
        </td>
        <td className="px-3 py-2.5 text-center">
          <button onClick={() => setModalIA({ type: 'tech', ticker: actif.ticker })}
            className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 text-xs font-bold px-2 py-1 rounded-lg hover:bg-cyan-500/30 transition-colors">
            IA
          </button>
        </td>
        <td className="px-3 py-2.5 text-center">
          <button
            onClick={() => update({ sigM: cycle(actif.sigM ?? 'non', ['oui', 'non']) })}
            className={`text-xs font-bold px-2 py-0.5 rounded-lg border transition-colors ${actif.sigM === 'oui' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
            {actif.sigM === 'oui' ? 'OUI' : 'NON'}
          </button>
        </td>
        <td className="px-3 py-2.5 text-center">
          <button
            onClick={() => update({ sigW: cycle(actif.sigW ?? 'non', ['oui', 'moyen', 'faible', 'non']) })}
            className={`text-xs font-bold px-2 py-0.5 rounded-lg border transition-colors ${
              actif.sigW === 'oui' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
              actif.sigW === 'moyen' ? 'bg-blue-500/20 text-blue-400 border-blue-500/40' :
              actif.sigW === 'faible' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
              'bg-gray-800 text-gray-500 border-gray-700'
            }`}>
            {(actif.sigW ?? 'non').toUpperCase()}
          </button>
        </td>
        <td className="px-3 py-2.5 text-center">
          <button
            onClick={() => update({ sigD: cycle(actif.sigD ?? 'non', ['oui', 'non']) })}
            className={`text-xs font-bold px-2 py-0.5 rounded-lg border transition-colors ${actif.sigD === 'oui' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
            {actif.sigD === 'oui' ? 'OUI' : 'NON'}
          </button>
        </td>
        <td className="px-3 py-2.5 text-center">
          <button
            onClick={() => update({ dailyM: cycle(actif.dailyM ?? 1, [1, 2, 3]) })}
            className="text-amber-400 text-xs font-bold hover:scale-110 transition-transform">
            {'★'.repeat(actif.dailyM ?? 1)}{'☆'.repeat(3 - (actif.dailyM ?? 1))}
          </button>
        </td>
        <td className="px-3 py-2.5 text-center">
          <span className={`text-xs font-black px-2 py-1 rounded-lg border ${SIZING_STYLE[actif.sizing ?? 0]}`}>
            {(actif.sizing ?? 0) === 1 ? '⚠ 0X' : `${actif.sizing}X`}
          </span>
        </td>
        <td className="px-3 py-2.5 text-center">
          <input type="number" value={actif.entree ?? 0}
            onChange={e => update({ entree: Number(e.target.value) })}
            className="w-20 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-white text-xs text-center focus:outline-none focus:border-emerald-500" />
        </td>
        <td className="px-3 py-2.5 text-center">
          <input type="number" value={actif.sl ?? 0}
            onChange={e => update({ sl: Number(e.target.value) })}
            className="w-20 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-red-400 text-xs text-center focus:outline-none focus:border-red-500" />
        </td>
        <td className="px-3 py-2.5 text-center">
          <input type="number" value={actif.tp ?? 0}
            onChange={e => update({ tp: Number(e.target.value) })}
            className="w-20 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-emerald-400 text-xs text-center focus:outline-none focus:border-emerald-500" />
        </td>
        <td className="px-3 py-2.5 text-center">
          <span className={`text-xs font-bold ${Number(rr) >= 2 ? 'text-emerald-400' : Number(rr) >= 1 ? 'text-amber-400' : 'text-red-400'}`}>
            {rr}
          </span>
        </td>
        <td className="px-3 py-2.5 text-center">
          <span className="text-gray-400 text-xs">{actif.secteur}</span>
        </td>
      </tr>

      {modalIA && (
        <ModalIA
          info={modalIA}
          actif={actif}
          onApply={(updates) => update(updates)}
          onClose={() => setModalIA(null)}
        />
      )}
    </>
  )
}

// ── PAGE PRINCIPALE ──
export default function AnalysePrivee() {
  const [data, setData] = useState<Actif[]>(() => {
    const saved = localStorage.getItem('capnex_analyse')
    const cache = getActifsCache()
    if (!saved) return cache
    const savedData: Actif[] = JSON.parse(saved)
    return savedData.map(savedActif => {
      const fresh = cache.find((a: any) => a.ticker === savedActif.ticker)
      if (fresh) return { ...savedActif, prix: fresh.prix, score: fresh.score, sizing: fresh.sizing }
      return savedActif
    })
  })

  const [filtreSize, setFiltreSize] = useState<number | null>(null)
  const [recherche, setRecherche] = useState('')

  useEffect(() => {
    localStorage.setItem('capnex_analyse', JSON.stringify(data))
  }, [data])

  const updateActif = async (updated: Actif) => {
    setData(prev => prev.map(a => a.ticker === updated.ticker ? updated : a))
    try {
      await actifsAPI.update(updated.ticker, {
        liq: updated.liq,
        ca: updated.ca,
        croiss: updated.croiss,
        marge: updated.marge,
        per5: updated.per5,
        freq: updated.freq,
        notediv: updated.notediv,
        sigM: updated.sigM,
        sigW: updated.sigW,
        sigD: updated.sigD,
        dailyM: updated.dailyM,
        entree: updated.entree,
        sl: updated.sl,
        tp: updated.tp,
      })
    } catch (e) {
      console.error('Erreur sync backend:', e)
    }
  }

  const filtered = data
    .filter(a => filtreSize === null || a.sizing === filtreSize)
    .filter(a =>
      recherche === '' ||
      a.ticker.toLowerCase().includes(recherche.toLowerCase()) ||
      a.nom.toLowerCase().includes(recherche.toLowerCase())
    )
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))

  const cols = [
    'SOCIÉTÉ', 'NOTE', 'GLOBAL', 'COURS',
    'LIQ', 'CA', 'CROISS', 'MARGE', 'PER5', 'FREQ', 'NOTEDIV',
    'FONDA', 'TECH',
    'SIG.M', 'SIG.W', 'SIG.D', 'DAILY.M',
    'SIGNAL', 'ENTRÉE', 'S.L', 'T.P', 'R/R', 'SECTEUR'
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-full mx-auto space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black text-purple-400">Analyse Privée</h1>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[4, 3, 2, 1].map(s => (
              <button key={s}
                onClick={() => setFiltreSize(filtreSize === s ? null : s)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                  filtreSize === s
                    ? s === 4 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500' :
                      s === 3 ? 'bg-blue-500/20 text-blue-400 border-blue-500' :
                      s === 2 ? 'bg-amber-500/20 text-amber-400 border-amber-500' :
                      'bg-red-500/20 text-red-400 border-red-500'
                    : 'bg-gray-800 text-gray-500 border-gray-700'
                }`}>
                {s}X · {data.filter(a => a.sizing === s).length}
              </button>
            ))}
            <input type="text" placeholder="Rechercher..." value={recherche}
              onChange={e => setRecherche(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-purple-500" />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse" style={{ minWidth: '1600px' }}>
          <thead>
            <tr className="bg-gray-900 border-b border-gray-800">
              {cols.map(col => (
                <th key={col} className="px-3 py-3 text-left font-bold text-gray-500 tracking-wider uppercase whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => (
              <ActifLigne key={a.ticker} actif={a} onUpdate={updateActif} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}