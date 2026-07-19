import { useState, useEffect } from 'react'

interface Note {
  id: string
  titre: string
  contenu: string
  date: string
}

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('capnex_notes')
    return saved ? JSON.parse(saved) : []
  })
  const [selected, setSelected] = useState<Note | null>(null)
  const [editTitre, setEditTitre] = useState('')
  const [editContenu, setEditContenu] = useState('')
  const [isNew, setIsNew] = useState(false)

  useEffect(() => {
    localStorage.setItem('capnex_notes', JSON.stringify(notes))
  }, [notes])

  const nouvelleNote = () => {
    const n: Note = {
      id: Date.now().toString(),
      titre: 'Nouvelle note',
      contenu: '',
      date: new Date().toISOString(),
    }
    setNotes(prev => [n, ...prev])
    setSelected(n)
    setEditTitre(n.titre)
    setEditContenu(n.contenu)
    setIsNew(true)
  }

  const sauvegarder = () => {
    if (!selected) return
    const updated = {
      ...selected,
      titre: editTitre || 'Sans titre',
      contenu: editContenu,
      date: new Date().toISOString(),
    }
    setNotes(prev => prev.map(n => n.id === selected.id ? updated : n))
    setSelected(updated)
    setIsNew(false)
  }

  const supprimer = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  const selectionner = (n: Note) => {
    if (selected && isNew) sauvegarder()
    setSelected(n)
    setEditTitre(n.titre)
    setEditContenu(n.contenu)
    setIsNew(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-blue-400">Notes</h1>
            <p className="text-gray-500 text-xs">{notes.length} note{notes.length > 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={nouvelleNote}
            className="bg-blue-500 hover:bg-blue-400 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors"
          >
            + Note
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {selected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => { sauvegarder(); setSelected(null) }}
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                ← Retour
              </button>
              <button
                onClick={sauvegarder}
                className="ml-auto bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-4 py-2 rounded-xl text-sm transition-colors"
              >
                Sauvegarder
              </button>
              <button
                onClick={() => supprimer(selected.id)}
                className="text-red-400 hover:text-red-300 text-sm transition-colors"
              >
                Supprimer
              </button>
            </div>

            <input
              value={editTitre}
              onChange={e => setEditTitre(e.target.value)}
              className="w-full bg-transparent text-white text-2xl font-black focus:outline-none border-b border-gray-800 pb-2"
              placeholder="Titre..."
            />

            <textarea
              value={editContenu}
              onChange={e => setEditContenu(e.target.value)}
              className="w-full bg-transparent text-gray-300 text-sm focus:outline-none resize-none"
              placeholder="Écris ta note ici..."
              rows={20}
            />
          </div>
        ) : (
          <div className="space-y-3">
            {notes.length === 0 && (
              <div className="text-center py-20 space-y-3">
                <div className="text-5xl text-gray-700">📝</div>
                <p className="text-gray-600">Aucune note</p>
                <button onClick={nouvelleNote} className="text-blue-400 text-sm hover:text-blue-300">
                  Créer ta première note →
                </button>
              </div>
            )}
            {notes.map(n => (
              <div
                key={n.id}
                onClick={() => selectionner(n)}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-4 cursor-pointer hover:border-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h3 className="font-bold text-white truncate">{n.titre}</h3>
                    <p className="text-gray-500 text-xs truncate mt-1">
                      {n.contenu || 'Note vide'}
                    </p>
                    <p className="text-gray-700 text-xs mt-2">
                      {new Date(n.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); supprimer(n.id) }}
                    className="text-gray-600 hover:text-red-400 transition-colors text-lg ml-3"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}