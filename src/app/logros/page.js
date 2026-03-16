'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const ACHIEVEMENTS = [
  { id: 'first_book',      icon: '📖', title: 'First Chapter',     description: 'Add your first book as read',              category: 'Reading', secret: false },
  { id: 'books_5',         icon: '📚', title: 'Bookworm',           description: 'Read 5 books',                             category: 'Reading', secret: false },
  { id: 'books_10',        icon: '🏛️', title: 'The Library',        description: 'Read 10 books',                            category: 'Reading', secret: false },
  { id: 'books_25',        icon: '🗝️', title: 'The Key',            description: 'Read 25 books',                            category: 'Reading', secret: false },
  { id: 'books_50',        icon: '👑', title: 'Sovereign Reader',   description: 'Read 50 books',                            category: 'Reading', secret: false },
  { id: 'books_100',       icon: '🌌', title: 'A Thousand Lives',   description: 'Read 100 books',                           category: 'Reading', secret: false },
  { id: 'first_review',    icon: '✍️', title: 'The Critic',         description: 'Write your first review',                  category: 'Reviews', secret: false },
  { id: 'reviews_5',       icon: '🖊️', title: 'Literary Voice',     description: 'Write 5 reviews',                          category: 'Reviews', secret: false },
  { id: 'reviews_25',      icon: '📜', title: 'The Chronicler',     description: 'Write 25 reviews',                         category: 'Reviews', secret: false },
  { id: 'perfect_rating',  icon: '⭐', title: 'Masterpiece',        description: 'Give a 5-star rating',                     category: 'Reviews', secret: false },
  { id: 'harsh_critic',    icon: '🗡️', title: 'Harsh Critic',       description: 'Give a 1-star rating',                     category: 'Reviews', secret: true  },
  { id: 'streak_3',        icon: '🔥', title: 'On Fire',            description: 'Read 3 days in a row',                     category: 'Streak',  secret: false },
  { id: 'streak_7',        icon: '⚡', title: 'Unstoppable',        description: 'Read 7 days in a row',                     category: 'Streak',  secret: false },
  { id: 'streak_30',       icon: '🌙', title: 'Night Reader',       description: 'Read 30 days in a row',                    category: 'Streak',  secret: false },
  { id: 'streak_100',      icon: '💎', title: 'Diamond Habit',      description: 'Read 100 days in a row',                   category: 'Streak',  secret: false },
  { id: 'pages_100',       icon: '🌱', title: 'First Pages',        description: 'Read 100 pages total',                     category: 'Pages',   secret: false },
  { id: 'pages_1000',      icon: '🌿', title: 'Deep Reader',        description: 'Read 1,000 pages total',                   category: 'Pages',   secret: false },
  { id: 'pages_10000',     icon: '🌳', title: 'The Great Tree',     description: 'Read 10,000 pages total',                  category: 'Pages',   secret: false },
  { id: 'marathon',        icon: '🏃', title: 'Reading Marathon',   description: 'Log 100+ pages in a single day',           category: 'Pages',   secret: true  },
  { id: 'first_follow',    icon: '🤝', title: 'First Connection',   description: 'Follow another reader',                    category: 'Social',  secret: false },
  { id: 'followers_5',     icon: '✨', title: 'Influencer',         description: 'Get 5 followers',                          category: 'Social',  secret: false },
  { id: 'night_owl',       icon: '🦉', title: 'Night Owl',          description: '???',                                      category: 'Secret',  secret: true  },
  { id: 'want_to_read_20', icon: '🗂️', title: 'Eternal Wishlist',   description: 'Add 20 books to want-to-read',             category: 'Secret',  secret: true  },
]

const CATEGORIES = ['All', 'Reading', 'Reviews', 'Streak', 'Pages', 'Social', 'Secret']

const CAT_ICONS = {
  All: '✦', Reading: '📖', Reviews: '✍️', Streak: '🔥', Pages: '📄', Social: '🤝', Secret: '🔒',
}

export default function Logros() {
  const [user, setUser]               = useState(null)
  const [unlocked, setUnlocked]       = useState([])
  const [newlyUnlocked, setNewly]     = useState([])
  const [activeCategory, setCategory] = useState('All')
  const [loading, setLoading]         = useState(true)
  const [showNew, setShowNew]         = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      const { data: achievementsData } = await supabase
        .from('user_achievements').select('*').eq('user_id', user.id)
      const unlockedIds = (achievementsData || []).map(a => a.achievement_id)

      const [
        { data: booklist }, { data: reviews },
        { data: logs },     { data: follows },
        { data: followers },
      ] = await Promise.all([
        supabase.from('booklist').select('*').eq('user_id', user.id),
        supabase.from('reviews').select('*').eq('user_id', user.id),
        supabase.from('reading_log').select('*').eq('user_id', user.id).order('log_date', { ascending: false }),
        supabase.from('follows').select('*').eq('follower_id', user.id),
        supabase.from('follows').select('*').eq('following_id', user.id),
      ])

      const booksRead       = (booklist || []).filter(b => b.status === 'read').length
      const booksWTR        = (booklist || []).filter(b => b.status === 'want_to_read').length
      const reviewCount     = (reviews || []).length
      const totalPages      = (logs || []).reduce((a, l) => a + l.pages_read, 0)
      const maxDayPages     = (logs || []).reduce((a, l) => Math.max(a, l.pages_read), 0)
      const followCount     = (follows || []).length
      const followerCount   = (followers || []).length
      const hasPerfect      = (reviews || []).some(r => r.rating === 5)
      const hasHarsh        = (reviews || []).some(r => r.rating === 1)

      const today     = new Date().toISOString().split('T')[0]
      const logDates  = [...new Set((logs || []).map(l => l.log_date))].sort((a, b) => b.localeCompare(a))
      let streak = 0, current = today
      for (const date of logDates) {
        if (date === current) {
          streak++
          const d = new Date(current); d.setDate(d.getDate() - 1)
          current = d.toISOString().split('T')[0]
        } else break
      }

      const hour      = new Date().getHours()
      const isNight   = hour >= 0 && hour < 5 && (logs || []).some(l => l.log_date === today)

      const earned = []
      if (booksRead >= 1)      earned.push('first_book')
      if (booksRead >= 5)      earned.push('books_5')
      if (booksRead >= 10)     earned.push('books_10')
      if (booksRead >= 25)     earned.push('books_25')
      if (booksRead >= 50)     earned.push('books_50')
      if (booksRead >= 100)    earned.push('books_100')
      if (reviewCount >= 1)    earned.push('first_review')
      if (reviewCount >= 5)    earned.push('reviews_5')
      if (reviewCount >= 25)   earned.push('reviews_25')
      if (hasPerfect)          earned.push('perfect_rating')
      if (hasHarsh)            earned.push('harsh_critic')
      if (streak >= 3)         earned.push('streak_3')
      if (streak >= 7)         earned.push('streak_7')
      if (streak >= 30)        earned.push('streak_30')
      if (streak >= 100)       earned.push('streak_100')
      if (totalPages >= 100)   earned.push('pages_100')
      if (totalPages >= 1000)  earned.push('pages_1000')
      if (totalPages >= 10000) earned.push('pages_10000')
      if (maxDayPages >= 100)  earned.push('marathon')
      if (followCount >= 1)    earned.push('first_follow')
      if (followerCount >= 5)  earned.push('followers_5')
      if (isNight)             earned.push('night_owl')
      if (booksWTR >= 20)      earned.push('want_to_read_20')

      const newOnes = earned.filter(id => !unlockedIds.includes(id))
      if (newOnes.length > 0) {
        await supabase.from('user_achievements').insert(
          newOnes.map(achievement_id => ({ user_id: user.id, achievement_id }))
        )
        setNewly(newOnes)
      }
      setUnlocked([...unlockedIds, ...newOnes])
      setLoading(false)
    }
    loadData()
  }, [])

  const filtered      = activeCategory === 'All' ? ACHIEVEMENTS : ACHIEVEMENTS.filter(a => a.category === activeCategory)
  const unlockedCount = ACHIEVEMENTS.filter(a => unlocked.includes(a.id)).length
  const pct           = Math.round((unlockedCount / ACHIEVEMENTS.length) * 100)

  if (loading) return (
    <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <span style={{ fontSize: '2.5rem', color: '#c9a84c' }}>✦</span>
        <p style={{ color: '#a89070', marginTop: '1rem', fontFamily: 'var(--font-lora)', fontSize: '13px', letterSpacing: '0.1em' }}>
          Checking your achievements...
        </p>
      </div>
    </main>
  )

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(201,168,76,0); }
          50%       { box-shadow: 0 0 20px 4px rgba(201,168,76,0.12); }
        }
        @keyframes badge-pop {
          0%   { transform: scale(0) rotate(-12deg); opacity: 0; }
          60%  { transform: scale(1.15) rotate(3deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }

        .page-fadein { animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both; }

        .ach-card {
          position: relative;
          border-radius: 14px;
          padding: 20px;
          border: 1px solid rgba(255,255,255,0.04);
          background: #0e0c08;
          transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
          cursor: default;
          overflow: hidden;
        }
        .ach-card::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at 20% 20%, rgba(201,168,76,0.04) 0%, transparent 60%);
          opacity: 0; transition: opacity 0.3s;
          pointer-events: none;
        }
        .ach-card.unlocked {
          background: #100e09;
          border-color: rgba(201,168,76,0.18);
        }
        .ach-card.unlocked:hover {
          transform: translateY(-2px);
          border-color: rgba(201,168,76,0.32);
          box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(201,168,76,0.08) inset;
        }
        .ach-card.unlocked:hover::before { opacity: 1; }
        .ach-card.locked { opacity: 0.38; }
        .ach-card.is-new {
          border-color: rgba(201,168,76,0.5);
          background: #141008;
          animation: pulse-glow 2.5s ease-in-out 3;
        }

        .ach-icon-wrap {
          width: 48px; height: 48px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 22px;
          margin-bottom: 14px;
          flex-shrink: 0;
          transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
        }
        .ach-card.unlocked:hover .ach-icon-wrap { transform: scale(1.12); }
        .ach-icon-wrap.unlocked {
          background: rgba(201,168,76,0.1);
          border: 1px solid rgba(201,168,76,0.2);
        }
        .ach-icon-wrap.locked {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          filter: grayscale(1);
        }

        .new-badge {
          position: absolute; top: 12px; right: 12px;
          background: #c9a84c;
          color: #0e0c08;
          font-size: 9px; font-weight: 800;
          letter-spacing: 0.12em;
          padding: 3px 7px;
          border-radius: 20px;
          font-family: var(--font-playfair);
          animation: badge-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
        }

        .cat-pill {
          display: flex; align-items: center; gap: 5px;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-family: var(--font-lora);
          letter-spacing: 0.04em;
          cursor: pointer;
          transition: all 0.15s;
          border: 1px solid rgba(255,255,255,0.06);
          color: rgba(232,220,200,0.35);
          background: transparent;
          white-space: nowrap;
        }
        .cat-pill:hover { color: rgba(232,220,200,0.7); border-color: rgba(201,168,76,0.2); }
        .cat-pill.active {
          background: rgba(201,168,76,0.1);
          border-color: rgba(201,168,76,0.35);
          color: #c9a84c;
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #a07830, #c9a84c, #e8c96a);
          background-size: 200% auto;
          border-radius: 99px;
          animation: shimmer 3s linear infinite;
          transition: width 1.2s cubic-bezier(0.22,1,0.36,1);
        }

        .new-banner-close {
          background: none; border: none; cursor: pointer;
          color: rgba(201,168,76,0.5); font-size: 18px;
          padding: 0; line-height: 1; transition: color 0.15s;
        }
        .new-banner-close:hover { color: #c9a84c; }

        .stat-box {
          background: #0e0c08;
          border: 1px solid rgba(201,168,76,0.1);
          border-radius: 12px;
          padding: 16px 20px;
          text-align: center;
        }
      `}</style>

      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 24px 80px' }} className="page-fadein">

        {/* ── Newly unlocked banner ── */}
        {newlyUnlocked.length > 0 && showNew && (
          <div style={{
            marginBottom: '32px',
            background: 'linear-gradient(135deg, #141008, #1a1508)',
            border: '1px solid rgba(201,168,76,0.35)',
            borderRadius: '16px',
            padding: '20px 24px',
            animation: 'fadeUp 0.4s ease both',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <p style={{
                color: '#c9a84c', fontSize: '10px',
                letterSpacing: '0.25em', textTransform: 'uppercase',
                fontFamily: 'var(--font-playfair)', margin: 0,
              }}>
                🎉 Newly unlocked
              </p>
              <button className="new-banner-close" onClick={() => setShowNew(false)}>×</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {newlyUnlocked.map(id => {
                const a = ACHIEVEMENTS.find(a => a.id === id)
                if (!a) return null
                return (
                  <div key={id} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: 'rgba(201,168,76,0.08)',
                    border: '1px solid rgba(201,168,76,0.25)',
                    borderRadius: '10px', padding: '8px 12px',
                    animation: 'badge-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
                  }}>
                    <span style={{ fontSize: '18px' }}>{a.icon}</span>
                    <span style={{
                      fontFamily: 'var(--font-playfair)',
                      color: '#e8dcc8', fontSize: '13px', fontWeight: 600,
                    }}>{a.title}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Header ── */}
        <div style={{ marginBottom: '40px' }}>
          <p style={{
            color: '#c9a84c', fontSize: '10px',
            letterSpacing: '0.3em', textTransform: 'uppercase',
            fontFamily: 'var(--font-playfair)', marginBottom: '10px',
          }}>Your milestones</p>
          <h1 style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: 'clamp(2rem, 5vw, 2.8rem)',
            fontWeight: 700, color: '#e8dcc8',
            margin: 0, letterSpacing: '0.02em', lineHeight: 1.1,
          }}>Achievements</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '14px' }}>
            <div style={{ height: '1px', width: '48px', background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.3))' }} />
            <span style={{ color: 'rgba(201,168,76,0.3)', fontSize: '10px' }}>✦</span>
            <div style={{ height: '1px', width: '48px', background: 'linear-gradient(to left, transparent, rgba(201,168,76,0.3))' }} />
          </div>
        </div>

        {/* ── Stats row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '32px' }}>
          {[
            { label: 'Unlocked', value: unlockedCount },
            { label: 'Remaining', value: ACHIEVEMENTS.length - unlockedCount },
            { label: 'Complete', value: `${pct}%` },
          ].map(s => (
            <div key={s.label} className="stat-box">
              <p style={{
                margin: 0, fontFamily: 'var(--font-playfair)',
                fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 700,
                color: '#c9a84c', lineHeight: 1,
              }}>{s.value}</p>
              <p style={{
                margin: '4px 0 0', fontSize: '11px', color: 'rgba(232,220,200,0.3)',
                fontFamily: 'var(--font-lora)', letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Progress bar ── */}
        <div style={{
          background: '#0e0c08',
          border: '1px solid rgba(201,168,76,0.1)',
          borderRadius: '14px',
          padding: '20px 24px',
          marginBottom: '36px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'baseline' }}>
            <span style={{ fontFamily: 'var(--font-lora)', fontSize: '12px', color: 'rgba(232,220,200,0.35)', letterSpacing: '0.05em' }}>
              Overall progress
            </span>
            <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '13px', color: '#c9a84c', fontWeight: 600 }}>
              {unlockedCount} / {ACHIEVEMENTS.length}
            </span>
          </div>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.04)', borderRadius: '99px', overflow: 'hidden' }}>
            <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* ── Category filter ── */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '28px' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`cat-pill${activeCategory === cat ? ' active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              <span style={{ fontSize: '12px' }}>{CAT_ICONS[cat]}</span>
              {cat}
            </button>
          ))}
        </div>

        {/* ── Grid ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '14px',
        }}>
          {filtered.map((a, i) => {
            const isUnlocked = unlocked.includes(a.id)
            const isNew      = newlyUnlocked.includes(a.id)
            const isSecret   = a.secret && !isUnlocked

            return (
              <div
                key={a.id}
                className={`ach-card ${isUnlocked ? 'unlocked' : 'locked'}${isNew ? ' is-new' : ''}`}
                style={{ animationDelay: `${i * 0.03}s` }}
              >
                {isNew && <span className="new-badge">NEW</span>}

                <div className={`ach-icon-wrap ${isUnlocked ? 'unlocked' : 'locked'}`}>
                  {isSecret ? '🔒' : a.icon}
                </div>

                <h3 style={{
                  fontFamily: 'var(--font-playfair)',
                  fontSize: '14px', fontWeight: 700,
                  color: isUnlocked ? '#e8dcc8' : 'rgba(232,220,200,0.2)',
                  margin: '0 0 5px', lineHeight: 1.3,
                }}>
                  {isSecret ? '???' : a.title}
                </h3>

                <p style={{
                  fontSize: '12px', lineHeight: '1.6',
                  color: isUnlocked ? 'rgba(168,144,112,0.9)' : 'rgba(255,255,255,0.12)',
                  margin: '0 0 12px',
                  fontFamily: 'var(--font-lora)',
                }}>
                  {isSecret ? 'Keep reading to discover this achievement' : a.description}
                </p>

                {/* Category tag + unlocked indicator */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    fontSize: '10px', letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: isUnlocked ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.08)',
                    fontFamily: 'var(--font-playfair)',
                  }}>
                    {a.category}
                  </span>
                  {isUnlocked && (
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: '4px',
                      fontSize: '10px', color: '#c9a84c',
                      fontFamily: 'var(--font-lora)', letterSpacing: '0.08em',
                    }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Unlocked
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

      </main>
    </>
  )
}