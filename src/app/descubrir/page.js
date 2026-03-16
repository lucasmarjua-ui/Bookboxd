'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const TABS = [
  { id: 'leidos',    label: 'Most Read',    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { id: 'valorados', label: 'Top Rated',    icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
]

const MEDALS = ['🥇', '🥈', '🥉']

function StarRating({ value }) {
  const full  = Math.floor(value)
  const half  = value - full >= 0.25 && value - full < 0.75
  const empty = 5 - full - (half ? 1 : 0)
  return (
    <span style={{ display: 'inline-flex', gap: '1px', alignItems: 'center' }}>
      {Array(full).fill(0).map((_, i) => (
        <svg key={`f${i}`} width="11" height="11" viewBox="0 0 24 24" fill="#c9a84c" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      ))}
      {half && (
        <svg key="h" width="11" height="11" viewBox="0 0 24 24" stroke="none">
          <defs><linearGradient id="hg"><stop offset="50%" stopColor="#c9a84c"/><stop offset="50%" stopColor="rgba(201,168,76,0.15)"/></linearGradient></defs>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="url(#hg)"/>
        </svg>
      )}
      {Array(empty).fill(0).map((_, i) => (
        <svg key={`e${i}`} width="11" height="11" viewBox="0 0 24 24" fill="rgba(201,168,76,0.15)" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      ))}
    </span>
  )
}

export default function Descubrir() {
  const [masLeidos, setMasLeidos]         = useState([])
  const [mejorValorados, setMejorValorados] = useState([])
  const [loading, setLoading]             = useState(true)
  const [activeTab, setActiveTab]         = useState('leidos')

  useEffect(() => {
    async function loadData() {
      const [{ data: leidos }, { data: valorados }] = await Promise.all([
        supabase.from('top_books').select('*').order('veces_leido', { ascending: false }).limit(20),
        supabase.from('top_books').select('*').gte('num_resenas', 1).order('media_rating', { ascending: false }).limit(20),
      ])
      setMasLeidos(leidos || [])
      setMejorValorados(valorados || [])
      setLoading(false)
    }
    loadData()
  }, [])

  const books = activeTab === 'leidos' ? masLeidos : mejorValorados

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes rankIn {
          from { opacity: 0; transform: translateX(-12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .page-in { animation: fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both; }

        .book-row {
          display: flex; align-items: center; gap: 0;
          background: #0e0c08;
          border: 1px solid rgba(255,255,255,0.04);
          border-radius: 14px;
          text-decoration: none;
          overflow: hidden;
          transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
          animation: rankIn 0.35s cubic-bezier(0.22,1,0.36,1) both;
        }
        .book-row:hover {
          border-color: rgba(201,168,76,0.22);
          box-shadow: 0 6px 28px rgba(0,0,0,0.45);
          transform: translateX(3px);
        }

        .rank-col {
          width: 64px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          border-right: 1px solid rgba(255,255,255,0.04);
          align-self: stretch;
          background: rgba(255,255,255,0.01);
        }

        .cover-col {
          width: 56px; height: 84px; flex-shrink: 0;
          overflow: hidden; position: relative;
          margin: 10px 0 10px 16px;
          border-radius: 7px;
          box-shadow: 0 4px 14px rgba(0,0,0,0.45);
          border: 1px solid rgba(255,255,255,0.06);
        }
        .cover-col img {
          width: 100%; height: 100%; object-fit: cover;
          transition: transform 0.35s ease;
        }
        .book-row:hover .cover-col img { transform: scale(1.06); }

        .info-col {
          flex: 1; min-width: 0;
          padding: 0 20px;
        }

        .stat-col {
          flex-shrink: 0;
          padding: 0 24px 0 16px;
          text-align: right;
          border-left: 1px solid rgba(255,255,255,0.04);
          align-self: stretch;
          display: flex; flex-direction: column;
          align-items: flex-end; justify-content: center;
          min-width: 100px;
          background: rgba(255,255,255,0.01);
        }

        .tab-btn {
          display: flex; align-items: center; gap: 7px;
          padding: 10px 20px;
          border: none; background: none; cursor: pointer;
          font-family: var(--font-lora);
          font-size: 13px; letter-spacing: 0.04em;
          transition: color 0.15s;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          color: rgba(255,255,255,0.2);
        }
        .tab-btn:hover { color: rgba(232,220,200,0.6); }
        .tab-btn.active {
          color: #c9a84c;
          border-bottom-color: #c9a84c;
        }

        .top3-card {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(201,168,76,0.12);
          background: linear-gradient(145deg, #120f09, #0e0c08);
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
          text-decoration: none;
          display: flex; flex-direction: column;
        }
        .top3-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(0,0,0,0.55);
          border-color: rgba(201,168,76,0.3);
        }
        .top3-card:hover .top3-img { transform: scale(1.06); }
        .top3-img { width: 100%; aspect-ratio: 2/3; object-fit: cover; transition: transform 0.4s ease; }
      `}</style>

      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 24px 80px' }} className="page-in">

        {/* ── Header ── */}
        <div style={{ marginBottom: '36px' }}>
          <p style={{
            color: '#c9a84c', fontSize: '10px',
            letterSpacing: '0.3em', textTransform: 'uppercase',
            fontFamily: 'var(--font-playfair)', marginBottom: '10px',
          }}>Rankings</p>
          <h1 style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: 'clamp(2rem, 5vw, 2.8rem)',
            fontWeight: 700, color: '#e8dcc8',
            margin: 0, letterSpacing: '0.02em', lineHeight: 1.1,
          }}>Discover</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '14px' }}>
            <div style={{ height: '1px', width: '48px', background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.3))' }} />
            <span style={{ color: 'rgba(201,168,76,0.3)', fontSize: '10px' }}>✦</span>
            <div style={{ height: '1px', width: '48px', background: 'linear-gradient(to left, transparent, rgba(201,168,76,0.3))' }} />
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ borderBottom: '1px solid rgba(201,168,76,0.1)', marginBottom: '32px', display: 'flex', gap: '4px' }}>
          {TABS.map(tab => (
            <button key={tab.id} className={`tab-btn${activeTab === tab.id ? ' active' : ''}`} onClick={() => setActiveTab(tab.id)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d={tab.icon}/>
              </svg>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <span style={{ fontSize: '2.5rem', color: '#c9a84c' }}>✦</span>
            <p style={{ color: '#a89070', marginTop: '1rem', fontFamily: 'var(--font-lora)', fontSize: '13px', letterSpacing: '0.1em' }}>
              Loading rankings...
            </p>
          </div>
        ) : books.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 24px',
            border: '1px solid rgba(201,168,76,0.08)', borderRadius: '16px',
            background: 'radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.03) 0%, transparent 60%)',
          }}>
            <span style={{ fontSize: '2rem', color: 'rgba(201,168,76,0.25)', display: 'block', marginBottom: '12px' }}>✦</span>
            <p style={{ color: 'rgba(168,144,112,0.5)', fontStyle: 'italic', fontFamily: 'var(--font-lora)', marginBottom: '16px' }}>
              Not enough data yet.
            </p>
            <Link href="/buscar" style={{
              color: 'rgba(201,168,76,0.5)', fontSize: '13px',
              fontFamily: 'var(--font-lora)', letterSpacing: '0.06em',
              textDecoration: 'none', transition: 'color 0.15s',
            }}>
              Discover books to get started →
            </Link>
          </div>
        ) : (
          <>
            {/* Top 3 — card grid */}
            {books.length >= 3 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1.15fr 1fr',
                gap: '14px',
                marginBottom: '32px',
                alignItems: 'end',
              }}>
                {/* 2nd */}
                {[1, 0, 2].map((pos) => {
                  const book = books[pos]
                  const isCenter = pos === 0
                  return (
                    <Link key={book.book_id} href={`/libro/${book.book_id}`}
                      className="top3-card"
                      style={{ marginBottom: isCenter ? '0' : '0', order: pos === 1 ? 0 : pos === 0 ? 1 : 2 }}
                    >
                      <div style={{ position: 'relative', overflow: 'hidden' }}>
                        {book.book_cover
                          ? <img src={book.book_cover} alt={book.book_title} className="top3-img" />
                          : (
                            <div style={{
                              width: '100%', aspectRatio: '2/3',
                              background: 'linear-gradient(135deg, #141008, #0e0c06)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '3rem', color: 'rgba(201,168,76,0.15)',
                            }}>📖</div>
                          )
                        }
                        {/* Gradient overlay */}
                        <div style={{
                          position: 'absolute', inset: 0,
                          background: 'linear-gradient(to top, rgba(10,9,6,0.95) 0%, rgba(10,9,6,0.2) 50%, transparent 100%)',
                        }} />
                        {/* Medal */}
                        <div style={{
                          position: 'absolute', top: '10px', left: '10px',
                          fontSize: isCenter ? '22px' : '18px',
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                        }}>{MEDALS[pos]}</div>
                      </div>

                      <div style={{ padding: '14px 14px 16px' }}>
                        <p style={{
                          margin: '0 0 4px', fontFamily: 'var(--font-playfair)',
                          color: '#e8dcc8', fontSize: isCenter ? '14px' : '12px',
                          fontWeight: 700, lineHeight: 1.3,
                          display: '-webkit-box', WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>{book.book_title}</p>
                        <p style={{
                          margin: '0 0 8px', color: 'rgba(168,144,112,0.7)',
                          fontSize: '11px', fontFamily: 'var(--font-lora)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>{book.book_author}</p>
                        {activeTab === 'leidos' ? (
                          <span style={{
                            fontSize: '11px', color: 'rgba(201,168,76,0.7)',
                            fontFamily: 'var(--font-lora)',
                          }}>{book.veces_leido} readers</span>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <StarRating value={parseFloat(book.media_rating)} />
                            <span style={{ fontSize: '11px', color: '#c9a84c', fontFamily: 'var(--font-playfair)', fontWeight: 600 }}>
                              {parseFloat(book.media_rating).toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}

            {/* Rest of the list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {books.slice(3).map((book, i) => {
                const rank = i + 4
                return (
                  <Link
                    key={book.book_id}
                    href={`/libro/${book.book_id}`}
                    className="book-row"
                    style={{ animationDelay: `${i * 0.04}s` }}
                  >
                    {/* Rank */}
                    <div className="rank-col">
                      <span style={{
                        fontFamily: 'var(--font-playfair)',
                        fontSize: '16px', fontWeight: 700,
                        color: 'rgba(255,255,255,0.15)',
                      }}>{rank}</span>
                    </div>

                    {/* Cover */}
                    <div className="cover-col">
                      {book.book_cover
                        ? <img src={book.book_cover} alt={book.book_title} />
                        : (
                          <div style={{
                            width: '100%', height: '100%',
                            background: 'linear-gradient(135deg, #141008, #0e0c06)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.4rem', color: 'rgba(201,168,76,0.15)',
                          }}>📖</div>
                        )
                      }
                    </div>

                    {/* Info */}
                    <div className="info-col">
                      <p style={{
                        margin: '0 0 4px', fontFamily: 'var(--font-playfair)',
                        color: '#e8dcc8', fontSize: '14px', fontWeight: 600,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        transition: 'color 0.15s',
                      }}>{book.book_title}</p>
                      <p style={{
                        margin: 0, color: 'rgba(168,144,112,0.65)',
                        fontSize: '12px', fontFamily: 'var(--font-lora)',
                      }}>{book.book_author}</p>
                    </div>

                    {/* Stat */}
                    <div className="stat-col">
                      {activeTab === 'leidos' ? (
                        <>
                          <span style={{
                            fontFamily: 'var(--font-playfair)', fontSize: '20px',
                            fontWeight: 700, color: 'rgba(168,200,112,0.85)', lineHeight: 1,
                          }}>{book.veces_leido}</span>
                          <span style={{
                            fontSize: '9px', color: 'rgba(255,255,255,0.15)',
                            letterSpacing: '0.15em', textTransform: 'uppercase',
                            fontFamily: 'var(--font-playfair)', marginTop: '3px',
                          }}>readers</span>
                        </>
                      ) : (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                            <span style={{ color: '#c9a84c', fontSize: '11px' }}>★</span>
                            <span style={{
                              fontFamily: 'var(--font-playfair)', fontSize: '20px',
                              fontWeight: 700, color: '#c9a84c', lineHeight: 1,
                            }}>{parseFloat(book.media_rating).toFixed(1)}</span>
                          </div>
                          <span style={{
                            fontSize: '9px', color: 'rgba(255,255,255,0.15)',
                            letterSpacing: '0.12em', textTransform: 'uppercase',
                            fontFamily: 'var(--font-playfair)', marginTop: '3px',
                          }}>{book.num_resenas} {book.num_resenas === 1 ? 'review' : 'reviews'}</span>
                        </>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        )}

      </main>
    </>
  )
}