'use client'

import { useState, useEffect, useRef } from 'react'
import { signIn, signUp } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// ─── Animated background particles ───────────────────────────────────────────
function Particles() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const dots = Array.from({ length: 55 }, () => ({
      x:   Math.random() * window.innerWidth,
      y:   Math.random() * window.innerHeight,
      r:   Math.random() * 1.2 + 0.3,
      vx:  (Math.random() - 0.5) * 0.18,
      vy:  (Math.random() - 0.5) * 0.18,
      o:   Math.random() * 0.35 + 0.05,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      dots.forEach(d => {
        d.x += d.vx; d.y += d.vy
        if (d.x < 0) d.x = canvas.width
        if (d.x > canvas.width) d.x = 0
        if (d.y < 0) d.y = canvas.height
        if (d.y > canvas.height) d.y = 0
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(201,168,76,${d.o})`
        ctx.fill()
      })
      // Draw connecting lines between close dots
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x
          const dy = dots[i].y - dots[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            ctx.beginPath()
            ctx.moveTo(dots[i].x, dots[i].y)
            ctx.lineTo(dots[j].x, dots[j].y)
            ctx.strokeStyle = `rgba(201,168,76,${0.06 * (1 - dist / 120)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
      raf = requestAnimationFrame(draw)
    }
    draw()

    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />
}

// ─── Floating book spines (decorative left/right) ─────────────────────────────
const SPINE_COLORS = [
  ['#2a1f12','#c9a84c20'],['#12100a','#7ab0d420'],['#1a1408','#a8c87020'],
  ['#0e1018','#9c7cdc20'],['#120e0a','#c9a84c15'],['#1a1208','#7ab0d415'],
  ['#0f0e0a','#c8906020'],['#141018','#c9a84c18'],
]
function BookSpines({ side }) {
  return (
    <div style={{
      position: 'fixed', top: 0, bottom: 0,
      [side]: 0,
      width: '52px',
      display: 'flex', flexDirection: 'column',
      zIndex: 1, pointerEvents: 'none',
      opacity: 0.55,
    }}>
      {SPINE_COLORS.map(([bg, border], i) => (
        <div key={i} style={{
          flex: `${60 + Math.sin(i * 1.7) * 20}`,
          background: bg,
          borderRight: side === 'left' ? `1px solid ${border}` : 'none',
          borderLeft:  side === 'right' ? `1px solid ${border}` : 'none',
          transition: 'opacity 0.3s',
        }} />
      ))}
    </div>
  )
}

// ─── Orbiting star ornament ────────────────────────────────────────────────────
function OrbitStar({ size = 80, duration = 8, delay = 0 }) {
  return (
    <div style={{
      width: size, height: size,
      position: 'absolute',
      animation: `orbit ${duration}s linear ${delay}s infinite`,
      pointerEvents: 'none',
    }}>
      <span style={{ color: '#c9a84c', fontSize: size * 0.18, opacity: 0.35 }}>✦</span>
    </div>
  )
}

// ─── Auth form ─────────────────────────────────────────────────────────────────
function AuthForm({ mode, onModeChange, onSuccess }) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error,    setError]    = useState(null)
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit() {
    if (!email || !password || (mode === 'register' && !username)) {
      setError('Please fill in all fields.'); return
    }
    setLoading(true); setError(null)
    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) { setError(error.message); setLoading(false); return }
    } else {
      const { error } = await signUp(email, password, username)
      if (error) { setError(error.message); setLoading(false); return }
    }
    onSuccess()
  }

  const isLogin = mode === 'login'

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {!isLogin && (
          <div style={{ animation: 'fieldIn 0.3s cubic-bezier(0.22,1,0.36,1) both' }}>
            <label style={{ display: 'block', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.5)', fontFamily: 'var(--font-playfair)', marginBottom: '7px' }}>
              Username
            </label>
            <input
              type="text" value={username} onChange={e => setUsername(e.target.value)}
              placeholder="e.g. classic_reader"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(201,168,76,0.12)',
                borderRadius: '8px', padding: '11px 14px',
                color: '#e8dcc8', fontSize: '13px', fontFamily: 'var(--font-lora)',
                outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(201,168,76,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(201,168,76,0.12)'}
            />
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.5)', fontFamily: 'var(--font-playfair)', marginBottom: '7px' }}>
            Email
          </label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@email.com"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(201,168,76,0.12)',
              borderRadius: '8px', padding: '11px 14px',
              color: '#e8dcc8', fontSize: '13px', fontFamily: 'var(--font-lora)',
              outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(201,168,76,0.4)'}
            onBlur={e => e.target.style.borderColor = 'rgba(201,168,76,0.12)'}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.5)', fontFamily: 'var(--font-playfair)', marginBottom: '7px' }}>
            Password
          </label>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(201,168,76,0.12)',
              borderRadius: '8px', padding: '11px 14px',
              color: '#e8dcc8', fontSize: '13px', fontFamily: 'var(--font-lora)',
              outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(201,168,76,0.4)'}
            onBlur={e => e.target.style.borderColor = 'rgba(201,168,76,0.12)'}
          />
        </div>

        {error && (
          <div style={{
            background: 'rgba(180,60,30,0.08)', border: '1px solid rgba(180,60,30,0.2)',
            borderRadius: '7px', padding: '10px 13px',
            color: 'rgba(220,130,100,0.9)', fontSize: '12px', fontFamily: 'var(--font-lora)',
            animation: 'fieldIn 0.25s ease both',
          }}>{error}</div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', padding: '13px',
            background: loading ? 'rgba(201,168,76,0.3)' : 'rgba(201,168,76,0.9)',
            border: 'none', borderRadius: '9px',
            color: '#0e0c07', fontSize: '13px', fontWeight: 700,
            fontFamily: 'var(--font-playfair)', letterSpacing: '0.12em',
            textTransform: 'uppercase', cursor: loading ? 'default' : 'pointer',
            transition: 'all 0.2s', marginTop: '4px',
            boxShadow: loading ? 'none' : '0 4px 20px rgba(201,168,76,0.25)',
          }}
          onMouseEnter={e => { if (!loading) { e.target.style.background = '#c9a84c'; e.target.style.boxShadow = '0 6px 28px rgba(201,168,76,0.4)' }}}
          onMouseLeave={e => { if (!loading) { e.target.style.background = 'rgba(201,168,76,0.9)'; e.target.style.boxShadow = '0 4px 20px rgba(201,168,76,0.25)' }}}
        >
          {loading
            ? (isLogin ? 'Signing in…' : 'Creating account…')
            : (isLogin ? 'Sign in' : 'Create account')}
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <span style={{ color: 'rgba(255,255,255,0.18)', fontSize: '12px', fontFamily: 'var(--font-lora)' }}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
        </span>
        <button
          onClick={() => { onModeChange(isLogin ? 'register' : 'login'); setError(null) }}
          style={{ background: 'none', border: 'none', color: 'rgba(201,168,76,0.7)', fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-lora)', transition: 'color 0.15s', padding: 0 }}
          onMouseEnter={e => e.target.style.color = '#c9a84c'}
          onMouseLeave={e => e.target.style.color = 'rgba(201,168,76,0.7)'}
        >
          {isLogin ? 'Sign up' : 'Sign in'}
        </button>
      </div>
    </div>
  )
}

// ─── Recent reviews ticker ─────────────────────────────────────────────────────
function ReviewTicker({ reviews }) {
  if (!reviews.length) return null
  const doubled = [...reviews, ...reviews]
  return (
    <div style={{ overflow: 'hidden', width: '100%', position: 'relative' }}>
      <div style={{ display: 'flex', gap: '12px', animation: 'ticker 40s linear infinite', width: 'max-content' }}>
        {doubled.map((r, i) => (
          <div key={i} style={{
            flexShrink: 0,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(201,168,76,0.08)',
            borderRadius: '10px', padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: '10px',
            width: '220px',
          }}>
            <div style={{
              width: '28px', height: '40px', borderRadius: '3px', flexShrink: 0,
              background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px',
            }}>
              {r.book_cover
                ? <img src={r.book_cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '3px' }} />
                : '📖'}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, color: '#e8dcc8', fontSize: '11px', fontFamily: 'var(--font-playfair)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.book_title}
              </p>
              <div style={{ display: 'flex', gap: '1px', margin: '2px 0' }}>
                {[1,2,3,4,5].map(s => (
                  <span key={s} style={{ fontSize: '9px', color: s <= r.rating ? '#c9a84c' : 'rgba(255,255,255,0.08)' }}>★</span>
                ))}
              </div>
              <p style={{ margin: 0, color: 'rgba(201,168,76,0.45)', fontSize: '10px', fontFamily: 'var(--font-lora)' }}>
                {r.profiles?.username}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main landing page ─────────────────────────────────────────────────────────
export default function Home() {
  const [mode,      setMode]    = useState('login')  // 'login' | 'register'
  const [phase,     setPhase]   = useState(0)        // animation phase 0→1→2→3
  const [reviews,   setReviews] = useState([])
  const [stats,     setStats]   = useState({ books: 0, reviews: 0, readers: 0 })
  const router = useRouter()

  useEffect(() => {
    // Staggered entrance
    const t1 = setTimeout(() => setPhase(1), 100)
    const t2 = setTimeout(() => setPhase(2), 600)
    const t3 = setTimeout(() => setPhase(3), 1100)

    // Load social proof data
    async function loadData() {
      const [{ data: rev }, { data: bl }, { data: prof }] = await Promise.all([
        supabase.from('reviews').select('*, profiles(username)').order('created_at', { ascending: false }).limit(12),
        supabase.from('booklist').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
      ])
      setReviews(rev || [])
      setStats({
        books:   (rev || []).length,
        reviews: (rev || []).length,
        readers: prof?.length || 0,
      })
    }
    loadData()

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  // Check if already logged in
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.push('/descubrir')
    })
  }, [])

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }

        @keyframes orbit {
          from { transform: rotate(0deg) translateX(55px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(55px) rotate(-360deg); }
        }
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes fieldIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%       { opacity: 0.15; transform: scale(1.3); }
        }
        @keyframes lineGrow {
          from { width: 0; }
          to   { width: 100%; }
        }
        @keyframes modeSwitch {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .phase-0 { opacity: 0; }
        .phase-1 { animation: fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) both; }
        .phase-2 { animation: fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.1s both; }
        .phase-3 { animation: scaleIn 0.5s cubic-bezier(0.22,1,0.36,1) 0.2s both; }

        .stat-num {
          font-family: var(--font-playfair);
          font-size: clamp(1.4rem, 2.5vw, 2rem);
          font-weight: 700; color: #c9a84c; line-height: 1;
          margin: 0;
        }
        .stat-label {
          font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase;
          color: rgba(255,255,255,0.18); font-family: var(--font-lora);
          margin: 5px 0 0;
        }

        input::placeholder { color: rgba(255,255,255,0.12) !important; }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 100px #0e0c07 inset !important;
          -webkit-text-fill-color: #e8dcc8 !important;
        }

        .form-card-inner {
          animation: modeSwitch 0.3s cubic-bezier(0.22,1,0.36,1) both;
        }
      `}</style>

      {/* Canvas particles */}
      <Particles />

      {/* Book spines - only on wide screens */}
      <div style={{ display: 'none' }} className="book-spines-left">
        <BookSpines side="left" />
        <BookSpines side="right" />
      </div>

      {/* Full page layout */}
      <div style={{
        minHeight: '100vh', width: '100%',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        position: 'relative', zIndex: 2,
        padding: '40px 20px',
        background: 'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(201,168,76,0.04) 0%, transparent 70%)',
      }}>

        {/* ── Top: Logo + tagline ── */}
        <div className={phase >= 1 ? 'phase-1' : 'phase-0'} style={{ textAlign: 'center', marginBottom: '56px' }}>

          {/* Orbiting ornament */}
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '110px', height: '110px', marginBottom: '28px' }}>
            {/* Outer ring */}
            <div style={{
              position: 'absolute', inset: 0,
              border: '1px solid rgba(201,168,76,0.1)',
              borderRadius: '50%',
              animation: 'spinSlow 20s linear infinite',
              borderTopColor: 'rgba(201,168,76,0.35)',
            }} />
            {/* Inner ring */}
            <div style={{
              position: 'absolute', inset: '12px',
              border: '1px solid rgba(201,168,76,0.06)',
              borderRadius: '50%',
              animation: 'spinSlow 14s linear infinite reverse',
              borderBottomColor: 'rgba(201,168,76,0.2)',
            }} />
            {/* Pulse */}
            <div style={{
              position: 'absolute', inset: '20px',
              background: 'rgba(201,168,76,0.06)',
              borderRadius: '50%',
              animation: 'pulse 3s ease-in-out infinite',
            }} />
            {/* Center star */}
            <span style={{
              fontSize: '2rem', color: '#c9a84c',
              position: 'relative', zIndex: 1,
              filter: 'drop-shadow(0 0 12px rgba(201,168,76,0.4))',
            }}>✦</span>
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: 'clamp(2.8rem, 7vw, 5rem)',
            fontWeight: 700, color: '#e8dcc8',
            margin: '0 0 6px',
            letterSpacing: '0.06em',
            lineHeight: 1,
            textShadow: '0 0 60px rgba(201,168,76,0.1)',
          }}>
            Bookboxd
          </h1>

          {/* Decorative line */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', margin: '16px 0 20px' }}>
            <div style={{ height: '1px', width: '60px', background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.4))' }} />
            <span style={{ color: 'rgba(201,168,76,0.4)', fontSize: '9px', letterSpacing: '0.1em' }}>◆</span>
            <div style={{ height: '1px', width: '60px', background: 'linear-gradient(to left, transparent, rgba(201,168,76,0.4))' }} />
          </div>

          <p style={{
            fontFamily: 'var(--font-lora)',
            color: 'rgba(168,144,112,0.7)',
            fontSize: 'clamp(13px, 1.5vw, 15px)',
            letterSpacing: '0.08em',
            margin: 0,
            fontStyle: 'italic',
          }}>
            Your personal library. Every book, your story.
          </p>
        </div>

        {/* ── Center: Auth form ── */}
        <div className={phase >= 2 ? 'phase-2' : 'phase-0'} style={{ width: '100%', maxWidth: '380px', marginBottom: '52px' }}>

          {/* Form card */}
          <div style={{
            background: 'rgba(14,12,7,0.85)',
            border: '1px solid rgba(201,168,76,0.12)',
            borderRadius: '18px',
            padding: '32px 32px 28px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.02) inset',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Card glow top */}
            <div style={{
              position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
              width: '60%', height: '1px',
              background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.3), transparent)',
            }} />

            {/* Mode tabs */}
            <div style={{ display: 'flex', gap: '0', marginBottom: '28px', background: 'rgba(255,255,255,0.02)', borderRadius: '9px', padding: '3px' }}>
              {[['login', 'Sign in'], ['register', 'Sign up']].map(([m, label]) => (
                <button key={m} onClick={() => setMode(m)} style={{
                  flex: 1, padding: '8px', borderRadius: '7px', border: 'none',
                  background: mode === m ? 'rgba(201,168,76,0.12)' : 'transparent',
                  color: mode === m ? '#c9a84c' : 'rgba(255,255,255,0.2)',
                  fontSize: '12px', fontFamily: 'var(--font-playfair)',
                  letterSpacing: '0.08em', cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: mode === m ? '0 0 0 1px rgba(201,168,76,0.2)' : 'none',
                }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Form fields */}
            <div key={mode} className="form-card-inner">
              <AuthForm
                mode={mode}
                onModeChange={setMode}
                onSuccess={() => router.push('/inicio')}
              />
            </div>
          </div>
        </div>

        {/* ── Stats row ── */}
        {stats.readers > 0 && (
          <div className={phase >= 3 ? 'phase-3' : 'phase-0'} style={{
            display: 'flex', gap: '0', marginBottom: '48px',
            background: 'rgba(255,255,255,0.015)',
            border: '1px solid rgba(201,168,76,0.08)',
            borderRadius: '14px', overflow: 'hidden',
          }}>
            {[
              { value: stats.readers, label: 'Readers' },
              { value: stats.reviews, label: 'Reviews' },
            ].map((s, i) => (
              <div key={i} style={{
                padding: '16px 32px', textAlign: 'center',
                borderRight: i < 1 ? '1px solid rgba(201,168,76,0.07)' : 'none',
              }}>
                <p className="stat-num">{s.value.toLocaleString()}</p>
                <p className="stat-label">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Review ticker ── */}
        {reviews.length > 0 && (
          <div className={phase >= 3 ? 'phase-3' : 'phase-0'} style={{ width: '100%', maxWidth: '680px', marginBottom: '0' }}>
            <p style={{
              textAlign: 'center', fontSize: '9px', letterSpacing: '0.25em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.12)',
              fontFamily: 'var(--font-playfair)', marginBottom: '14px',
            }}>Recent reviews</p>
            <ReviewTicker reviews={reviews} />
          </div>
        )}

      </div>

      {/* ── Bottom quote ── */}
      <div style={{
        position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
        zIndex: 3, textAlign: 'center', pointerEvents: 'none',
        animation: phase >= 3 ? 'fadeIn 1s 1.5s both' : 'none',
        opacity: phase >= 3 ? 1 : 0,
      }}>
        <p style={{
          fontFamily: 'var(--font-lora)', fontStyle: 'italic',
          color: 'rgba(90,74,48,0.7)', fontSize: '11px',
          letterSpacing: '0.05em', margin: 0,
        }}>
          "A reader lives a thousand lives before he dies."
        </p>
      </div>
    </>
  )
}