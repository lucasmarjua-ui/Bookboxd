'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const EMPTY_FORM = {
  title: '',
  author: '',
  synopsis: '',
  cover_url: '',
  published_year: '',
  genre: '',
  isbn: '',
}

const GENRES = [
  'Fiction', 'Non-fiction', 'Fantasy', 'Science Fiction', 'Mystery',
  'Thriller', 'Romance', 'Horror', 'Biography', 'History',
  'Poetry', 'Philosophy', 'Self-help', 'Classic', 'Other'
]

export default function AdminLibros() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const fileInputRef = useRef(null)
  const router = useRouter()

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('admins').select('user_id').eq('user_id', user.id).single()
      if (!data) { router.push('/'); return }
      await loadBooks()
      setLoading(false)
    }
    checkAdmin()
  }, [])

  async function loadBooks() {
    const { data } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false })
    setBooks(data || [])
  }

  async function handleCoverUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file.' })
      return
    }
    setUploadingCover(true)
    const ext = file.name.split('.').pop()
    const filename = `manual-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('covers').upload(filename, file, { upsert: true })
    if (error) {
      setMessage({ type: 'error', text: 'Error uploading cover.' })
      setUploadingCover(false)
      return
    }
    const { data: urlData } = supabase.storage.from('covers').getPublicUrl(filename)
    setForm(prev => ({ ...prev, cover_url: urlData.publicUrl }))
    setUploadingCover(false)
  }

  async function handleSave() {
    if (!form.title.trim() || !form.author.trim()) {
      setMessage({ type: 'error', text: 'Title and author are required.' })
      return
    }
    setSaving(true)
    setMessage(null)

    const { data: { user } } = await supabase.auth.getUser()

    const payload = {
      title: form.title.trim(),
      author: form.author.trim(),
      synopsis: form.synopsis.trim() || null,
      cover_url: form.cover_url.trim() || null,
      published_year: form.published_year ? parseInt(form.published_year) : null,
      genre: form.genre || null,
      isbn: form.isbn.trim() || null,
      created_by: user.id,
      updated_at: new Date().toISOString(),
    }

    let error
    if (editingId) {
      const { error: e } = await supabase.from('books').update(payload).eq('id', editingId)
      error = e
    } else {
      const { error: e } = await supabase.from('books').insert(payload)
      error = e
    }

    if (error) {
      setMessage({ type: 'error', text: 'Error saving book.' })
    } else {
      setMessage({ type: 'success', text: editingId ? 'Book updated.' : 'Book added successfully.' })
      setForm(EMPTY_FORM)
      setEditingId(null)
      setShowForm(false)
      await loadBooks()
    }

    setSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

  function handleEdit(book) {
    setForm({
      title: book.title || '',
      author: book.author || '',
      synopsis: book.synopsis || '',
      cover_url: book.cover_url || '',
      published_year: book.published_year || '',
      genre: book.genre || '',
      isbn: book.isbn || '',
    })
    setEditingId(book.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleCancel() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(false)
    setMessage(null)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this book permanently?')) return
    await supabase.from('books').delete().eq('id', id)
    setMessage({ type: 'success', text: 'Book deleted.' })
    setTimeout(() => setMessage(null), 3000)
    await loadBooks()
  }

  const filtered = books.filter(b =>
    b.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.genre?.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
    <main className="max-w-5xl mx-auto px-6 py-12">

      {/* Cabecera */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/admin" className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase hover:text-[#d4b86a] transition">
            ← Admin Panel
          </Link>
          <h1 style={{fontFamily: 'var(--font-playfair)'}} className="text-4xl font-bold text-[#e8dcc8] mt-2">
            Book Database
          </h1>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(EMPTY_FORM) }}
          className="bg-[#c9a84c] hover:bg-[#d4b86a] text-[#12100a] font-semibold px-6 py-2.5 rounded-lg transition tracking-wider text-sm"
        >
          {showForm ? 'Cancel' : '+ Add book'}
        </button>
      </div>

      {/* Mensaje */}
      {message && (
        <div className={`mb-6 px-5 py-3 rounded-lg text-sm border ${
          message.type === 'success'
            ? 'bg-[#1a2010] border-[#4a6a20] text-[#a8c870]'
            : 'bg-[#201008] border-[#6a2010] text-[#c87040]'
        }`}>
          {message.text}
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <div className="bg-[#12100a] border border-[#c9a84c30] rounded-xl p-7 mb-10">
          <h2 style={{fontFamily: 'var(--font-playfair)'}} className="text-xl font-bold text-[#e8dcc8] mb-6">
            {editingId ? 'Edit book' : 'Add new book'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            <div>
              <label className="text-[#a89070] text-xs tracking-wider uppercase mb-2 block">Title *</label>
              <input type="text" value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className="w-full bg-[#1e1a10] border border-[#c9a84c20] focus:border-[#c9a84c] rounded px-4 py-3 text-[#e8dcc8] placeholder-[#3a2a10] outline-none transition"
                style={{fontFamily: 'var(--font-lora)'}}
                placeholder="Book title"
              />
            </div>

            <div>
              <label className="text-[#a89070] text-xs tracking-wider uppercase mb-2 block">Author *</label>
              <input type="text" value={form.author}
                onChange={e => setForm(p => ({ ...p, author: e.target.value }))}
                className="w-full bg-[#1e1a10] border border-[#c9a84c20] focus:border-[#c9a84c] rounded px-4 py-3 text-[#e8dcc8] placeholder-[#3a2a10] outline-none transition"
                style={{fontFamily: 'var(--font-lora)'}}
                placeholder="Author name"
              />
            </div>

            <div>
              <label className="text-[#a89070] text-xs tracking-wider uppercase mb-2 block">Published year</label>
              <input type="number" value={form.published_year}
                onChange={e => setForm(p => ({ ...p, published_year: e.target.value }))}
                className="w-full bg-[#1e1a10] border border-[#c9a84c20] focus:border-[#c9a84c] rounded px-4 py-3 text-[#e8dcc8] placeholder-[#3a2a10] outline-none transition"
                style={{fontFamily: 'var(--font-lora)'}}
                placeholder="e.g. 1954"
              />
            </div>

            <div>
              <label className="text-[#a89070] text-xs tracking-wider uppercase mb-2 block">Genre</label>
              <div className="relative">
                <select value={form.genre}
                  onChange={e => setForm(p => ({ ...p, genre: e.target.value }))}
                  className="w-full bg-[#1e1a10] border border-[#c9a84c20] focus:border-[#c9a84c] rounded px-4 py-3 text-[#e8dcc8] outline-none transition appearance-none cursor-pointer"
                >
                  <option value="">Select genre</option>
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#c9a84c] pointer-events-none">▾</span>
              </div>
            </div>

            <div>
              <label className="text-[#a89070] text-xs tracking-wider uppercase mb-2 block">ISBN</label>
              <input type="text" value={form.isbn}
                onChange={e => setForm(p => ({ ...p, isbn: e.target.value }))}
                className="w-full bg-[#1e1a10] border border-[#c9a84c20] focus:border-[#c9a84c] rounded px-4 py-3 text-[#e8dcc8] placeholder-[#3a2a10] outline-none transition"
                style={{fontFamily: 'var(--font-lora)'}}
                placeholder="978-..."
              />
            </div>

            {/* Portada */}
            <div>
              <label className="text-[#a89070] text-xs tracking-wider uppercase mb-2 block">Cover</label>
              <div className="flex gap-2">
                <input type="text" value={form.cover_url}
                  onChange={e => setForm(p => ({ ...p, cover_url: e.target.value }))}
                  className="flex-1 bg-[#1e1a10] border border-[#c9a84c20] focus:border-[#c9a84c] rounded px-4 py-3 text-[#e8dcc8] placeholder-[#3a2a10] outline-none transition"
                  style={{fontFamily: 'var(--font-lora)'}}
                  placeholder="Paste URL or upload"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingCover}
                  className="bg-[#1e1a10] border border-[#c9a84c30] hover:border-[#c9a84c] text-[#a89070] hover:text-[#c9a84c] px-4 py-3 rounded transition text-sm shrink-0"
                >
                  {uploadingCover ? '...' : '📷'}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*"
                  onChange={handleCoverUpload} className="hidden" />
              </div>
              {form.cover_url && (
                <img src={form.cover_url} alt="Preview"
                  className="mt-3 w-16 h-24 object-cover rounded shadow-lg" />
              )}
            </div>

          </div>

          {/* Sinopsis */}
          <div className="mt-5">
            <label className="text-[#a89070] text-xs tracking-wider uppercase mb-2 block">Synopsis</label>
            <textarea value={form.synopsis}
              onChange={e => setForm(p => ({ ...p, synopsis: e.target.value }))}
              rows={5}
              className="w-full bg-[#1e1a10] border border-[#c9a84c20] focus:border-[#c9a84c] rounded px-4 py-3 text-[#e8dcc8] placeholder-[#3a2a10] outline-none transition resize-none"
              style={{fontFamily: 'var(--font-lora)'}}
              placeholder="Write the book synopsis..."
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={handleSave} disabled={saving}
              className="bg-[#c9a84c] hover:bg-[#d4b86a] disabled:bg-[#5a4a20] text-[#12100a] font-semibold px-8 py-2.5 rounded-lg transition tracking-wider text-sm">
              {saving ? 'Saving...' : editingId ? 'Save changes' : 'Add book'}
            </button>
            <button onClick={handleCancel}
              className="border border-[#c9a84c30] hover:border-[#c9a84c] text-[#a89070] hover:text-[#c9a84c] px-6 py-2.5 rounded-lg transition text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Buscador */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by title, author or genre..."
          className="flex-1 bg-[#12100a] border border-[#c9a84c30] focus:border-[#c9a84c] rounded-lg px-5 py-3 text-[#e8dcc8] placeholder-[#5a4a30] outline-none transition"
          style={{fontFamily: 'var(--font-lora)'}}
        />
        <span className="text-[#5a4a30] text-sm shrink-0">{filtered.length} books</span>
      </div>

      {/* Lista de libros */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-[#c9a84c20] rounded-xl">
          <p className="text-[#a89070] italic mb-4">No books in the database yet.</p>
          <button onClick={() => setShowForm(true)}
            className="text-[#c9a84c] hover:text-[#d4b86a] transition text-sm">
            Add your first book →
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(book => (
            <div key={book.id}
              className="bg-[#12100a] border border-[#c9a84c15] hover:border-[#c9a84c30] rounded-xl p-4 flex items-center gap-4 transition">

              {book.cover_url ? (
                <img src={book.cover_url} alt={book.title}
                  className="w-12 h-16 object-cover rounded shadow-lg shrink-0" />
              ) : (
                <div className="w-12 h-16 bg-[#1e1a10] border border-[#c9a84c20] rounded shrink-0 flex items-center justify-center text-[#c9a84c20] text-xl">
                  📖
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h3 style={{fontFamily: 'var(--font-playfair)'}}
                  className="font-semibold text-[#e8dcc8] text-sm line-clamp-1">
                  {book.title}
                </h3>
                <p className="text-[#a89070] text-xs mt-0.5">{book.author}</p>
                <div className="flex gap-3 mt-1">
                  {book.genre && (
                    <span className="text-[#c9a84c] text-xs">{book.genre}</span>
                  )}
                  {book.published_year && (
                    <span className="text-[#5a4a30] text-xs">{book.published_year}</span>
                  )}
                  {book.isbn && (
                    <span className="text-[#3a3020] text-xs">ISBN: {book.isbn}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => handleEdit(book)}
                  className="text-xs border border-[#c9a84c30] hover:border-[#c9a84c] text-[#a89070] hover:text-[#c9a84c] px-3 py-1.5 rounded-lg transition">
                  Edit
                </button>
                <button onClick={() => handleDelete(book.id)}
                  className="text-xs border border-[#6a2010] hover:bg-[#6a2010] text-[#c87040] px-3 py-1.5 rounded-lg transition">
                  Delete
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </main>
  )
}