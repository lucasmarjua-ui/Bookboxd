'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Lista() {
  const params  = useParams()
  const id      = params?.id
  const [user, setUser]               = useState(null)
  const [list, setList]               = useState(null)
  const [books, setBooks]             = useState([])
  const [loading, setLoading]         = useState(true)
  const [isOwner, setIsOwner]         = useState(false)
  const [showSearch, setShowSearch]   = useState(false)
  const [searchQuery, setSearch]      = useState('')
  const [searchResults, setResults]   = useState([])
  const [searching, setSearching]     = useState(false)
  const [message, setMessage]         = useState(null)
  const [editingTitle, setEditTitle]  = useState(false)
  const [newTitle, setNewTitle]       = useState('')
  const debounceRef = useRef(null)
  const router      = useRouter()

  useEffect(() => {
    if (!id) return
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      const { data: listData, error } = await supabase
        .from('lists').select('*, profiles(username)').eq('id', id).single()
      if (!listData || error) { router.push('/listas'); return }
      setList(listData)
      setNewTitle(listData.title)
      setIsOwner(user?.id === listData.user_id)
      const { data: booksData } = await supabase
        .from('list_books').select('*').eq('list_id', id).order('position', { ascending: true })
      setBooks(booksData || [])
      setLoading(false)
    }
    load()
  }, [id])

  const searchBooks = useCallback(async (q) => {
    if (!q.trim() || q.trim().length < 2) { setResults([]); setSearching(false); return }
    setSearching(true)
    const isShort = q.trim().split(' ').length <= 2
    const url = isShort
      ? `https://openlibrary.org/search.json?title=${encodeURIComponent(q)}&limit=20&fields=key,title,author_name,cover_i,first_publish_year`
      : `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=20&fields=key,title,author_name,cover_i,first_publish_year`
    const res  = await fetch(url)
    const data = await res.json()
    const qW   = q.toLowerCase().split(' ').filter(w => w.length > 1)
    const seen = new Set()
    const results = (data.docs || [])
      .filter(b => {
        if (!b.title || b.title.length > 100) return false
        const t = b.title.toLowerCase(), a = b.author_name?.[0]?.toLowerCase() || ''
        if (!qW.some(w => t.includes(w) || a.includes(w))) return false
        const k = `${t}-${a}`; if (seen.has(k)) return false; seen.add(k); return true
      })
      .slice(0, 8)
      .map(b => ({
        id: b.key.replace('/works/', ''),
        title: b.title, author: b.author_name?.[0] || 'Unknown',
        year: b.first_publish_year || null,
        cover: b.cover_i ? `https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg` : null,
      }))
    setResults(results); setSearching(false)
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!searchQuery.trim()) { setResults([]); return }
    setSearching(true)
    debounceRef.current = setTimeout(() => searchBooks(searchQuery), 400)
    return () => clearTimeout(debounceRef.current)
  }, [searchQuery, searchBooks])

  async function handleAddBook(book) {
    if (books.some(b => b.book_id === book.id)) {
      flash('error', 'Already in this list.'); return
    }
    const { data, error } = await supabase.from('list_books').insert({
      list_id: id, book_id: book.id, book_title: book.title,
      book_cover: book.cover, book_author: book.author, position: books.length,
    }).select().single()
    if (!error && data) {
      setBooks(p => [...p, data])
      await supabase.from('lists').update({ updated_at: new Date().toISOString() }).eq('id', id)
      flash('success', `"${book.title}" added.`)
    }
  }

  async function handleRemoveBook(bookId) {
    await supabase.from('list_books').delete().eq('id', bookId)
    setBooks(p => p.filter(b => b.id !== bookId))
  }

  async function handleSaveTitle() {
    if (!newTitle.trim()) return
    await supabase.from('lists').update({ title: newTitle.trim() }).eq('id', id)
    setList(p => ({ ...p, title: newTitle.trim() })); setEditTitle(false)
  }

  function flash(type, text) {
    setMessage({ type, text }); setTimeout(() => setMessage(null), 2500)
  }

  if (loading) return (
    <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <span style={{ fontSize: '2.5rem', color: '#c9a84c' }}>✦</span>
        <p style={{ color: '#a89070', marginTop: '1rem', fontFamily: 'var(--font-lora)', fontSize: '13px', letterSpacing: '0.1em' }}>Loading list...</p>
      </div>
    </main>
  )

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .page-in   { animation: fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        .search-in { animation: fadeUp 0.3s cubic-bezier(0.22,1,0.36,1) both; }
        .msg-in    { animation: msgIn 0.25s ease both; }

        .book-card {
          position: relative;
          display: flex; flex-direction: column; gap: 8px;
        }
        .book-cover {
          aspect-ratio: 2/3;
          background: #141008;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid rgba(201,168,76,0.08);
          transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
          box-shadow: 0 4px 16px rgba(0,0,0,0.35);
        }
        .book-card:hover .book-cover {
          border-color: rgba(201,168,76,0.28);
          box-shadow: 0 8px 28px rgba(0,0,0,0.5);
          transform: translateY(-3px);
        }
        .book-cover img {
          width: 100%; height: 100%; object-fit: cover;
          transition: transform 0.35s ease;
        }
        .book-card:hover .book-cover img { transform: scale(1.04); }

        .book-num {
          position: absolute; top: 8px; left: 8px;
          width: 20px; height: 20px; border-radius: 6px;
          background: rgba(10,9,6,0.85);
          border: 1px solid rgba(201,168,76,0.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700; color: #c9a84c;
          font-family: var(--font-playfair);
          backdrop-filter: blur(4px);
        }
        .book-remove {
          position: absolute; top: 8px; right: 8px;
          width: 24px; height: 24px; border-radius: 6px;
          background: rgba(10,9,6,0.85);
          border: 1px solid rgba(255,255,255,0.06);
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.2); font-size: 12px;
          cursor: pointer; transition: all 0.15s;
          opacity: 0; backdrop-filter: blur(4px);
        }
        .book-card:hover .book-remove { opacity: 1; }
        .book-remove:hover { background: rgba(180,40,20,0.5); color: #fff; border-color: rgba(180,40,20,0.4); }

        /* Search results */
        .sr-item {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 12px; border-radius: 10px;
          border: 1px solid transparent;
          transition: background 0.15s, border-color 0.15s;
          cursor: default;
        }
        .sr-item:hover { background: rgba(255,255,255,0.03); border-color: rgba(201,168,76,0.08); }

        .add-btn {
          flex-shrink: 0; font-size: 11px; padding: 5px 12px;
          border-radius: 7px; cursor: pointer; transition: all 0.15s;
          font-family: var(--font-lora); letter-spacing: 0.04em;
          white-space: nowrap;
        }
        .add-btn.can-add {
          background: transparent;
          border: 1px solid rgba(201,168,76,0.25);
          color: rgba(201,168,76,0.7);
        }
        .add-btn.can-add:hover {
          background: rgba(201,168,76,0.1);
          border-color: rgba(201,168,76,0.5);
          color: #c9a84c;
        }
        .add-btn.added {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.2);
          cursor: default;
        }

        .title-input {
          background: rgba(201,168,76,0.04);
          border: 1px solid rgba(201,168,76,0.3);
          border-radius: 10px; padding: 8px 14px;
          color: #e8dcc8; outline: none;
          font-family: var(--font-playfair);
          font-size: clamp(1.6rem, 4vw, 2.2rem);
          font-weight: 700; width: 100%;
          transition: border-color 0.2s;
        }
        .title-input:focus { border-color: rgba(201,168,76,0.6); }

        .edit-btn {
          background: none; border: none; cursor: pointer;
          color: rgba(255,255,255,0.15); padding: 6px;
          border-radius: 6px; transition: all 0.15s;
          display: flex; align-items: center; justify-content: center;
        }
        .edit-btn:hover { color: #c9a84c; background: rgba(201,168,76,0.08); }

        .vis-badge {
          font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;
          padding: 4px 10px; border-radius: 20px;
          font-family: var(--font-playfair); flex-shrink: 0;
        }
        .vis-badge.public  { border: 1px solid rgba(120,180,60,0.25); color: rgba(168,200,112,0.8); }
        .vis-badge.private { border: 1px solid rgba(255,255,255,0.07); color: rgba(255,255,255,0.2); }

        .main-cta {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(201,168,76,0.1);
          border: 1px solid rgba(201,168,76,0.3);
          color: #c9a84c; border-radius: 10px;
          padding: 9px 20px; cursor: pointer;
          font-size: 13px; font-family: var(--font-lora);
          letter-spacing: 0.06em; transition: all 0.2s;
        }
        .main-cta:hover {
          background: rgba(201,168,76,0.16);
          border-color: rgba(201,168,76,0.5);
        }
        .main-cta.cancel {
          background: transparent;
          border-color: rgba(255,255,255,0.07);
          color: rgba(255,255,255,0.25);
        }
        .main-cta.cancel:hover {
          border-color: rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.5);
        }

        .empty-state {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 80px 24px;
          border: 1px solid rgba(201,168,76,0.08);
          border-radius: 16px;
          background: radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.03) 0%, transparent 60%);
          text-align: center;
        }

        /* Scrollbar for search results */
        .results-scroll::-webkit-scrollbar { width: 4px; }
        .results-scroll::-webkit-scrollbar-track { background: transparent; }
        .results-scroll::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.15); border-radius: 2px; }
      `}</style>

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px 80px' }} className="page-in">

        {/* ── Breadcrumb ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px' }}>
          <Link href="/listas" style={{
            color: 'rgba(201,168,76,0.6)', fontSize: '12px',
            letterSpacing: '0.08em', textDecoration: 'none',
            fontFamily: 'var(--font-lora)',
            transition: 'color 0.15s',
          }}
            onMouseEnter={e => e.target.style.color = '#c9a84c'}
            onMouseLeave={e => e.target.style.color = 'rgba(201,168,76,0.6)'}
          >
            ← My Lists
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.08)', fontSize: '12px' }}>·</span>
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px', fontFamily: 'var(--font-lora)' }}>
            {list.profiles?.username}
          </span>
        </div>

        {/* ── Header ── */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {editingTitle && isOwner ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input
                    type="text" value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSaveTitle(); if (e.key === 'Escape') setEditTitle(false) }}
                    className="title-input"
                    autoFocus
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleSaveTitle} style={{
                      background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)',
                      color: '#c9a84c', borderRadius: '8px', padding: '6px 14px',
                      cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-lora)',
                      letterSpacing: '0.06em', transition: 'all 0.15s',
                    }}>Save</button>
                    <button onClick={() => setEditTitle(false)} style={{
                      background: 'none', border: '1px solid rgba(255,255,255,0.06)',
                      color: 'rgba(255,255,255,0.25)', borderRadius: '8px', padding: '6px 14px',
                      cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-lora)',
                      transition: 'all 0.15s',
                    }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h1 style={{
                    fontFamily: 'var(--font-playfair)',
                    fontSize: 'clamp(1.8rem, 5vw, 2.8rem)',
                    fontWeight: 700, color: '#e8dcc8',
                    margin: 0, lineHeight: 1.1, letterSpacing: '0.02em',
                  }}>
                    {list.title}
                  </h1>
                  {isOwner && (
                    <button className="edit-btn" onClick={() => setEditTitle(true)} title="Edit title">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>
            <span className={`vis-badge ${list.is_public ? 'public' : 'private'}`}>
              {list.is_public ? 'Public' : 'Private'}
            </span>
          </div>

          {list.description && (
            <p style={{
              color: 'rgba(168,144,112,0.7)', fontStyle: 'italic',
              marginTop: '12px', fontSize: '14px',
              fontFamily: 'var(--font-lora)', lineHeight: 1.6,
            }}>{list.description}</p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ height: '1px', width: '32px', background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.25))' }} />
              <span style={{ color: 'rgba(201,168,76,0.25)', fontSize: '9px' }}>✦</span>
              <div style={{ height: '1px', width: '32px', background: 'linear-gradient(to left, transparent, rgba(201,168,76,0.25))' }} />
            </div>
            <span style={{
              color: 'rgba(255,255,255,0.18)', fontSize: '12px',
              fontFamily: 'var(--font-lora)',
            }}>
              {books.length} {books.length === 1 ? 'book' : 'books'}
            </span>
          </div>
        </div>

        {/* ── Flash message ── */}
        {message && (
          <div className="msg-in" style={{
            marginBottom: '20px',
            padding: '12px 18px',
            borderRadius: '10px',
            fontSize: '13px',
            fontFamily: 'var(--font-lora)',
            display: 'flex', alignItems: 'center', gap: '8px',
            ...(message.type === 'success'
              ? { background: 'rgba(80,140,40,0.1)', border: '1px solid rgba(120,180,60,0.2)', color: 'rgba(168,200,112,0.9)' }
              : { background: 'rgba(180,60,30,0.1)', border: '1px solid rgba(180,60,30,0.2)', color: 'rgba(220,120,80,0.9)' }
            ),
          }}>
            <span>{message.type === 'success' ? '✓' : '×'}</span>
            {message.text}
          </div>
        )}

        {/* ── Add books CTA ── */}
        {isOwner && (
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className={`main-cta${showSearch ? ' cancel' : ''}`}
                onClick={() => { setShowSearch(!showSearch); setSearch(''); setResults([]) }}>
                {showSearch ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    Cancel
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Add books
                  </>
                )}
              </button>
            </div>

            {/* Search panel */}
            {showSearch && (
              <div className="search-in" style={{
                marginTop: '14px',
                background: '#0e0c08',
                border: '1px solid rgba(201,168,76,0.12)',
                borderRadius: '14px',
                padding: '20px',
              }}>
                {/* Input */}
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '10px', padding: '0 14px', height: '42px',
                    transition: 'border-color 0.2s',
                  }}
                    onFocus={() => {}}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      background: 'rgba(255,255,255,0.025)',
                      border: `1px solid ${searchQuery ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: '10px', padding: '0 14px', height: '42px',
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke={searchQuery ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.15)'}
                      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      style={{ flexShrink: 0, transition: 'stroke 0.2s' }}>
                      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    </svg>
                    <input
                      type="text" value={searchQuery}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search books to add..."
                      autoFocus
                      style={{
                        flex: 1, background: 'none', border: 'none', outline: 'none',
                        color: '#e8dcc8', fontSize: '13px', fontFamily: 'var(--font-lora)',
                      }}
                    />
                    {searching && (
                      <div style={{
                        width: '14px', height: '14px',
                        border: '2px solid rgba(201,168,76,0.15)',
                        borderTopColor: 'rgba(201,168,76,0.6)',
                        borderRadius: '50%',
                        animation: 'spin 0.7s linear infinite',
                        flexShrink: 0,
                      }} />
                    )}
                    {searchQuery && !searching && (
                      <button onClick={() => setSearch('')} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'rgba(255,255,255,0.15)', fontSize: '16px',
                        padding: 0, lineHeight: 1, flexShrink: 0, transition: 'color 0.15s',
                      }}
                        onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.4)'}
                        onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.15)'}
                      >×</button>
                    )}
                  </div>
                </div>

                {/* Results */}
                {searchResults.length > 0 && (
                  <div className="results-scroll" style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {searchResults.map(book => {
                      const inList = books.some(b => b.book_id === book.id)
                      return (
                        <div key={book.id} className="sr-item">
                          {book.cover ? (
                            <img src={book.cover} alt={book.title}
                              style={{ width: '32px', height: '48px', objectFit: 'cover', borderRadius: '5px', flexShrink: 0, border: '1px solid rgba(255,255,255,0.06)' }} />
                          ) : (
                            <div style={{
                              width: '32px', height: '48px', borderRadius: '5px', flexShrink: 0,
                              background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.1)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '14px',
                            }}>📖</div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                              margin: 0, fontFamily: 'var(--font-playfair)',
                              color: '#e8dcc8', fontSize: '13px', fontWeight: 600,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>{book.title}</p>
                            <p style={{ margin: '2px 0 0', color: 'rgba(168,144,112,0.7)', fontSize: '11px', fontFamily: 'var(--font-lora)' }}>
                              {book.author}{book.year ? ` · ${book.year}` : ''}
                            </p>
                          </div>
                          <button
                            className={`add-btn ${inList ? 'added' : 'can-add'}`}
                            onClick={() => !inList && handleAddBook(book)}
                            disabled={inList}
                          >
                            {inList ? '✓ Added' : '+ Add'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
                {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                  <p style={{ color: 'rgba(255,255,255,0.18)', fontSize: '13px', fontStyle: 'italic', fontFamily: 'var(--font-lora)', textAlign: 'center', padding: '20px 0' }}>
                    No results for "{searchQuery}"
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Books grid ── */}
        {books.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: '2.5rem', color: 'rgba(201,168,76,0.3)', marginBottom: '16px', display: 'block' }}>✦</span>
            <p style={{ color: 'rgba(168,144,112,0.5)', fontStyle: 'italic', fontFamily: 'var(--font-lora)', fontSize: '14px', marginBottom: '16px' }}>
              This list has no books yet.
            </p>
            {isOwner && (
              <button onClick={() => setShowSearch(true)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(201,168,76,0.5)', fontSize: '13px',
                fontFamily: 'var(--font-lora)', letterSpacing: '0.06em',
                transition: 'color 0.15s',
              }}
                onMouseEnter={e => e.target.style.color = '#c9a84c'}
                onMouseLeave={e => e.target.style.color = 'rgba(201,168,76,0.5)'}
              >
                Add your first book →
              </button>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: '20px',
          }}>
            {books.map((book, i) => (
              <div key={book.id} className="book-card">
                <Link href={`/libro/${book.book_id}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <div className="book-cover">
                    {book.book_cover
                      ? <img src={book.book_cover} alt={book.book_title} />
                      : (
                        <div style={{
                          width: '100%', height: '100%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '2rem', color: 'rgba(201,168,76,0.15)',
                          background: 'linear-gradient(135deg, #141008, #0e0c06)',
                        }}>📖</div>
                      )
                    }
                  </div>
                </Link>

                <span className="book-num">{i + 1}</span>

                {isOwner && (
                  <button className="book-remove" onClick={() => handleRemoveBook(book.id)} title="Remove">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                )}

                <Link href={`/libro/${book.book_id}`} style={{ textDecoration: 'none' }}>
                  <p style={{
                    margin: 0, fontFamily: 'var(--font-playfair)',
                    color: 'rgba(232,220,200,0.85)', fontSize: '12px', fontWeight: 600,
                    lineHeight: 1.35, display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    transition: 'color 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.color = '#c9a84c'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(232,220,200,0.85)'}
                  >
                    {book.book_title}
                  </p>
                </Link>
                <p style={{
                  margin: 0, color: 'rgba(255,255,255,0.2)',
                  fontSize: '11px', fontFamily: 'var(--font-lora)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {book.book_author}
                </p>
              </div>
            ))}
          </div>
        )}

      </main>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}