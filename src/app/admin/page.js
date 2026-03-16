'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Admin() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [books, setBooks] = useState([])
  const [covers, setCovers] = useState([])
  const [activeTab, setActiveTab] = useState('books')
  const [searchQuery, setSearchQuery] = useState('')
  const [message, setMessage] = useState(null)
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: adminData } = await supabase
        .from('admins')
        .select('user_id')
        .eq('user_id', user.id)
        .single()

      if (!adminData) { router.push('/'); return }
      setIsAdmin(true)

      await loadBooks()
      await loadCovers()
      setLoading(false)
    }
    loadData()
  }, [])

  async function loadBooks() {
    const { data } = await supabase
      .from('booklist')
      .select('book_id, book_title, book_author, book_cover, status, created_at')
      .order('created_at', { ascending: false })

    // Deduplicar por book_id
    const seen = new Set()
    const unique = (data || []).filter(b => {
      if (seen.has(b.book_id)) return false
      seen.add(b.book_id)
      return true
    })
    setBooks(unique)
  }

  async function loadCovers() {
    const { data } = await supabase
      .from('custom_covers')
      .select('*, profiles(username)')
      .order('created_at', { ascending: false })
    setCovers(data || [])
  }

  async function handleRemoveBook(bookId) {
    if (!confirm('This will remove this book from ALL users lists and reviews. Are you sure?')) return

    await supabase.from('booklist').delete().eq('book_id', bookId)
    await supabase.from('reviews').delete().eq('book_id', bookId)
    await supabase.from('custom_covers').delete().eq('book_id', bookId)

    setMessage({ type: 'success', text: 'Book removed from database.' })
    setTimeout(() => setMessage(null), 3000)
    await loadBooks()
    await loadCovers()
  }

  async function handleRemoveCover(bookId) {
    await supabase.from('custom_covers').delete().eq('book_id', bookId)
    setMessage({ type: 'success', text: 'Custom cover removed.' })
    setTimeout(() => setMessage(null), 3000)
    await loadCovers()
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

  const filteredBooks = books.filter(b =>
    b.book_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.book_author?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">

      {/* Cabecera */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-2">Administration</p>
          <h1 style={{fontFamily: 'var(--font-playfair)'}} className="text-4xl font-bold text-[#e8dcc8]">
            Admin Panel
          </h1>
        </div>
        <div className="flex items-center gap-2 bg-[#1e1a10] border border-[#c9a84c30] rounded-lg px-4 py-2">
          <span className="text-[#c9a84c] text-sm">✦</span>
          <span className="text-[#a89070] text-xs tracking-wider">Admin access</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { value: books.length, label: 'Books in database', color: 'text-[#a8c870]' },
          { value: covers.length, label: 'Custom covers', color: 'text-[#c9a84c]' },
          { value: new Set(books.map(b => b.book_id)).size, label: 'Unique titles', color: 'text-[#7ab0d4]' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#12100a] border border-[#c9a84c20] rounded-xl p-5 text-center">
            <p style={{fontFamily: 'var(--font-playfair)'}} className={`text-4xl font-bold ${stat.color}`}>
              {stat.value}
            </p>
            <p className="text-[#5a4a30] text-xs mt-2 tracking-wider uppercase">{stat.label}</p>
          </div>
        ))}
      </div>
      {/* Accesos rápidos */}
        <div className="flex gap-4 mb-8">
        <Link href="/admin/libros"
            className="bg-[#c9a84c] hover:bg-[#d4b86a] text-[#12100a] font-semibold px-6 py-3 rounded-lg transition tracking-wider text-sm">
            📚 Manage book database
        </Link>
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

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#c9a84c20] mb-8">
        {[
          { id: 'books', label: 'Books', count: books.length },
          { id: 'covers', label: 'Custom covers', count: covers.length },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-sm tracking-wider transition border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-[#c9a84c] text-[#c9a84c]'
                : 'border-transparent text-[#5a4a30] hover:text-[#a89070]'
            }`}>
            {tab.label}
            <span className="ml-2 text-xs opacity-60">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Tab: Books */}
      {activeTab === 'books' && (
        <div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or author..."
            className="w-full bg-[#12100a] border border-[#c9a84c30] focus:border-[#c9a84c] rounded-lg px-5 py-3 text-[#e8dcc8] placeholder-[#5a4a30] outline-none transition mb-6"
            style={{fontFamily: 'var(--font-lora)'}}
          />

          {filteredBooks.length === 0 ? (
            <p className="text-[#a89070] italic text-center py-10">No books found.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredBooks.map(book => (
                <div key={book.book_id}
                  className="bg-[#12100a] border border-[#c9a84c15] hover:border-[#c9a84c30] rounded-xl p-4 flex items-center gap-4 transition">

                  {/* Portada */}
                  {book.book_cover ? (
                    <img src={book.book_cover} alt={book.book_title}
                      className="w-10 h-14 object-cover rounded shrink-0 shadow-lg" />
                  ) : (
                    <div className="w-10 h-14 bg-[#1e1a10] border border-[#c9a84c20] rounded shrink-0 flex items-center justify-center text-[#c9a84c20]">
                      📖
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link href={`/libro/${book.book_id}`}
                      className="font-semibold text-[#e8dcc8] hover:text-[#c9a84c] transition text-sm line-clamp-1"
                      style={{fontFamily: 'var(--font-playfair)'}}>
                      {book.book_title}
                    </Link>
                    <p className="text-[#a89070] text-xs mt-0.5">{book.book_author}</p>
                    <p className="text-[#3a3020] text-xs mt-0.5">ID: {book.book_id}</p>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/libro/${book.book_id}`}
                      className="text-xs border border-[#c9a84c30] hover:border-[#c9a84c] text-[#a89070] hover:text-[#c9a84c] px-3 py-1.5 rounded-lg transition">
                      View
                    </Link>
                    <button
                      onClick={() => handleRemoveBook(book.book_id)}
                      className="text-xs border border-[#6a2010] hover:bg-[#6a2010] text-[#c87040] px-3 py-1.5 rounded-lg transition">
                      Remove
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Custom covers */}
      {activeTab === 'covers' && (
        <div>
          {covers.length === 0 ? (
            <p className="text-[#a89070] italic text-center py-10">No custom covers yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {covers.map(cover => (
                <div key={cover.id}
                  className="bg-[#12100a] border border-[#c9a84c15] hover:border-[#c9a84c30] rounded-xl p-4 flex items-center gap-4 transition">

                  <img src={cover.cover_url} alt={cover.book_id}
                    className="w-10 h-14 object-cover rounded shrink-0 shadow-lg" />

                  <div className="flex-1 min-w-0">
                    <Link href={`/libro/${cover.book_id}`}
                      className="font-semibold text-[#e8dcc8] hover:text-[#c9a84c] transition text-sm"
                      style={{fontFamily: 'var(--font-playfair)'}}>
                      {cover.book_id}
                    </Link>
                    <p className="text-[#a89070] text-xs mt-0.5">
                      Uploaded by <span className="text-[#c9a84c]">{cover.profiles?.username}</span>
                    </p>
                    <p className="text-[#3a3020] text-xs mt-0.5">
                      {new Date(cover.created_at).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a href={cover.cover_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs border border-[#c9a84c30] hover:border-[#c9a84c] text-[#a89070] hover:text-[#c9a84c] px-3 py-1.5 rounded-lg transition">
                      View
                    </a>
                    <button
                      onClick={() => handleRemoveCover(cover.book_id)}
                      className="text-xs border border-[#6a2010] hover:bg-[#6a2010] text-[#c87040] px-3 py-1.5 rounded-lg transition">
                      Remove
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </main>
  )
}