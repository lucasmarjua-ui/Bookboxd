'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// ─── Themes ──────────────────────────────────────────────────────────────────
const THEMES = [
  {
    id: 'noir',
    name: 'Noir',
    desc: 'Dark & literary',
    preview: ['#0d0b08', '#1a1408', '#c9a84c'],
    bg: 'linear-gradient(160deg, #0d0b08 0%, #1a1408 55%, #110e08 100%)',
    accent: '#c9a84c',
    accentSoft: 'rgba(201,168,76,0.13)',
    accentGlow: 'rgba(201,168,76,0.25)',
    text: '#e8dcc8',
    textMuted: 'rgba(232,220,200,0.42)',
    border: 'rgba(201,168,76,0.18)',
    pattern: 'dots',
    notch: '#0d0b08',
  },
  {
    id: 'ivory',
    name: 'Ivory',
    desc: 'Clean & timeless',
    preview: ['#f5f0e8', '#ede4d0', '#8b5e3c'],
    bg: 'linear-gradient(160deg, #f7f2ea 0%, #ede4d0 55%, #f5f0e8 100%)',
    accent: '#8b5e3c',
    accentSoft: 'rgba(139,94,60,0.1)',
    accentGlow: 'rgba(139,94,60,0.2)',
    text: '#2a1f12',
    textMuted: 'rgba(42,31,18,0.42)',
    border: 'rgba(139,94,60,0.18)',
    pattern: 'lines',
    notch: '#f7f2ea',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    desc: 'Deep & dramatic',
    preview: ['#0a0d1a', '#0f1628', '#7b9cdc'],
    bg: 'linear-gradient(160deg, #0a0d1a 0%, #0f1628 55%, #0c1020 100%)',
    accent: '#7b9cdc',
    accentSoft: 'rgba(123,156,220,0.12)',
    accentGlow: 'rgba(123,156,220,0.22)',
    text: '#d4dff5',
    textMuted: 'rgba(212,223,245,0.38)',
    border: 'rgba(123,156,220,0.18)',
    pattern: 'grid',
    notch: '#0a0d1a',
  },
  {
    id: 'forest',
    name: 'Forest',
    desc: 'Organic & calm',
    preview: ['#0a120c', '#0f1a10', '#7ab870'],
    bg: 'linear-gradient(160deg, #0a120c 0%, #0f1a10 55%, #0c1510 100%)',
    accent: '#7ab870',
    accentSoft: 'rgba(122,184,112,0.12)',
    accentGlow: 'rgba(122,184,112,0.22)',
    text: '#d0e8cc',
    textMuted: 'rgba(208,232,204,0.4)',
    border: 'rgba(122,184,112,0.18)',
    pattern: 'leaves',
    notch: '#0a120c',
  },
  {
    id: 'crimson',
    name: 'Crimson',
    desc: 'Bold & passionate',
    preview: ['#140808', '#1e0c0c', '#c84c4c'],
    bg: 'linear-gradient(160deg, #140808 0%, #1e0c0c 55%, #160a0a 100%)',
    accent: '#c84c4c',
    accentSoft: 'rgba(200,76,76,0.12)',
    accentGlow: 'rgba(200,76,76,0.22)',
    text: '#f0d8d8',
    textMuted: 'rgba(240,216,216,0.4)',
    border: 'rgba(200,76,76,0.18)',
    pattern: 'dots',
    notch: '#140808',
  },
  {
    id: 'dusk',
    name: 'Dusk',
    desc: 'Warm & poetic',
    preview: ['#150e18', '#1e1228', '#c49cdc'],
    bg: 'linear-gradient(160deg, #150e18 0%, #1e1228 55%, #180f20 100%)',
    accent: '#c49cdc',
    accentSoft: 'rgba(196,156,220,0.12)',
    accentGlow: 'rgba(196,156,220,0.22)',
    text: '#ecdcf5',
    textMuted: 'rgba(236,220,245,0.4)',
    border: 'rgba(196,156,220,0.18)',
    pattern: 'grid',
    notch: '#150e18',
  },
]

// ─── Layout options ────────────────────────────────────────────────────────
const LAYOUTS = [
  { id: 'classic',  name: 'Classic',  icon: '▤' },
  { id: 'minimal',  name: 'Minimal',  icon: '▥' },
  { id: 'bold',     name: 'Bold',     icon: '▦' },
]

// ─── Font options ─────────────────────────────────────────────────────────
const FONTS = [
  { id: 'playfair', name: 'Playfair',  family: "'Playfair Display', Georgia, serif" },
  { id: 'lora',     name: 'Lora',      family: "'Lora', Georgia, serif" },
  { id: 'georgia',  name: 'Georgia',   family: "Georgia, serif" },
]

const GENRE_ICONS = {
  'Fiction': '✦', 'Non-fiction': '◆', 'Fantasy': '◈', 'Sci-Fi': '◉',
  'Mystery': '◎', 'Romance': '♡', 'Horror': '◇', 'History': '▣',
  'Biography': '◐', 'Poetry': '❧', 'Philosophy': '◑', 'Science': '◒',
  'Travel': '◌', 'Art': '◍', 'Music': '●', 'Comics': '◫',
}
const GENRES_LIST = Object.keys(GENRE_ICONS)

// ─── SVG Patterns ─────────────────────────────────────────────────────────
function BgPattern({ pattern, color }) {
  const uid = pattern
  if (pattern === 'dots') return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.38 }} xmlns="http://www.w3.org/2000/svg">
      <defs><pattern id={uid} x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.1" fill={color} /></pattern></defs>
      <rect width="100%" height="100%" fill={`url(#${uid})`} />
    </svg>
  )
  if (pattern === 'lines') return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.22 }} xmlns="http://www.w3.org/2000/svg">
      <defs><pattern id={uid} x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse"><line x1="0" y1="22" x2="22" y2="0" stroke={color} strokeWidth="0.8" /></pattern></defs>
      <rect width="100%" height="100%" fill={`url(#${uid})`} />
    </svg>
  )
  if (pattern === 'grid') return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.14 }} xmlns="http://www.w3.org/2000/svg">
      <defs><pattern id={uid} x="0" y="0" width="26" height="26" patternUnits="userSpaceOnUse"><path d="M 26 0 L 0 0 0 26" fill="none" stroke={color} strokeWidth="0.6" /></pattern></defs>
      <rect width="100%" height="100%" fill={`url(#${uid})`} />
    </svg>
  )
  if (pattern === 'leaves') return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.12 }} xmlns="http://www.w3.org/2000/svg">
      <defs><pattern id={uid} x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
        <path d="M15 5 Q22 12 15 25 Q8 12 15 5Z" fill={color} />
      </pattern></defs>
      <rect width="100%" height="100%" fill={`url(#${uid})`} />
    </svg>
  )
  return null
}

// ─── Bookmark Card ─────────────────────────────────────────────────────────
function BookmarkCard({ themeId, layout, fontId, username, quote, stats, genres, showStats, showGenres, showQuote, ornament }) {
  const t    = THEMES.find(x => x.id === themeId) || THEMES[0]
  const font = FONTS.find(x => x.id === fontId)?.family || FONTS[0].family
  const W = 260, H = 680

  const isBold    = layout === 'bold'
  const isMinimal = layout === 'minimal'

  return (
    <div style={{
      width: W, height: H, position: 'relative',
      background: t.bg, borderRadius: '18px', overflow: 'hidden',
      border: `1px solid ${t.border}`,
      boxShadow: `0 32px 70px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.03) inset, 0 0 60px ${t.accentGlow}`,
      fontFamily: font, flexShrink: 0,
      transition: 'box-shadow 0.4s ease',
    }}>
      <BgPattern pattern={t.pattern} color={t.accent} />

      {/* Radial glow top */}
      <div style={{
        position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)',
        width: '200px', height: '180px',
        background: `radial-gradient(ellipse, ${t.accentGlow} 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Top line */}
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '2px', height: isBold ? '0' : '52px',
        background: `linear-gradient(to bottom, ${t.accent}, transparent)`,
      }} />

      {/* Bold top bar */}
      {isBold && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '5px',
          background: `linear-gradient(to right, transparent, ${t.accent}, transparent)`,
        }} />
      )}

      <div style={{
        position: 'relative', zIndex: 1, height: '100%',
        display: 'flex', flexDirection: 'column',
        padding: isMinimal ? '44px 22px 28px' : isBold ? '38px 24px 28px' : '56px 26px 32px',
      }}>

        {/* ── Logo ── */}
        {!isMinimal && (
          <div style={{ textAlign: 'center', marginBottom: isBold ? '20px' : '22px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: isBold ? '5px 14px' : '5px 12px',
              background: t.accentSoft, border: `1px solid ${t.border}`,
              borderRadius: '20px',
            }}>
              <span style={{ color: t.accent, fontSize: isBold ? '11px' : '9px' }}>✦</span>
              <span style={{ color: t.textMuted, fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                Bookboxd
              </span>
            </div>
          </div>
        )}

        {/* ── Divider ── */}
        {!isBold && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: '1px', background: `linear-gradient(to right, transparent, ${t.border})` }} />
            <span style={{ color: t.accent, fontSize: '7px', opacity: 0.55 }}>{ornament}</span>
            <div style={{ flex: 1, height: '1px', background: `linear-gradient(to left, transparent, ${t.border})` }} />
          </div>
        )}

        {/* ── Username ── */}
        <div style={{ textAlign: 'center', marginBottom: isBold ? '18px' : '20px' }}>
          {!isMinimal && (
            <p style={{
              color: t.textMuted, fontSize: '8px', letterSpacing: '0.22em',
              textTransform: 'uppercase', marginBottom: '6px',
            }}>Reader</p>
          )}
          <h2 style={{
            color: t.text,
            fontSize: isBold ? '22px' : isMinimal ? '20px' : '18px',
            fontWeight: 700, letterSpacing: isBold ? '0.04em' : '0.02em',
            margin: 0, lineHeight: 1.1,
          }}>{username || 'Bookboxd Reader'}</h2>
          {isMinimal && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '10px' }}>
              <div style={{ flex: 1, maxWidth: '50px', height: '1px', background: `linear-gradient(to right, transparent, ${t.border})` }} />
              <span style={{ color: t.accent, fontSize: '7px', opacity: 0.5 }}>{ornament}</span>
              <div style={{ flex: 1, maxWidth: '50px', height: '1px', background: `linear-gradient(to left, transparent, ${t.border})` }} />
            </div>
          )}
        </div>

        {/* ── Quote ── */}
        {showQuote && quote && (
          <div style={{
            background: t.accentSoft, border: `1px solid ${t.border}`,
            borderRadius: '10px', padding: '14px',
            marginBottom: '18px', position: 'relative',
          }}>
            <span style={{
              position: 'absolute', top: '-7px', left: '13px',
              color: t.accent, fontSize: '16px', lineHeight: 1,
            }}>"</span>
            <p style={{
              color: t.text, fontSize: '10.5px', lineHeight: 1.7,
              margin: 0, fontStyle: 'italic',
            }}>
              {quote.length > 90 ? quote.slice(0, 90) + '…' : quote}
            </p>
          </div>
        )}

        {/* ── Stats ── */}
        {showStats && (
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            gap: '6px', marginBottom: '16px',
          }}>
            {[
              { value: stats.booksRead, label: 'Books' },
              { value: stats.totalPages > 999 ? `${(stats.totalPages/1000).toFixed(1)}k` : (stats.totalPages || 0), label: 'Pages' },
              { value: stats.streak || 0, label: 'Streak' },
            ].map(s => (
              <div key={s.label} style={{
                background: t.accentSoft, border: `1px solid ${t.border}`,
                borderRadius: '8px', padding: '8px 4px', textAlign: 'center',
              }}>
                <p style={{ color: t.accent, fontSize: isBold ? '15px' : '13px', fontWeight: 700, margin: 0, lineHeight: 1 }}>{s.value}</p>
                <p style={{ color: t.textMuted, fontSize: '7px', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '3px 0 0' }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Genres ── */}
        {showGenres && genres.length > 0 && (
          <div style={{ marginBottom: '14px' }}>
            {!isMinimal && (
              <p style={{ color: t.textMuted, fontSize: '8px', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '7px', textAlign: 'center' }}>
                Favourite genres
              </p>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
              {genres.slice(0, 4).map(g => (
                <span key={g} style={{
                  fontSize: '9px', padding: '3px 8px',
                  background: t.accentSoft, border: `1px solid ${t.border}`,
                  borderRadius: '20px', color: t.text, letterSpacing: '0.04em',
                }}>
                  {GENRE_ICONS[g] || '◆'} {g}
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* ── Bottom ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <div style={{ flex: 1, height: '1px', background: `linear-gradient(to right, transparent, ${t.border})` }} />
          <span style={{ color: t.accent, fontSize: '6px', opacity: 0.4 }}>◆</span>
          <div style={{ flex: 1, height: '1px', background: `linear-gradient(to left, transparent, ${t.border})` }} />
        </div>
        <p style={{ color: t.textMuted, fontSize: '7.5px', letterSpacing: '0.2em', textTransform: 'uppercase', textAlign: 'center', margin: 0 }}>
          bookboxd.app
        </p>
      </div>

      {/* Notch */}
      <div style={{
        position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: 0, height: 0,
        borderLeft: '16px solid transparent',
        borderRight: '16px solid transparent',
        borderBottom: `20px solid ${t.notch}`,
        filter: `drop-shadow(0 -3px 5px ${t.accentSoft})`,
      }} />
    </div>
  )
}

// ─── Editor section wrapper ────────────────────────────────────────────────
function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: open ? '28px' : '0' }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '20px 0', color: 'rgba(255,255,255,0.7)',
        }}
      >
        <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '13px', letterSpacing: '0.08em', color: 'rgba(232,220,200,0.7)' }}>
          {title}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(201,168,76,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && <div style={{ animation: 'secIn 0.25s ease both' }}>{children}</div>}
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────
export default function BookmarkPage() {
  const [user, setUser]         = useState(null)
  const [profile, setProfile]   = useState(null)
  const [stats, setStats]       = useState({ booksRead: 0, totalPages: 0, streak: 0 })
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [downloading, setDl]    = useState(false)
  const [copied, setCopied]     = useState(false)
  const [activeTab, setTab]     = useState('style')

  // Customization state
  const [themeId,     setThemeId]     = useState('noir')
  const [layout,      setLayout]      = useState('classic')
  const [fontId,      setFontId]      = useState('playfair')
  const [quote,       setQuote]       = useState('')
  const [genres,      setGenres]      = useState([])
  const [ornament,    setOrnament]    = useState('✦')
  const [showStats,   setShowStats]   = useState(true)
  const [showGenres,  setShowGenres]  = useState(true)
  const [showQuote,   setShowQuote]   = useState(true)

  const bookmarkRef = useRef(null)
  const router      = useRouter()

  const ORNAMENTS = ['✦', '◆', '◈', '❧', '✿', '◉', '⟡', '✶']
  const EDITOR_TABS = [
    { id: 'style',   label: 'Style',   icon: 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7' },
    { id: 'content', label: 'Content', icon: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' },
    { id: 'layout',  label: 'Layout',  icon: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z' },
  ]

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      const { data: prof } = await supabase
        .from('profiles')
        .select('username, bookmark_theme, bookmark_quote, bookmark_genres, bookmark_layout, bookmark_font, bookmark_ornament, bookmark_show_stats, bookmark_show_genres, bookmark_show_quote')
        .eq('id', user.id).single()

      setProfile(prof)
      if (prof?.bookmark_theme)        setThemeId(prof.bookmark_theme)
      if (prof?.bookmark_quote)        setQuote(prof.bookmark_quote)
      if (prof?.bookmark_genres)       setGenres(prof.bookmark_genres)
      if (prof?.bookmark_layout)       setLayout(prof.bookmark_layout)
      if (prof?.bookmark_font)         setFontId(prof.bookmark_font)
      if (prof?.bookmark_ornament)     setOrnament(prof.bookmark_ornament)
      if (prof?.bookmark_show_stats    != null) setShowStats(prof.bookmark_show_stats)
      if (prof?.bookmark_show_genres   != null) setShowGenres(prof.bookmark_show_genres)
      if (prof?.bookmark_show_quote    != null) setShowQuote(prof.bookmark_show_quote)

      // Stats
      const [{ data: booklist }, { data: logs }] = await Promise.all([
        supabase.from('booklist').select('status').eq('user_id', user.id),
        supabase.from('reading_log').select('pages_read, log_date').eq('user_id', user.id).order('log_date', { ascending: false }),
      ])
      const booksRead  = (booklist || []).filter(b => b.status === 'read').length
      const totalPages = (logs || []).reduce((a, l) => a + (l.pages_read || 0), 0)
      const today = new Date().toISOString().split('T')[0]
      const dates = [...new Set((logs || []).map(l => l.log_date))].sort((a,b) => b.localeCompare(a))
      let streak = 0, cur = today
      for (const d of dates) {
        if (d === cur) { streak++; const dt = new Date(cur); dt.setDate(dt.getDate()-1); cur = dt.toISOString().split('T')[0] }
        else break
      }
      setStats({ booksRead, totalPages, streak })
      setLoading(false)
    }
    load()
  }, [])

  function toggleGenre(g) {
    setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : prev.length < 4 ? [...prev, g] : prev)
  }

  async function handleSave() {
    if (!user) return
    setSaving(true)
    await supabase.from('profiles').update({
      bookmark_theme:        themeId,
      bookmark_quote:        quote,
      bookmark_genres:       genres,
      bookmark_layout:       layout,
      bookmark_font:         fontId,
      bookmark_ornament:     ornament,
      bookmark_show_stats:   showStats,
      bookmark_show_genres:  showGenres,
      bookmark_show_quote:   showQuote,
    }).eq('id', user.id)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function handleDownload() {
    setDl(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(bookmarkRef.current, { scale: 3, backgroundColor: null, useCORS: true, logging: false })
      const link = document.createElement('a')
      link.download = `bookboxd-${profile?.username || 'reader'}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch(e) { console.error(e) }
    setDl(false)
  }

  async function handleShare() {
    const text = `My Bookboxd reading identity — ${stats.booksRead} books read ✦ bookboxd.app`
    if (navigator.share) { await navigator.share({ title: 'My Bookboxd Bookmark', text }) }
    else { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  }

  const username = profile?.username || user?.email?.split('@')[0] || 'Reader'
  const currentTheme = THEMES.find(t => t.id === themeId) || THEMES[0]

  if (loading) return (
    <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '48px', height: '48px', border: '2px solid rgba(201,168,76,0.15)', borderTopColor: '#c9a84c', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 20px' }} />
        <p style={{ color: 'rgba(168,144,112,0.6)', fontFamily: 'var(--font-lora)', fontSize: '13px', letterSpacing: '0.15em' }}>
          Crafting your identity...
        </p>
      </div>
    </main>
  )

  return (
    <>
      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        @keyframes secIn  { from { opacity:0; transform:translateY(8px); }  to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }

        .page-in { animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both; }

        .editor-tab {
          display: flex; align-items: center; gap: 7px;
          padding: 9px 16px; border-radius: 8px; cursor: pointer;
          font-size: 12px; font-family: var(--font-lora);
          border: 1px solid transparent; background: transparent;
          color: rgba(255,255,255,0.25); transition: all 0.18s;
          letter-spacing: 0.04em; white-space: nowrap;
        }
        .editor-tab:hover { color: rgba(232,220,200,0.6); border-color: rgba(255,255,255,0.05); }
        .editor-tab.active {
          color: #c9a84c;
          background: rgba(201,168,76,0.07);
          border-color: rgba(201,168,76,0.2);
        }

        .theme-card {
          cursor: pointer; border-radius: 12px; overflow: hidden;
          border: 2px solid transparent; transition: all 0.2s;
          position: relative; flex-shrink: 0;
        }
        .theme-card:hover { transform: translateY(-2px); }
        .theme-card.active { border-color: rgba(201,168,76,0.55) !important; }

        .toggle-switch {
          width: 36px; height: 20px; border-radius: 10px;
          position: relative; cursor: pointer; transition: background 0.2s; border: none;
          flex-shrink: 0;
        }
        .toggle-switch::after {
          content: ''; position: absolute;
          width: 14px; height: 14px; border-radius: 50%;
          background: white; top: 3px; transition: left 0.2s;
        }
        .toggle-switch.on  { background: rgba(201,168,76,0.6); }
        .toggle-switch.on::after  { left: 19px; }
        .toggle-switch.off { background: rgba(255,255,255,0.1); }
        .toggle-switch.off::after { left: 3px; }

        .action-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 12px 20px; border-radius: 10px; cursor: pointer;
          font-size: 12px; font-family: var(--font-lora);
          letter-spacing: 0.06em; transition: all 0.2s;
          border: 1px solid transparent; white-space: nowrap;
        }
        .action-btn.save {
          background: rgba(201,168,76,0.1); border-color: rgba(201,168,76,0.28); color: #c9a84c;
        }
        .action-btn.save:hover { background: rgba(201,168,76,0.18); border-color: rgba(201,168,76,0.45); }
        .action-btn.ghost {
          background: transparent; border-color: rgba(255,255,255,0.07); color: rgba(255,255,255,0.3);
        }
        .action-btn.ghost:hover { border-color: rgba(255,255,255,0.15); color: rgba(232,220,200,0.6); }

        .quote-area {
          width: 100%; background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.07); border-radius: 10px;
          padding: 12px 14px; color: #e8dcc8; font-size: 13px;
          font-family: var(--font-lora); outline: none; resize: none;
          transition: border-color 0.2s; line-height: 1.65; box-sizing: border-box;
        }
        .quote-area:focus { border-color: rgba(201,168,76,0.3); }
        .quote-area::placeholder { color: rgba(255,255,255,0.1); }

        .genre-pill {
          padding: 6px 12px; border-radius: 20px; cursor: pointer;
          font-size: 11px; font-family: var(--font-lora);
          border: 1px solid rgba(255,255,255,0.07);
          color: rgba(232,220,200,0.28); background: transparent;
          transition: all 0.15s; white-space: nowrap;
        }
        .genre-pill:hover:not(.locked) { border-color: rgba(201,168,76,0.2); color: rgba(232,220,200,0.6); }
        .genre-pill.on { border-color: rgba(201,168,76,0.35); background: rgba(201,168,76,0.08); color: #c9a84c; }
        .genre-pill.locked { opacity: 0.25; cursor: not-allowed; }

        .ornament-btn {
          width: 36px; height: 36px; border-radius: 8px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; border: 1px solid rgba(255,255,255,0.07);
          background: transparent; transition: all 0.15s; color: rgba(255,255,255,0.3);
        }
        .ornament-btn:hover { border-color: rgba(201,168,76,0.2); color: rgba(201,168,76,0.7); }
        .ornament-btn.on { border-color: rgba(201,168,76,0.4); background: rgba(201,168,76,0.08); color: #c9a84c; }

        .font-btn {
          flex: 1; padding: 10px 8px; border-radius: 9px; cursor: pointer;
          border: 1px solid rgba(255,255,255,0.06); background: transparent;
          transition: all 0.15s; text-align: center;
          color: rgba(255,255,255,0.25);
        }
        .font-btn:hover { border-color: rgba(201,168,76,0.15); }
        .font-btn.on { border-color: rgba(201,168,76,0.35); background: rgba(201,168,76,0.07); color: #c9a84c; }

        .layout-btn {
          flex: 1; padding: 14px 10px; border-radius: 10px; cursor: pointer;
          border: 1px solid rgba(255,255,255,0.06); background: transparent;
          transition: all 0.15s; display: flex; flex-direction: column;
          align-items: center; gap: 6px; color: rgba(255,255,255,0.25);
        }
        .layout-btn:hover { border-color: rgba(201,168,76,0.15); }
        .layout-btn.on { border-color: rgba(201,168,76,0.35); background: rgba(201,168,76,0.07); color: #c9a84c; }

        .stat-display {
          background: rgba(255,255,255,0.015);
          border: 1px solid rgba(255,255,255,0.04);
          border-radius: 10px; padding: 14px; text-align: center;
        }

        .shimmer-line {
          height: 1px; width: 100%;
          background: linear-gradient(90deg, transparent, rgba(201,168,76,0.4), transparent);
          background-size: 200% 100%;
          animation: shimmer 3s linear infinite;
        }
      `}</style>

      <div className="page-in" style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* ── Page header ── */}
        <div style={{ marginBottom: '44px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <p style={{ color: '#c9a84c', fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', fontFamily: 'var(--font-playfair)', marginBottom: '10px' }}>
              Reading identity
            </p>
            <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 700, color: '#e8dcc8', margin: 0, lineHeight: 1.1 }}>
              My Bookmark
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
              <div style={{ height: '1px', width: '40px', background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.3))' }} />
              <span style={{ color: 'rgba(201,168,76,0.3)', fontSize: '9px' }}>✦</span>
              <div style={{ height: '1px', width: '40px', background: 'linear-gradient(to left, transparent, rgba(201,168,76,0.3))' }} />
            </div>
          </div>

          {/* Save button — top right */}
          <button className={`action-btn save`} onClick={handleSave} style={{ minWidth: '140px' }}>
            {saving ? (
              <><div style={{ width: '12px', height: '12px', border: '2px solid rgba(201,168,76,0.2)', borderTopColor: '#c9a84c', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Saving…</>
            ) : saved ? (
              <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Saved!</>
            ) : (
              <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Save</>
            )}
          </button>
        </div>

        {/* ── Main grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '48px', alignItems: 'start' }}>

          {/* ── LEFT: Editor ── */}
          <div>

            {/* Editor tabs */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '16px' }}>
              {EDITOR_TABS.map(tab => (
                <button key={tab.id} className={`editor-tab${activeTab === tab.id ? ' active' : ''}`} onClick={() => setTab(tab.id)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d={tab.icon}/>
                  </svg>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── STYLE TAB ── */}
            {activeTab === 'style' && (
              <div style={{ animation: 'secIn 0.25s ease both' }}>

                <Section title="Theme">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    {THEMES.map(t => (
                      <button
                        key={t.id}
                        className={`theme-card${themeId === t.id ? ' active' : ''}`}
                        style={{ borderColor: themeId === t.id ? 'rgba(201,168,76,0.55)' : 'rgba(255,255,255,0.05)' }}
                        onClick={() => setThemeId(t.id)}
                      >
                        {/* Color preview */}
                        <div style={{ height: '52px', background: t.bg, position: 'relative', overflow: 'hidden' }}>
                          <BgPattern pattern={t.pattern} color={t.accent} />
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: t.accent, fontSize: '18px', filter: `drop-shadow(0 0 6px ${t.accentGlow})` }}>✦</span>
                          </div>
                          {themeId === t.id && (
                            <div style={{ position: 'absolute', top: '6px', right: '6px', width: '16px', height: '16px', borderRadius: '50%', background: '#c9a84c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#0e0c07" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            </div>
                          )}
                        </div>
                        <div style={{ padding: '8px 10px', background: 'rgba(0,0,0,0.3)' }}>
                          <p style={{ margin: 0, fontFamily: 'var(--font-playfair)', fontSize: '12px', color: themeId === t.id ? '#c9a84c' : 'rgba(232,220,200,0.5)', fontWeight: 600 }}>{t.name}</p>
                          <p style={{ margin: '2px 0 0', fontSize: '10px', color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-lora)' }}>{t.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </Section>

                <Section title="Typography">
                  <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'var(--font-playfair)', marginBottom: '10px' }}>Font</p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {FONTS.map(f => (
                      <button key={f.id} className={`font-btn${fontId === f.id ? ' on' : ''}`} onClick={() => setFontId(f.id)}>
                        <p style={{ margin: 0, fontFamily: f.family, fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>Aa</p>
                        <p style={{ margin: 0, fontSize: '10px', fontFamily: 'var(--font-lora)' }}>{f.name}</p>
                      </button>
                    ))}
                  </div>
                </Section>

                <Section title="Ornament" defaultOpen={false}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {ORNAMENTS.map(o => (
                      <button key={o} className={`ornament-btn${ornament === o ? ' on' : ''}`} onClick={() => setOrnament(o)}>
                        {o}
                      </button>
                    ))}
                  </div>
                </Section>

              </div>
            )}

            {/* ── CONTENT TAB ── */}
            {activeTab === 'content' && (
              <div style={{ animation: 'secIn 0.25s ease both' }}>

                <Section title="Quote">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-lora)' }}>Show quote on bookmark</p>
                    <button className={`toggle-switch ${showQuote ? 'on' : 'off'}`} onClick={() => setShowQuote(p => !p)} />
                  </div>
                  <textarea
                    className="quote-area"
                    value={quote} onChange={e => setQuote(e.target.value)}
                    placeholder="A favourite quote, a personal motto, a line that defines your reading life…"
                    rows={3} maxLength={120}
                    disabled={!showQuote}
                    style={{ opacity: showQuote ? 1 : 0.35 }}
                  />
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.1)', textAlign: 'right', marginTop: '5px', fontFamily: 'var(--font-lora)' }}>
                    {quote.length}/120
                  </p>
                </Section>

                <Section title="Genres">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-lora)' }}>Show genres · up to 4</p>
                    <button className={`toggle-switch ${showGenres ? 'on' : 'off'}`} onClick={() => setShowGenres(p => !p)} />
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', opacity: showGenres ? 1 : 0.35 }}>
                    {GENRES_LIST.map(g => {
                      const on     = genres.includes(g)
                      const locked = !on && genres.length >= 4
                      return (
                        <button key={g} className={`genre-pill${on ? ' on' : ''}${locked ? ' locked' : ''}`}
                          onClick={() => showGenres && !locked && toggleGenre(g)}>
                          {GENRE_ICONS[g]} {g}
                        </button>
                      )
                    })}
                  </div>
                </Section>

                <Section title="Reading Stats">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-lora)' }}>Show stats on bookmark</p>
                    <button className={`toggle-switch ${showStats ? 'on' : 'off'}`} onClick={() => setShowStats(p => !p)} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', opacity: showStats ? 1 : 0.35 }}>
                    {[
                      { icon: '📚', label: 'Books read',  value: stats.booksRead },
                      { icon: '📄', label: 'Pages',       value: stats.totalPages.toLocaleString() },
                      { icon: '🔥', label: 'Day streak',  value: stats.streak },
                    ].map(s => (
                      <div key={s.label} className="stat-display">
                        <span style={{ fontSize: '18px', display: 'block', marginBottom: '5px' }}>{s.icon}</span>
                        <p style={{ margin: 0, fontFamily: 'var(--font-playfair)', fontSize: '17px', fontWeight: 700, color: '#c9a84c' }}>{s.value}</p>
                        <p style={{ margin: '3px 0 0', fontSize: '9px', color: 'rgba(255,255,255,0.18)', fontFamily: 'var(--font-lora)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <p style={{ marginTop: '10px', fontSize: '11px', color: 'rgba(255,255,255,0.1)', fontFamily: 'var(--font-lora)', fontStyle: 'italic', textAlign: 'center' }}>
                    Auto-updated as you read
                  </p>
                </Section>

              </div>
            )}

            {/* ── LAYOUT TAB ── */}
            {activeTab === 'layout' && (
              <div style={{ animation: 'secIn 0.25s ease both' }}>

                <Section title="Layout style">
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {LAYOUTS.map(l => (
                      <button key={l.id} className={`layout-btn${layout === l.id ? ' on' : ''}`} onClick={() => setLayout(l.id)}>
                        <span style={{ fontSize: '22px', opacity: layout === l.id ? 1 : 0.3 }}>{l.icon}</span>
                        <span style={{ fontSize: '11px', fontFamily: 'var(--font-playfair)', letterSpacing: '0.06em' }}>{l.name}</span>
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.18)', fontFamily: 'var(--font-lora)' }}>
                          {l.id === 'classic' ? 'Balanced' : l.id === 'minimal' ? 'Clean' : 'Impact'}
                        </span>
                      </button>
                    ))}
                  </div>
                </Section>

                <Section title="Preview info" defaultOpen={false}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { label: 'Quote block',   state: showQuote,  set: setShowQuote },
                      { label: 'Reading stats', state: showStats,  set: setShowStats },
                      { label: 'Genres tags',   state: showGenres, set: setShowGenres },
                    ].map(row => (
                      <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12px', color: 'rgba(232,220,200,0.4)', fontFamily: 'var(--font-lora)' }}>{row.label}</span>
                        <button className={`toggle-switch ${row.state ? 'on' : 'off'}`} onClick={() => row.set(p => !p)} />
                      </div>
                    ))}
                  </div>
                </Section>

              </div>
            )}

          </div>

          {/* ── RIGHT: Preview + actions ── */}
          <div style={{ position: 'sticky', top: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>

            {/* Label */}
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ flex: 1 }}><div className="shimmer-line" /></div>
              <span style={{ fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.15)', fontFamily: 'var(--font-playfair)', whiteSpace: 'nowrap' }}>Live preview</span>
              <div style={{ flex: 1 }}><div className="shimmer-line" /></div>
            </div>

            {/* Bookmark */}
            <div ref={bookmarkRef} style={{ display: 'flex', justifyContent: 'center' }}>
              <BookmarkCard
                themeId={themeId}
                layout={layout}
                fontId={fontId}
                username={username}
                quote={quote}
                stats={stats}
                genres={genres}
                showStats={showStats}
                showGenres={showGenres}
                showQuote={showQuote}
                ornament={ornament}
              />
            </div>

            {/* Action buttons */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className="action-btn ghost" onClick={handleDownload}>
                {downloading
                  ? <div style={{ width: '13px', height: '13px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'rgba(255,255,255,0.4)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                }
                {downloading ? 'Exporting…' : 'Download PNG'}
              </button>
              <button className={`action-btn ghost`} onClick={handleShare} style={copied ? { borderColor: 'rgba(100,180,80,0.3)', color: 'rgba(140,200,100,0.8)' } : {}}>
                {copied
                  ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Copied!</>
                  : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>Share</>
                }
              </button>
            </div>

            {/* Theme accent indicator */}
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: currentTheme.accent, boxShadow: `0 0 8px ${currentTheme.accentGlow}`, flexShrink: 0 }} />
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-lora)' }}>
                {currentTheme.name} · {LAYOUTS.find(l => l.id === layout)?.name} · {FONTS.find(f => f.id === fontId)?.name}
              </span>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}