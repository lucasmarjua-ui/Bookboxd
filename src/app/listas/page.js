'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Listas() {
  const [user, setUser] = useState(null)
  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', is_public: true })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      await loadLists(user.id)
      setLoading(false)
    }
    loadData()
  }, [])

  async function loadLists(userId) {
    const { data, error } = await supabase
      .from('lists')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
    console.log('LISTS:', data, 'ERROR:', error)
    setLists(data || [])
  }

  async function handleCreate() {
    if (!form.title.trim()) {
      setMessage({ type: 'error', text: 'Title is required.' })
      return
    }
    setSaving(true)
    const { data, error } = await supabase
      .from('lists')
      .insert({
        user_id: user.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        is_public: form.is_public,
      })
      .select()
      .single()

    if (error) {
      setMessage({ type: 'error', text: 'Error creating list.' })
      console.log('CREATE ERROR:', error)
    } else {
      setShowForm(false)
      setForm({ title: '', description: '', is_public: true })
      router.push(`/listas/${data.id}`)
    }
    setSaving(false)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this list?')) return
    await supabase.from('lists').delete().eq('id', id)
    setLists(prev => prev.filter(l => l.id !== id))
  }

  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="text-center">
          <span className="text-[#c9a84c] text-4xl">✦</span>
          <p className="text-[#a89070] mt-4">Loading...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-12">

      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-2">Your collections</p>
          <h1 style={{fontFamily: 'var(--font-playfair)'}} className="text-4xl font-bold text-[#e8dcc8]">
            My Lists
          </h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#c9a84c] hover:bg-[#d4b86a] text-[#12100a] font-semibold px-6 py-2.5 rounded-lg transition tracking-wider text-sm">
          {showForm ? 'Cancel' : '+ New list'}
        </button>
      </div>

      {/* Formulario nueva lista */}
      {showForm && (
        <div className="bg-[#12100a] border border-[#c9a84c30] rounded-xl p-7 mb-10">
          <h2 style={{fontFamily: 'var(--font-playfair)'}} className="text-xl font-bold text-[#e8dcc8] mb-5">
            Create list
          </h2>

          {message && (
            <div className={`mb-4 px-4 py-3 rounded text-sm border ${
              message.type === 'success' ? 'bg-[#1a2010] border-[#4a6a20] text-[#a8c870]' : 'bg-[#201008] border-[#6a2010] text-[#c87040]'
            }`}>{message.text}</div>
          )}

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-[#a89070] text-xs tracking-wider uppercase mb-2 block">Title *</label>
              <input type="text" value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Harry Potter saga"
                className="w-full bg-[#1e1a10] border border-[#c9a84c20] focus:border-[#c9a84c] rounded px-4 py-3 text-[#e8dcc8] placeholder-[#3a2a10] outline-none transition"
                style={{fontFamily: 'var(--font-lora)'}}
              />
            </div>
            <div>
              <label className="text-[#a89070] text-xs tracking-wider uppercase mb-2 block">Description</label>
              <textarea value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="What is this list about?"
                rows={3}
                className="w-full bg-[#1e1a10] border border-[#c9a84c20] focus:border-[#c9a84c] rounded px-4 py-3 text-[#e8dcc8] placeholder-[#3a2a10] outline-none transition resize-none"
                style={{fontFamily: 'var(--font-lora)'}}
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setForm(p => ({ ...p, is_public: !p.is_public }))}
                className={`relative w-10 h-5 rounded-full transition ${form.is_public ? 'bg-[#c9a84c]' : 'bg-[#2a2010]'}`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${form.is_public ? 'left-5' : 'left-0.5'}`} />
              </button>
              <span className="text-[#a89070] text-sm">
                {form.is_public ? 'Public list' : 'Private list'}
              </span>
            </div>
          </div>

          <button onClick={handleCreate} disabled={saving}
            className="mt-6 bg-[#c9a84c] hover:bg-[#d4b86a] disabled:bg-[#5a4a20] text-[#12100a] font-semibold px-8 py-2.5 rounded-lg transition tracking-wider text-sm">
            {saving ? 'Creating...' : 'Create list'}
          </button>
        </div>
      )}

      {/* Lista de listas */}
      {lists.length === 0 ? (
        <div className="text-center py-16 border border-[#c9a84c20] rounded-xl">
          <span className="text-[#c9a84c] text-4xl">✦</span>
          <p className="text-[#a89070] italic mt-4 mb-2">No lists yet.</p>
          <p className="text-[#5a4a30] text-sm">Create your first list to organize books by saga, genre or theme.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {lists.map(list => (
            <div key={list.id}
              className="bg-[#12100a] border border-[#c9a84c15] hover:border-[#c9a84c40] rounded-xl p-5 transition flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <Link href={`/listas/${list.id}`}>
                  <h3 style={{fontFamily: 'var(--font-playfair)'}}
                    className="font-bold text-[#e8dcc8] hover:text-[#c9a84c] transition leading-tight">
                    {list.title}
                  </h3>
                </Link>
                <span className={`text-xs shrink-0 px-2 py-0.5 rounded-full border ${
                  list.is_public
                    ? 'border-[#4a6a20] text-[#a8c870]'
                    : 'border-[#3a3020] text-[#5a4a30]'
                }`}>
                  {list.is_public ? 'Public' : 'Private'}
                </span>
              </div>

              {list.description && (
                <p className="text-[#a89070] text-xs line-clamp-2">{list.description}</p>
              )}

              <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#c9a84c10]">
                <span className="text-[#5a4a30] text-xs">
                  {new Date(list.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <div className="flex gap-2">
                  <Link href={`/listas/${list.id}`}
                    className="text-xs border border-[#c9a84c30] hover:border-[#c9a84c] text-[#a89070] hover:text-[#c9a84c] px-3 py-1.5 rounded-lg transition">
                    Open
                  </Link>
                  <button onClick={() => handleDelete(list.id)}
                    className="text-xs border border-[#6a2010] hover:bg-[#6a2010] text-[#c87040] px-3 py-1.5 rounded-lg transition">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}