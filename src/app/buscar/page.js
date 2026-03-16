'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const SORT_OPTIONS = [
  { value: 'relevant', label: 'Most relevant' },
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'editions', label: 'Most editions' },
]

export default function Buscar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [sortBy, setSortBy] = useState('relevant')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const searchBooks = useCallback(async (searchQuery) => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)

    const isShortQuery = searchQuery.trim().split(' ').length <= 2
    const url = isShortQuery
      ? `https://openlibrary.org/search.json?title=${encodeURIComponent(searchQuery)}&limit=30&fields=key,title,author_name,cover_i,first_publish_year,edition_count`
      : `https://openlibrary.org/search.json?q=${encodeURIComponent(searchQuery)}&limit=30&fields=key,title,author_name,cover_i,first_publish_year,edition_count`

    const res = await fetch(url)
    const data = await res.json()

    const queryLower = searchQuery.toLowerCase()
    const queryWords = queryLower.split(' ').filter(w => w.length > 1)

    const seen = new Set()
    const books = (data.docs || [])
      .filter(book => {
        if (!book.title || book.title.length > 100) return false
        const titleLower = book.title.toLowerCase()
        const authorLower = book.author_name?.[0]?.toLowerCase() || ''
        const isRelevant = queryWords.some(word =>
          titleLower.includes(word) || authorLower.includes(word)
        )
        if (!isRelevant) return false
        const key = `${titleLower}-${authorLower}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .sort((a, b) => {
        const aScore = (a.cover_i ? 100 : 0) + (a.edition_count || 0)
        const bScore = (b.cover_i ? 100 : 0) + (b.edition_count || 0)
        return bScore - aScore
      })
      .slice(0, 12)
      .map(book => ({
        id: book.key.replace('/works/', ''),
        title: book.title,
        author: book.author_name?.[0] || 'Unknown author',
        year: book.first_publish_year || null,
        editions: book.edition_count || 0,
        cover: book.cover_i
          ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
          : null,
      }))

    setResults(books)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim() || query.trim().length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(() => searchBooks(query), 400)
    return () => clearTimeout(debounceRef.current)
  }, [query, searchBooks])

  async function addToList(book, status) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setMessage({ type: 'error', text: 'You must be signed in to add books.' })
      setTimeout(() => setMessage(null), 3000)
      return
    }
    const { error } = await supabase.from('booklist').upsert({
      user_id: user.id,
      book_id: book.id,
      book_title: book.title,
      book_author: book.author,
      book_cover: book.cover,
      status,
    })
    if (error) {
      setMessage({ type: 'error', text: 'Error adding book.' })
    } else {
      setMessage({ type: 'success', text: `"${book.title}" successfully added.` })
    }
    setTimeout(() => setMessage(null), 3000)
  }

  const sortedResults = [...results].sort((a, b) => {
    if (sortBy === 'oldest') return (a.year || 9999) - (b.year || 9999)
    if (sortBy === 'newest') return (b.year || 0) - (a.year || 0)
    if (sortBy === 'editions') return (b.editions || 0) - (a.editions || 0)
    return 0
  })

  const currentSort = SORT_OPTIONS.find(o => o.value === sortBy)

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">

      <div className="text-center mb-10">
        <p className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-3">Universal library</p>
        <h1 style={{fontFamily: 'var(--font-playfair)'}} className="text-4xl font-bold text-[#e8dcc8]">
          Explore books
        </h1>
        <div className="flex items-center justify-center gap-4 mt-4">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#c9a84c40]" />
          <span className="text-[#c9a84c40]">✦</span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#c9a84c40]" />
        </div>
      </div>

      <div className="relative mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Title, author or ISBN..."
          className="w-full bg-[#12100a] border border-[#c9a84c30] focus:border-[#c9a84c] rounded-xl px-5 py-4 text-[#e8dcc8] placeholder-[#5a4a30] outline-none transition pr-12 text-base"
          style={{fontFamily: 'var(--font-lora)'}}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {loading ? (
            <div className="w-5 h-5 border-2 border-[#c9a84c30] border-t-[#c9a84c] rounded-full animate-spin" />
          ) : query ? (
            <button onClick={() => { setQuery(''); setResults([]) }}
              className="text-[#5a4a30] hover:text-[#a89070] transition text-lg">✕</button>
          ) : (
            <span className="text-[#5a4a30]">⌕</span>
          )}
        </div>
        {query.trim().length === 1 && (
          <p className="text-[#5a4a30] text-xs mt-2 ml-1">Type at least 2 characters...</p>
        )}
      </div>

      {message && (
        <div className={`mb-6 px-5 py-3 rounded-lg text-sm border ${
          message.type === 'success'
            ? 'bg-[#1a2010] border-[#4a6a20] text-[#a8c870]'
            : 'bg-[#201008] border-[#6a2010] text-[#c87040]'
        }`}>
          {message.text}
        </div>
      )}

      {results.length > 0 && (
        <div className="flex items-center justify-between mb-6">
          <p className="text-[#a89070] text-sm">
            <span className="text-[#e8dcc8] font-semibold">{results.length}</span> results found
          </p>
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 bg-[#12100a] border border-[#c9a84c30] hover:border-[#c9a84c] text-[#e8dcc8] text-xs px-4 py-2.5 rounded-lg transition min-w-[160px] justify-between">
              <span className="text-[#c9a84c]">↕</span>
              <span>{currentSort?.label}</span>
              <span className={`text-[#c9a84c] transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a1408] border border-[#c9a84c30] rounded-lg overflow-hidden shadow-xl z-10">
                {SORT_OPTIONS.map(option => (
                  <button key={option.value}
                    onClick={() => { setSortBy(option.value); setDropdownOpen(false) }}
                    className={`w-full text-left px-4 py-3 text-xs transition flex items-center justify-between ${
                      sortBy === option.value
                        ? 'bg-[#c9a84c15] text-[#c9a84c]'
                        : 'text-[#a89070] hover:bg-[#c9a84c10] hover:text-[#e8dcc8]'
                    }`}>
                    <span>{option.label}</span>
                    {sortBy === option.value && <span className="text-[#c9a84c]">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {!loading && query.trim().length >= 2 && results.length === 0 && (
        <div className="text-center py-16 border border-[#c9a84c20] rounded-xl">
          <p className="text-[#a89070] italic">No books found for "{query}"</p>
        </div>
      )}

      {!query && (
        <div className="text-center py-16 border border-[#c9a84c20] rounded-xl">
          <span className="text-[#c9a84c] text-4xl">✦</span>
          <p className="text-[#a89070] italic mt-4">Start typing to search books.</p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {sortedResults.map(book => (
          <div key={book.id} className="group flex flex-col bg-[#12100a] border border-[#c9a84c15] hover:border-[#c9a84c40] rounded-xl overflow-hidden transition">
            <Link href={`/libro/${book.id}`} className="block">
              <div className="aspect-[2/3] bg-[#1e1a10] overflow-hidden">
                {book.cover ? (
                  <img src={book.cover} alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[#c9a84c30] gap-2 p-3">
                    <span className="text-3xl">📖</span>
                    <span className="text-xs text-center text-[#5a4a30] line-clamp-3">{book.title}</span>
                  </div>
                )}
              </div>
            </Link>
            <div className="p-3 flex flex-col flex-1">
              <Link href={`/libro/${book.id}`}>
                <h3 style={{fontFamily: 'var(--font-playfair)'}}
                  className="font-semibold text-sm leading-tight line-clamp-2 text-[#e8dcc8] hover:text-[#c9a84c] transition">
                  {book.title}
                </h3>
              </Link>
              <p className="text-[#a89070] text-xs mt-1">{book.author}</p>
              {book.year && <p className="text-[#5a4a30] text-xs">{book.year}</p>}
              <div className="flex flex-col gap-1.5 mt-3">
                <button onClick={() => addToList(book, 'read')}
                  className="border border-[#4a6a20] hover:bg-[#4a6a20] text-[#a8c870] text-xs py-1.5 rounded-lg transition">
                  ✓ Read
                </button>
                <button onClick={() => addToList(book, 'reading')}
                  className="border border-[#6a5a10] hover:bg-[#6a5a10] text-[#c9a84c] text-xs py-1.5 rounded-lg transition">
                  📖 Reading
                </button>
                <button onClick={() => addToList(book, 'want_to_read')}
                  className="border border-[#1a3a5a] hover:bg-[#1a3a5a] text-[#7ab0d4] text-xs py-1.5 rounded-lg transition">
                  + Want to read
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

    </main>
  )
}