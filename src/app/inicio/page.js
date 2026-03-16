'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function greeting() {
  const h = new Date().getHours()
  if (h < 6)  return 'Still up reading?'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  if (h < 22) return 'Good evening'
  return 'Good night'
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
}

// ─── Animated progress ring ────────────────────────────────────────────────────
function Ring({ value, max, size = 72, stroke = 4, color = '#c9a84c', children }) {
  const r   = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct  = max > 0 ? Math.min(value / max, 1) : 0
  const [animated, setAnimated] = useState(0)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setAnimated(pct))
    return () => cancelAnimationFrame(raf)
  }, [pct])

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - animated)}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column',
      }}>{children}</div>
    </div>
  )
}

// ─── Star rating ───────────────────────────────────────────────────────────────
function Stars({ rating, size = 10 }) {
  return (
    <span style={{ display: 'inline-flex', gap: '1px' }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} style={{ fontSize: size, color: s <= rating ? '#c9a84c' : 'rgba(255,255,255,0.07)' }}>★</span>
      ))}
    </span>
  )
}

// ─── Animated counter ─────────────────────────────────────────────────────────
function Counter({ to, duration = 1200 }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!to) return
    let start = null
    const step = ts => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      setVal(Math.floor(p * p * to))   // ease-out quad
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [to])
  return <>{val.toLocaleString()}</>
}

// ─── Book cover with hover ─────────────────────────────────────────────────────
function BookCover({ book, href, rank }) {
  const [hover, setHover] = useState(false)
  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'block', position: 'relative' }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div style={{
        width: '100%', aspectRatio: '2/3',
        borderRadius: '8px', overflow: 'hidden',
        border: `1px solid ${hover ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.06)'}`,
        boxShadow: hover ? '0 12px 30px rgba(0,0,0,0.55)' : '0 4px 14px rgba(0,0,0,0.35)',
        transform: hover ? 'translateY(-4px) scale(1.03)' : 'none',
        transition: 'all 0.25s cubic-bezier(0.22,1,0.36,1)',
        background: '#141008',
      }}>
        {book.book_cover
          ? <img src={book.book_cover} alt={book.book_title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(201,168,76,0.15)', fontSize: '1.5rem' }}>📖</div>
        }
        {rank && (
          <div style={{
            position: 'absolute', top: '6px', left: '6px',
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
            borderRadius: '5px', padding: '2px 6px',
            fontSize: '10px', fontFamily: 'var(--font-playfair)',
            color: 'rgba(201,168,76,0.8)', fontWeight: 700,
          }}>{rank}</div>
        )}
      </div>
      {hover && (
        <div style={{
          position: 'absolute', bottom: '-36px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(10,9,6,0.95)', border: '1px solid rgba(201,168,76,0.15)',
          borderRadius: '7px', padding: '5px 10px', whiteSpace: 'nowrap',
          fontSize: '11px', fontFamily: 'var(--font-playfair)', color: '#e8dcc8',
          zIndex: 10, pointerEvents: 'none',
          animation: 'fadeUp 0.15s ease both',
        }}>{book.book_title}</div>
      )}
    </Link>
  )
}

// ─── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ label, href, hrefLabel = 'See all' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
      <span style={{ color: 'rgba(201,168,76,0.35)', fontSize: '8px' }}>◆</span>
      <h2 style={{
        fontFamily: 'var(--font-playfair)', fontSize: '13px', fontWeight: 700,
        color: 'rgba(232,220,200,0.5)', letterSpacing: '0.18em', textTransform: 'uppercase',
        margin: 0,
      }}>{label}</h2>
      <div style={{ flex: 1, height: '1px', background: 'rgba(201,168,76,0.07)' }} />
      {href && (
        <Link href={href} style={{
          fontSize: '11px', color: 'rgba(201,168,76,0.35)',
          fontFamily: 'var(--font-lora)', textDecoration: 'none',
          letterSpacing: '0.05em', transition: 'color 0.15s',
        }}
          onMouseEnter={e => e.target.style.color = 'rgba(201,168,76,0.7)'}
          onMouseLeave={e => e.target.style.color = 'rgba(201,168,76,0.35)'}
        >{hrefLabel} →</Link>
      )}
    </div>
  )
}

// ─── Currently reading card ────────────────────────────────────────────────────
function ReadingCard({ book, progress }) {
  const pct = progress?.total_pages > 0
    ? Math.min((progress.current_page / progress.total_pages) * 100, 100)
    : 0

  return (
    <Link href={`/libro/${book.book_id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{
        background: 'linear-gradient(135deg, #0e0c08, #12100a)',
        border: '1px solid rgba(201,168,76,0.1)',
        borderRadius: '14px', padding: '18px',
        display: 'flex', gap: '16px',
        transition: 'border-color 0.2s, transform 0.2s',
        cursor: 'pointer',
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.25)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.1)'; e.currentTarget.style.transform = 'none' }}
      >
        {/* Cover */}
        <div style={{
          width: '52px', height: '78px', borderRadius: '7px', overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
          boxShadow: '0 6px 18px rgba(0,0,0,0.4)', background: '#141008',
        }}>
          {book.book_cover
            ? <img src={book.book_cover} alt={book.book_title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(201,168,76,0.15)' }}>📖</div>
          }
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: '0 0 2px', fontFamily: 'var(--font-playfair)', color: '#e8dcc8', fontSize: '14px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {book.book_title}
            </p>
            <p style={{ margin: '0 0 10px', color: 'rgba(168,144,112,0.65)', fontSize: '12px', fontFamily: 'var(--font-lora)' }}>
              {book.book_author}
            </p>
          </div>
          {/* Progress bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-lora)' }}>
                {progress?.current_page ? `Page ${progress.current_page}` : 'In progress'}
                {progress?.total_pages ? ` of ${progress.total_pages}` : ''}
              </span>
              <span style={{ fontSize: '10px', color: 'rgba(201,168,76,0.6)', fontFamily: 'var(--font-playfair)', fontWeight: 600 }}>
                {Math.round(pct)}%
              </span>
            </div>
            <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '2px',
                background: 'linear-gradient(to right, rgba(201,168,76,0.6), #c9a84c)',
                width: `${pct}%`,
                transition: 'width 1s cubic-bezier(0.22,1,0.36,1)',
                boxShadow: '0 0 8px rgba(201,168,76,0.4)',
              }} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function Inicio() {
  const [user,        setUser]    = useState(null)
  const [profile,     setProfile] = useState(null)
  const [reading,     setReading] = useState([])     // currently reading
  const [recentRead,  setRecent]  = useState([])     // last read books
  const [recentRevs,  setRevs]    = useState([])     // recent community reviews
  const [stats,       setStats]   = useState({ read: 0, reviews: 0, pages: 0, streak: 0 })
  const [progress,    setProg]    = useState({})     // book_id → progress
  const [yearGoal,    setGoal]    = useState(null)
  const [loaded,      setLoaded]  = useState(false)
  const [phase,       setPhase]   = useState(0)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUser(user)

      const [
        { data: prof },
        { data: booklist },
        { data: logs },
        { data: reviews },
        { data: allRevs },
        { data: progData },
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('booklist').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('reading_log').select('pages_read, log_date').eq('user_id', user.id).order('log_date', { ascending: false }),
        supabase.from('reviews').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('reviews').select('*, profiles(username)').order('created_at', { ascending: false }).limit(8),
        supabase.from('reading_progress').select('*').eq('user_id', user.id),
      ])

      setProfile(prof)

      const readList    = (booklist || []).filter(b => b.status === 'read')
      const readingList = (booklist || []).filter(b => b.status === 'reading')
      setReading(readingList.slice(0, 3))
      setRecent(readList.slice(0, 7))
      setRevs((allRevs || []).slice(0, 6))

      // Progress map
      const pm = {}
      ;(progData || []).forEach(p => pm[p.book_id] = p)
      setProg(pm)

      // Stats
      const totalPages = (logs || []).reduce((a, l) => a + (l.pages_read || 0), 0)
      const today  = new Date().toISOString().split('T')[0]
      const dates  = [...new Set((logs || []).map(l => l.log_date))].sort((a, b) => b.localeCompare(a))
      let streak = 0, cur = today
      for (const d of dates) {
        if (d === cur) { streak++; const dt = new Date(cur); dt.setDate(dt.getDate() - 1); cur = dt.toISOString().split('T')[0] }
        else break
      }
      setStats({ read: readList.length, reviews: (reviews || []).length, pages: totalPages, streak })

      // Year goal (books read this year vs goal if set)
      const thisYear = new Date().getFullYear()
      const booksThisYear = readList.filter(b => new Date(b.created_at).getFullYear() === thisYear).length
      setGoal({ current: booksThisYear, target: prof?.reading_goal || 12 })

      setLoaded(true)
      setTimeout(() => setPhase(1), 60)
      setTimeout(() => setPhase(2), 300)
      setTimeout(() => setPhase(3), 550)
    }
    load()
  }, [])

  const displayName = profile?.username || user?.email?.split('@')[0] || 'Reader'

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        .ph { opacity: 0; }
        .ph.p1 { animation: fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both; }
        .ph.p2 { animation: fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) 0.12s both; }
        .ph.p3 { animation: fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) 0.24s both; }

        .stat-card {
          background: #0a0906;
          border: 1px solid rgba(201,168,76,0.07);
          border-radius: 14px; padding: 20px 18px;
          transition: border-color 0.2s, transform 0.2s;
          position: relative; overflow: hidden;
        }
        .stat-card::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.04) 0%, transparent 65%);
          pointer-events: none;
        }
        .stat-card:hover { border-color: rgba(201,168,76,0.16); transform: translateY(-2px); }

        .review-card {
          background: #0a0906;
          border: 1px solid rgba(255,255,255,0.04);
          border-radius: 12px; padding: 16px;
          display: flex; gap: 12px;
          text-decoration: none;
          transition: border-color 0.2s, transform 0.2s;
        }
        .review-card:hover { border-color: rgba(201,168,76,0.18); transform: translateX(3px); }

        .quick-link {
          display: flex; align-items: center; gap: 11px;
          padding: 13px 16px; border-radius: 11px;
          text-decoration: none;
          border: 1px solid rgba(255,255,255,0.04);
          background: rgba(255,255,255,0.01);
          transition: all 0.18s;
          color: rgba(232,220,200,0.45);
          font-size: 13px; font-family: var(--font-lora); letter-spacing: 0.03em;
        }
        .quick-link:hover {
          border-color: rgba(201,168,76,0.18);
          background: rgba(201,168,76,0.04);
          color: rgba(232,220,200,0.8);
          transform: translateX(3px);
        }
        .quick-link:hover .ql-icon { stroke: rgba(201,168,76,0.7); }
        .ql-icon { stroke: rgba(255,255,255,0.2); transition: stroke 0.18s; flex-shrink: 0; }
      `}</style>

      {loaded && (
        <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '44px 28px 80px' }}>

          {/* ══ HERO HEADER ══════════════════════════════════════════════════ */}
          <div className={`ph ${phase >= 1 ? 'p1' : ''}`} style={{ marginBottom: '52px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' }}>
              <div>
                <p style={{
                  color: '#c9a84c', fontSize: '10px',
                  letterSpacing: '0.3em', textTransform: 'uppercase',
                  fontFamily: 'var(--font-playfair)', marginBottom: '8px', opacity: 0.65,
                }}>
                  {greeting()}
                </p>
                <h1 style={{
                  fontFamily: 'var(--font-playfair)',
                  fontSize: 'clamp(2rem, 4vw, 3.2rem)',
                  fontWeight: 700, color: '#e8dcc8',
                  margin: 0, lineHeight: 1.05,
                  letterSpacing: '0.02em',
                }}>
                  {displayName}
                </h1>
                {profile?.bio && (
                  <p style={{ margin: '10px 0 0', fontFamily: 'var(--font-lora)', color: 'rgba(168,144,112,0.55)', fontStyle: 'italic', fontSize: '14px' }}>
                    "{profile.bio}"
                  </p>
                )}
              </div>

              {/* Year goal ring */}
              {yearGoal && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                  <Ring value={yearGoal.current} max={yearGoal.target} size={80} stroke={5}>
                    <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '16px', fontWeight: 700, color: '#c9a84c', lineHeight: 1 }}>
                      {yearGoal.current}
                    </span>
                    <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-lora)', letterSpacing: '0.05em' }}>
                      /{yearGoal.target}
                    </span>
                  </Ring>
                  <div>
                    <p style={{ margin: 0, fontFamily: 'var(--font-playfair)', fontSize: '12px', color: 'rgba(232,220,200,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      {new Date().getFullYear()} goal
                    </p>
                    <p style={{ margin: '3px 0 0', fontFamily: 'var(--font-lora)', fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>
                      {Math.max(0, yearGoal.target - yearGoal.current)} books to go
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Decorative line */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '28px' }}>
              <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, rgba(201,168,76,0.12), transparent)' }} />
              <span style={{ color: 'rgba(201,168,76,0.2)', fontSize: '9px' }}>✦</span>
            </div>
          </div>

          {/* ══ MAIN GRID (left column + right column) ══════════════════════ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '32px', alignItems: 'start' }}>

            {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

              {/* Stats row */}
              <div className={`ph ${phase >= 1 ? 'p1' : ''}`}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  {[
                    { value: stats.read,    label: 'Books read',  color: 'rgba(168,200,112,0.85)', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
                    { value: stats.reviews, label: 'Reviews',     color: '#c9a84c',                icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
                    { value: stats.pages,   label: 'Pages read',  color: 'rgba(122,176,212,0.85)', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                    { value: stats.streak,  label: 'Day streak',  color: 'rgba(220,140,80,0.85)',  icon: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z' },
                  ].map((s, i) => (
                    <div key={i} className="stat-card">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke={s.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                        style={{ marginBottom: '12px', opacity: 0.7 }}>
                        <path d={s.icon}/>
                      </svg>
                      <p style={{
                        fontFamily: 'var(--font-playfair)',
                        fontSize: 'clamp(1.4rem, 2.5vw, 1.9rem)',
                        fontWeight: 700, color: s.color,
                        margin: '0 0 4px', lineHeight: 1,
                      }}>
                        <Counter to={s.value} />
                      </p>
                      <p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.18)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-lora)' }}>
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Currently reading */}
              {reading.length > 0 && (
                <div className={`ph ${phase >= 2 ? 'p2' : ''}`}>
                  <SectionHeader label="Currently reading" href="/perfil" hrefLabel="My shelf" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {reading.map(book => (
                      <ReadingCard key={book.id} book={book} progress={progress[book.book_id]} />
                    ))}
                  </div>
                </div>
              )}

              {/* Recent community reviews */}
              {recentRevs.length > 0 && (
                <div className={`ph ${phase >= 3 ? 'p3' : ''}`}>
                  <SectionHeader label="Latest from the community" href="/descubrir" hrefLabel="Discover" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {recentRevs.map(r => (
                      <Link key={r.id} href={`/libro/${r.book_id}`} className="review-card">
                        <div style={{
                          width: '36px', height: '52px', borderRadius: '5px', overflow: 'hidden',
                          border: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, background: '#141008',
                        }}>
                          {r.book_cover
                            ? <img src={r.book_cover} alt={r.book_title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(201,168,76,0.15)', fontSize: '1rem' }}>📖</div>
                          }
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
                            <span style={{ fontFamily: 'var(--font-playfair)', color: '#e8dcc8', fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {r.book_title}
                            </span>
                            <span style={{ fontSize: '11px', color: 'rgba(201,168,76,0.5)', fontFamily: 'var(--font-lora)', flexShrink: 0 }}>
                              by {r.profiles?.username}
                            </span>
                          </div>
                          <div style={{ marginBottom: '4px' }}>
                            <Stars rating={r.rating} />
                          </div>
                          {r.content && (
                            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(168,144,112,0.55)', fontFamily: 'var(--font-lora)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              "{r.content}"
                            </p>
                          )}
                        </div>
                        <span style={{ color: 'rgba(255,255,255,0.08)', fontSize: '11px', fontFamily: 'var(--font-lora)', flexShrink: 0, alignSelf: 'center' }}>
                          {formatDate(r.created_at)}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT COLUMN ────────────────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', position: 'sticky', top: '24px' }}>

              {/* Recently read shelf */}
              {recentRead.length > 0 && (
                <div className={`ph ${phase >= 2 ? 'p2' : ''}`}>
                  <SectionHeader label="Recently read" href="/perfil" />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '8px' }}>
                    {recentRead.slice(0, 4).map((book, i) => (
                      <BookCover key={book.id} book={book} href={`/libro/${book.book_id}`} />
                    ))}
                  </div>
                  {recentRead.length > 4 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      {recentRead.slice(4, 7).map((book, i) => (
                        <BookCover key={book.id} book={book} href={`/libro/${book.book_id}`} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Quick links */}
              <div className={`ph ${phase >= 3 ? 'p3' : ''}`}>
                <SectionHeader label="Quick access" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[
                    { href: '/buscar',      label: 'Search books',   icon: 'M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z' },
                    { href: '/lectura',     label: 'Reading tracker', icon: 'M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z' },
                    { href: '/listas',      label: 'My lists',        icon: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2' },
                    { href: '/logros',      label: 'Achievements',    icon: 'M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM8.21 13.89L7 23l5-3 5 3-1.21-9.12' },
                    { href: '/estadisticas',label: 'My stats',        icon: 'M18 20V10M12 20V4M6 20v-6' },
                    { href: '/bookmark',    label: 'My bookmark',     icon: 'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z' },
                  ].map(item => (
                    <Link key={item.href} href={item.href} className="quick-link">
                      <svg className="ql-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d={item.icon}/>
                      </svg>
                      {item.label}
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto' }}>
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Profile card */}
              <div className={`ph ${phase >= 3 ? 'p3' : ''}`}>
                <Link href="/perfil" style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{
                    background: 'linear-gradient(145deg, #0e0c08, #12100a)',
                    border: '1px solid rgba(201,168,76,0.08)',
                    borderRadius: '14px', padding: '20px',
                    transition: 'border-color 0.2s',
                    position: 'relative', overflow: 'hidden',
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(201,168,76,0.2)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(201,168,76,0.08)'}
                  >
                    {/* Glow */}
                    <div style={{ position: 'absolute', top: 0, right: 0, width: '80px', height: '80px', background: 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)', borderRadius: '50%', transform: 'translate(20px, -20px)', pointerEvents: 'none' }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <div style={{
                        width: '42px', height: '42px', borderRadius: '50%',
                        background: 'rgba(201,168,76,0.1)', border: '2px solid rgba(201,168,76,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#c9a84c', fontSize: '18px', fontWeight: 700,
                        fontFamily: 'var(--font-playfair)', flexShrink: 0,
                      }}>
                        {displayName[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontFamily: 'var(--font-playfair)', color: '#e8dcc8', fontSize: '14px', fontWeight: 600 }}>{displayName}</p>
                        <p style={{ margin: '2px 0 0', fontSize: '10px', color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-lora)', letterSpacing: '0.08em' }}>View profile →</p>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                      {[
                        { v: stats.read,    l: 'Read' },
                        { v: stats.reviews, l: 'Reviews' },
                        { v: stats.streak,  l: 'Streak' },
                      ].map(s => (
                        <div key={s.l} style={{ textAlign: 'center', padding: '8px 4px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                          <p style={{ margin: 0, fontFamily: 'var(--font-playfair)', color: '#c9a84c', fontSize: '16px', fontWeight: 700 }}>{s.v}</p>
                          <p style={{ margin: '2px 0 0', fontSize: '9px', color: 'rgba(255,255,255,0.18)', fontFamily: 'var(--font-lora)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{s.l}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Link>
              </div>

            </div>
          </div>

          {/* ══ BOTTOM — reading history heatmap hint ════════════════════════ */}
          {stats.read === 0 && stats.reviews === 0 && (
            <div className={`ph ${phase >= 3 ? 'p3' : ''}`} style={{ marginTop: '60px', textAlign: 'center' }}>
              <div style={{
                display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
                padding: '40px 60px',
                background: 'radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.04) 0%, transparent 70%)',
                border: '1px solid rgba(201,168,76,0.08)', borderRadius: '20px',
              }}>
                <span style={{ fontSize: '2.5rem', color: 'rgba(201,168,76,0.2)' }}>✦</span>
                <h2 style={{ fontFamily: 'var(--font-playfair)', color: 'rgba(232,220,200,0.6)', fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>
                  Your library awaits
                </h2>
                <p style={{ color: 'rgba(168,144,112,0.45)', fontFamily: 'var(--font-lora)', fontStyle: 'italic', fontSize: '13px', margin: 0 }}>
                  Start by searching for a book you've read.
                </p>
                <Link href="/buscar" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)',
                  color: '#c9a84c', borderRadius: '10px', padding: '10px 22px',
                  fontSize: '13px', fontFamily: 'var(--font-playfair)', letterSpacing: '0.08em',
                  textDecoration: 'none', transition: 'all 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.16)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.1)' }}
                >
                  Search books →
                </Link>
              </div>
            </div>
          )}

        </main>
      )}
    </>
  )
}