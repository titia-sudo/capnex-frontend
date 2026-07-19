import { useState } from 'react'
import { authAPI } from '../service/api'

interface LoginProps {
  onLogin: (role: 'user' | 'analyste', token: string, nom: string) => void
}

export default function Login({ onLogin }: LoginProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [erreur, setErreur] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!email || !password) return setErreur('Remplis tous les champs')
    setLoading(true)
    setErreur('')

    try {
      let res
      if (mode === 'login') {
        res = await authAPI.login(email, password)
      } else {
        if (!nom) return setErreur('Entre ton nom')
        res = await authAPI.register(nom, email, password, 'USER')
      }

      localStorage.setItem('capnex_token', res.token)
      localStorage.setItem('capnex_user', JSON.stringify({ email: res.email, nom: res.nom, role: res.role }))

      const role = res.role === 'ANALYSTE' ? 'analyste' : 'user'
      onLogin(role, res.token, res.nom)
    } catch (e: any) {
      setErreur(e.message || 'Erreur de connexion')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">

        {/* Logo */}
        <div className="text-center space-y-2">
          <img src="/logo.png" alt="CAPNEX PRO" className="h-34 w-auto mx-auto" />
          <p className="text-gray-500 text-sm">BRVM · Zone UEMOA</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-900 rounded-xl p-1 border border-gray-800">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${mode === 'login' ? 'bg-orange-500 text-white' : 'text-gray-500'}`}
          >
            Connexion
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${mode === 'register' ? 'bg-orange-500 text-white' : 'text-gray-500'}`}
          >
            Inscription
          </button>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          {mode === 'register' && (
            <div>
              <label className="text-gray-400 text-sm block mb-1">Nom complet</label>
              <input
                type="text"
                value={nom}
                onChange={e => setNom(e.target.value)}
                placeholder="Ex: Jean Dupont"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="text-gray-400 text-sm block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="email@exemple.com"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm block mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="••••••••"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          {erreur && <p className="text-red-400 text-sm">{erreur}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-colors"
          >
            {loading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : "S'inscrire"}
          </button>
        </div>

        <p className="text-center text-gray-700 text-xs">
          Confidentiel — Usage exclusif UEMOA
        </p>
      </div>
    </div>
  )
}