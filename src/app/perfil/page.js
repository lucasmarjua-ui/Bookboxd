'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ─── Synced with bookmark-v2: 6 themes, layouts, fonts, ornaments ─────────────
const THEMES = [
  { id:'noir',     bg:'linear-gradient(160deg,#0d0b08 0%,#1a1408 55%,#110e08 100%)', accent:'#c9a84c',  accentSoft:'rgba(201,168,76,0.13)',  accentGlow:'rgba(201,168,76,0.22)',  text:'#e8dcc8',  textMuted:'rgba(232,220,200,0.42)', border:'rgba(201,168,76,0.18)',  pattern:'dots',   notch:'#0d0b08', name:'Noir' },
  { id:'ivory',    bg:'linear-gradient(160deg,#f7f2ea 0%,#ede4d0 55%,#f5f0e8 100%)', accent:'#8b5e3c', accentSoft:'rgba(139,94,60,0.1)',    accentGlow:'rgba(139,94,60,0.18)',   text:'#2a1f12',  textMuted:'rgba(42,31,18,0.42)',    border:'rgba(139,94,60,0.18)',   pattern:'lines',  notch:'#f7f2ea', name:'Ivory' },
  { id:'midnight', bg:'linear-gradient(160deg,#0a0d1a 0%,#0f1628 55%,#0c1020 100%)', accent:'#7b9cdc', accentSoft:'rgba(123,156,220,0.12)', accentGlow:'rgba(123,156,220,0.2)',  text:'#d4dff5',  textMuted:'rgba(212,223,245,0.38)', border:'rgba(123,156,220,0.18)', pattern:'grid',   notch:'#0a0d1a', name:'Midnight' },
  { id:'forest',   bg:'linear-gradient(160deg,#0a120c 0%,#0f1a10 55%,#0c1510 100%)', accent:'#7ab870', accentSoft:'rgba(122,184,112,0.12)', accentGlow:'rgba(122,184,112,0.2)',  text:'#d0e8cc',  textMuted:'rgba(208,232,204,0.4)',  border:'rgba(122,184,112,0.18)', pattern:'leaves', notch:'#0a120c', name:'Forest' },
  { id:'crimson',  bg:'linear-gradient(160deg,#140808 0%,#1e0c0c 55%,#160a0a 100%)', accent:'#c84c4c', accentSoft:'rgba(200,76,76,0.12)',   accentGlow:'rgba(200,76,76,0.2)',    text:'#f0d8d8',  textMuted:'rgba(240,216,216,0.4)', border:'rgba(200,76,76,0.18)',   pattern:'dots',   notch:'#140808', name:'Crimson' },
  { id:'dusk',     bg:'linear-gradient(160deg,#150e18 0%,#1e1228 55%,#180f20 100%)', accent:'#c49cdc', accentSoft:'rgba(196,156,220,0.12)', accentGlow:'rgba(196,156,220,0.2)',  text:'#ecdcf5',  textMuted:'rgba(236,220,245,0.4)', border:'rgba(196,156,220,0.18)', pattern:'grid',   notch:'#150e18', name:'Dusk' },
]

const FONTS = {
  playfair: "'Playfair Display', Georgia, serif",
  lora:     "'Lora', Georgia, serif",
  georgia:  "Georgia, serif",
}

const GENRE_ICONS = {
  'Fiction':'✦','Non-fiction':'◆','Fantasy':'◈','Sci-Fi':'◉',
  'Mystery':'◎','Romance':'♡','Horror':'◇','History':'▣',
  'Biography':'◐','Poetry':'❧','Philosophy':'◑','Science':'◒',
  'Travel':'◌','Art':'◍','Music':'●','Comics':'◫',
}

function BgPattern({ pattern, color }) {
  if (pattern === 'dots') return (
    <svg style={{ position:'absolute',inset:0,width:'100%',height:'100%',opacity:0.35 }} xmlns="http://www.w3.org/2000/svg">
      <defs><pattern id="wp1" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill={color}/></pattern></defs>
      <rect width="100%" height="100%" fill="url(#wp1)"/>
    </svg>
  )
  if (pattern === 'lines') return (
    <svg style={{ position:'absolute',inset:0,width:'100%',height:'100%',opacity:0.2 }} xmlns="http://www.w3.org/2000/svg">
      <defs><pattern id="wp2" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><line x1="0" y1="20" x2="20" y2="0" stroke={color} strokeWidth="0.75"/></pattern></defs>
      <rect width="100%" height="100%" fill="url(#wp2)"/>
    </svg>
  )
  if (pattern === 'grid') return (
    <svg style={{ position:'absolute',inset:0,width:'100%',height:'100%',opacity:0.12 }} xmlns="http://www.w3.org/2000/svg">
      <defs><pattern id="wp3" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M 24 0 L 0 0 0 24" fill="none" stroke={color} strokeWidth="0.5"/></pattern></defs>
      <rect width="100%" height="100%" fill="url(#wp3)"/>
    </svg>
  )
  if (pattern === 'leaves') return (
    <svg style={{ position:'absolute',inset:0,width:'100%',height:'100%',opacity:0.1 }} xmlns="http://www.w3.org/2000/svg">
      <defs><pattern id="wp4" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M15 5 Q22 12 15 25 Q8 12 15 5Z" fill={color}/></pattern></defs>
      <rect width="100%" height="100%" fill="url(#wp4)"/>
    </svg>
  )
  return null
}

function BookmarkWidget({ profile, stats }) {
  const t          = THEMES.find(x => x.id === (profile?.bookmark_theme || 'noir')) || THEMES[0]
  const font       = FONTS[profile?.bookmark_font] || FONTS.playfair
  const quote      = profile?.bookmark_quote    || ''
  const genres     = profile?.bookmark_genres   || []
  const ornament   = profile?.bookmark_ornament || '✦'
  const layout     = profile?.bookmark_layout   || 'classic'
  const showStats  = profile?.bookmark_show_stats  !== false
  const showGenres = profile?.bookmark_show_genres !== false
  const showQuote  = profile?.bookmark_show_quote  !== false
  const username   = profile?.username || 'Reader'
  const isBold     = layout === 'bold'
  const isMinimal  = layout === 'minimal'

  return (
    <div style={{
      width:190, height:480, position:'relative',
      background:t.bg, borderRadius:'13px', overflow:'hidden',
      border:`1px solid ${t.border}`,
      boxShadow:`0 24px 55px rgba(0,0,0,0.6), 0 0 40px ${t.accentGlow}`,
      flexShrink:0, fontFamily:font,
    }}>
      <BgPattern pattern={t.pattern} color={t.accent} />
      <div style={{ position:'absolute', top:'-30px', left:'50%', transform:'translateX(-50%)', width:'160px', height:'140px', background:`radial-gradient(ellipse, ${t.accentGlow} 0%, transparent 70%)`, pointerEvents:'none' }} />

      {isBold
        ? <div style={{ position:'absolute', top:0, left:0, right:0, height:'4px', background:`linear-gradient(to right, transparent, ${t.accent}, transparent)` }} />
        : <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:'2px', height:'26px', background:`linear-gradient(to bottom, ${t.accent}, transparent)` }} />
      }

      <div style={{ position:'relative', zIndex:1, height:'100%', display:'flex', flexDirection:'column', padding:isMinimal?'36px 14px 20px':isBold?'30px 16px 20px':'44px 16px 22px' }}>

        {!isMinimal && (
          <div style={{ textAlign:'center', marginBottom:'12px' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'3px 9px', background:t.accentSoft, border:`1px solid ${t.border}`, borderRadius:'20px' }}>
              <span style={{ color:t.accent, fontSize:'7px' }}>✦</span>
              <span style={{ color:t.textMuted, fontSize:'6.5px', letterSpacing:'0.18em', textTransform:'uppercase' }}>Bookboxd</span>
            </div>
          </div>
        )}

        {!isBold && (
          <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'12px' }}>
            <div style={{ flex:1, height:'1px', background:`linear-gradient(to right, transparent, ${t.border})` }} />
            <span style={{ color:t.accent, fontSize:'6px', opacity:0.5 }}>{ornament}</span>
            <div style={{ flex:1, height:'1px', background:`linear-gradient(to left, transparent, ${t.border})` }} />
          </div>
        )}

        <div style={{ textAlign:'center', marginBottom:'12px' }}>
          {!isMinimal && <p style={{ color:t.textMuted, fontSize:'6.5px', letterSpacing:'0.18em', textTransform:'uppercase', marginBottom:'4px' }}>Reader</p>}
          <h2 style={{ color:t.text, fontSize:isBold?'16px':isMinimal?'15px':'14px', fontWeight:700, margin:0, lineHeight:1.1 }}>{username}</h2>
          {isMinimal && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', marginTop:'8px' }}>
              <div style={{ flex:1, maxWidth:'40px', height:'1px', background:`linear-gradient(to right, transparent, ${t.border})` }} />
              <span style={{ color:t.accent, fontSize:'6px', opacity:0.5 }}>{ornament}</span>
              <div style={{ flex:1, maxWidth:'40px', height:'1px', background:`linear-gradient(to left, transparent, ${t.border})` }} />
            </div>
          )}
        </div>

        {showQuote && quote && (
          <div style={{ background:t.accentSoft, border:`1px solid ${t.border}`, borderRadius:'7px', padding:'8px 10px', marginBottom:'10px', position:'relative' }}>
            <span style={{ position:'absolute', top:'-5px', left:'9px', color:t.accent, fontSize:'11px', lineHeight:1 }}>"</span>
            <p style={{ color:t.text, fontSize:'8.5px', lineHeight:1.65, margin:0, fontStyle:'italic' }}>
              {quote.length > 65 ? quote.slice(0,65)+'…' : quote}
            </p>
          </div>
        )}

        {showStats && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'3px', marginBottom:'10px' }}>
            {[
              { value:stats.booksRead, label:'Books' },
              { value:stats.totalPages>999?`${(stats.totalPages/1000).toFixed(1)}k`:(stats.totalPages||0), label:'Pages' },
              { value:stats.streak||0, label:'Streak' },
            ].map(s => (
              <div key={s.label} style={{ background:t.accentSoft, border:`1px solid ${t.border}`, borderRadius:'5px', padding:'5px 3px', textAlign:'center' }}>
                <p style={{ color:t.accent, fontSize:'11px', fontWeight:700, margin:0, lineHeight:1 }}>{s.value}</p>
                <p style={{ color:t.textMuted, fontSize:'5.5px', letterSpacing:'0.1em', textTransform:'uppercase', margin:'2px 0 0' }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {showGenres && genres.length > 0 && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:'3px', justifyContent:'center', marginBottom:'8px' }}>
            {genres.slice(0,3).map(g => (
              <span key={g} style={{ fontSize:'6.5px', padding:'2px 6px', background:t.accentSoft, border:`1px solid ${t.border}`, borderRadius:'20px', color:t.text }}>
                {GENRE_ICONS[g]||'◆'} {g}
              </span>
            ))}
          </div>
        )}

        <div style={{ flex:1 }} />
        <div style={{ display:'flex', alignItems:'center', gap:'5px', marginBottom:'7px' }}>
          <div style={{ flex:1, height:'1px', background:`linear-gradient(to right, transparent, ${t.border})` }} />
          <span style={{ color:t.accent, fontSize:'5px', opacity:0.4 }}>◆</span>
          <div style={{ flex:1, height:'1px', background:`linear-gradient(to left, transparent, ${t.border})` }} />
        </div>
        <p style={{ color:t.textMuted, fontSize:'6.5px', letterSpacing:'0.18em', textTransform:'uppercase', textAlign:'center', margin:0 }}>bookboxd.app</p>
      </div>

      <div style={{ position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)', width:0, height:0, borderLeft:'11px solid transparent', borderRight:'11px solid transparent', borderBottom:`13px solid ${t.notch}`, filter:`drop-shadow(0 -2px 4px ${t.accentSoft})` }} />
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Perfil() {
  const [user, setUser]           = useState(null)
  const [profile, setProfile]     = useState(null)
  const [reviews, setReviews]     = useState([])
  const [booklist, setBooklist]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [activeTab, setActiveTab] = useState('leidos')
  const [showBm, setShowBm]       = useState(false)
  const [bmStats, setBmStats]     = useState({ booksRead:0, totalPages:0, streak:0 })
  const router = useRouter()

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      const { data: profileData } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()
      setProfile(profileData)

      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      console.log('REVIEWS:', reviewsData, 'ERROR:', reviewsError)
      setReviews(reviewsData || [])

      const { data: booklistData, error: booklistError } = await supabase
        .from('booklist').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      console.log('BOOKLIST:', booklistData, 'ERROR:', booklistError)
      setBooklist(booklistData || [])

      const { data: logs } = await supabase
        .from('reading_log').select('pages_read, log_date').eq('user_id', user.id).order('log_date', { ascending: false })
      const booksRead  = (booklistData || []).filter(b => b.status === 'read').length
      const totalPages = (logs || []).reduce((a, l) => a + (l.pages_read || 0), 0)
      const today = new Date().toISOString().split('T')[0]
      const dates = [...new Set((logs || []).map(l => l.log_date))].sort((a,b) => b.localeCompare(a))
      let streak = 0, cur = today
      for (const d of dates) {
        if (d === cur) { streak++; const dt = new Date(cur); dt.setDate(dt.getDate()-1); cur = dt.toISOString().split('T')[0] }
        else break
      }
      setBmStats({ booksRead, totalPages, streak })
      setLoading(false)
    }
    loadProfile()
  }, [])

  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="text-center">
          <span className="text-[#c9a84c] text-4xl">✦</span>
          <p className="text-[#a89070] mt-4">Loading profile...</p>
        </div>
      </main>
    )
  }

  const leidos     = booklist.filter(b => b.status === 'read')
  const leyendo    = booklist.filter(b => b.status === 'reading')
  const quieroLeer = booklist.filter(b => b.status === 'want_to_read')
  const avgRating  = reviews.length
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : null

  const tabs = [
    { id:'leidos',  label:'Read',        count:leidos.length },
    { id:'leyendo', label:'Reading',      count:leyendo.length },
    { id:'quiero',  label:'Want to read', count:quieroLeer.length },
    { id:'resenas', label:'Reviews',      count:reviews.length },
  ]

  const activeBooks = activeTab==='leidos' ? leidos : activeTab==='leyendo' ? leyendo : activeTab==='quiero' ? quieroLeer : []
  const hasBookmark = !!profile?.bookmark_theme
  const bmTheme     = THEMES.find(t => t.id === (profile?.bookmark_theme || 'noir')) || THEMES[0]

  return (
    <>
      <style>{`
        @keyframes bmReveal {
          from { opacity:0; transform:translateY(14px) scale(0.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        .bm-panel { animation: bmReveal 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        .bm-toggle-btn {
          display:inline-flex; align-items:center; gap:6px;
          border:1px solid rgba(201,168,76,0.2); border-radius:20px;
          padding:4px 12px; font-size:11px; background:transparent;
          color:rgba(201,168,76,0.5); cursor:pointer; transition:all 0.15s;
          font-family:var(--font-lora); letter-spacing:0.06em;
        }
        .bm-toggle-btn:hover, .bm-toggle-btn.open {
          border-color:rgba(201,168,76,0.4); color:#c9a84c;
          background:rgba(201,168,76,0.05);
        }
      `}</style>

      <main className="max-w-4xl mx-auto px-6 py-12">

        {/* ── Cabecera ── */}
        <div className="flex items-center gap-7 mb-10">
          <div className="w-24 h-24 rounded-full bg-[#2a2010] border-2 border-[#c9a84c40] flex items-center justify-center text-[#c9a84c] text-4xl font-bold shrink-0"
            style={{fontFamily:'var(--font-playfair)'}}>
            {profile?.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-1">Reader</p>
            <h1 style={{fontFamily:'var(--font-playfair)'}} className="text-3xl font-bold text-[#e8dcc8]">
              {profile?.username}
            </h1>
            <p className="text-[#5a4a30] text-sm mt-1">{user?.email}</p>
            {profile?.bio && <p className="text-[#a89070] mt-2 italic text-sm">"{profile.bio}"</p>}

            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <Link href="/perfil/editar"
                className="inline-block border border-[#c9a84c30] hover:border-[#c9a84c] text-[#a89070] hover:text-[#c9a84c] text-xs px-4 py-1.5 rounded transition tracking-wider">
                Edit profile
              </Link>

              {hasBookmark ? (
                <button className={`bm-toggle-btn${showBm ? ' open' : ''}`} onClick={() => setShowBm(p => !p)}>
                  🔖 {showBm ? 'Hide bookmark' : 'My bookmark'}
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transform:showBm?'rotate(180deg)':'none', transition:'transform 0.2s' }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
              ) : (
                <Link href="/bookmark"
                  className="inline-flex items-center gap-1.5 border border-[#c9a84c15] hover:border-[#c9a84c30] text-[#c9a84c30] hover:text-[#c9a84c60] text-xs px-4 py-1.5 rounded-full transition tracking-wider">
                  ✦ Create your bookmark
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ── Bookmark panel — color adapts to user's chosen theme ── */}
        {showBm && hasBookmark && (
          <div className="bm-panel mb-10 rounded-2xl p-7 flex gap-8 items-center"
            style={{
              background: 'rgba(8,7,5,0.95)',
              border: `1px solid ${bmTheme.border}`,
              boxShadow: `0 0 50px ${bmTheme.accentGlow}`,
            }}>

            <BookmarkWidget profile={profile} stats={bmStats} />

            <div className="flex-1 min-w-0">
              {/* Theme pill */}
              <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'3px 10px', background:bmTheme.accentSoft, border:`1px solid ${bmTheme.border}`, borderRadius:'20px', marginBottom:'14px' }}>
                <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:bmTheme.accent, boxShadow:`0 0 7px ${bmTheme.accentGlow}` }} />
                <span style={{ fontSize:'10px', color:bmTheme.textMuted, fontFamily:'var(--font-lora)', letterSpacing:'0.1em' }}>
                  {bmTheme.name} theme
                </span>
              </div>

              <p style={{ color:bmTheme.accent, fontSize:'10px', letterSpacing:'0.25em', textTransform:'uppercase', fontFamily:'var(--font-playfair)', marginBottom:'4px' }}>
                Reading identity
              </p>
              <h3 style={{ fontFamily:'var(--font-playfair)', color:bmTheme.text, fontSize:'1.25rem', fontWeight:700, marginBottom:'10px', margin:'0 0 8px' }}>
                {profile?.username}'s Bookmark
              </h3>

              {profile?.bookmark_quote && (
                <p style={{ color:bmTheme.textMuted, fontStyle:'italic', fontSize:'13px', fontFamily:'var(--font-lora)', lineHeight:1.65, marginBottom:'18px', marginTop:'8px' }}>
                  "{profile.bookmark_quote}"
                </p>
              )}

              {/* Stats */}
              <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', marginBottom:'16px' }}>
                {[
                  { icon:'📚', value:bmStats.booksRead,                  label:'books read' },
                  { icon:'📄', value:bmStats.totalPages.toLocaleString(), label:'pages' },
                  { icon:'🔥', value:bmStats.streak,                     label:'day streak' },
                ].map(s => (
                  <div key={s.label} style={{ display:'flex', alignItems:'center', gap:'7px', padding:'7px 12px', borderRadius:'9px', background:bmTheme.accentSoft, border:`1px solid ${bmTheme.border}` }}>
                    <span style={{ fontSize:'13px' }}>{s.icon}</span>
                    <span style={{ fontFamily:'var(--font-playfair)', color:bmTheme.accent, fontSize:'14px', fontWeight:700 }}>{s.value}</span>
                    <span style={{ color:'rgba(255,255,255,0.18)', fontSize:'11px', fontFamily:'var(--font-lora)' }}>{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Genres */}
              {profile?.bookmark_genres?.length > 0 && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginBottom:'18px' }}>
                  {profile.bookmark_genres.map(g => (
                    <span key={g} style={{ fontSize:'11px', padding:'3px 10px', background:bmTheme.accentSoft, border:`1px solid ${bmTheme.border}`, borderRadius:'20px', color:bmTheme.text, fontFamily:'var(--font-lora)' }}>
                      {GENRE_ICONS[g]||'◆'} {g}
                    </span>
                  ))}
                </div>
              )}

              <Link href="/bookmark" style={{ display:'inline-flex', alignItems:'center', gap:'7px', padding:'8px 16px', borderRadius:'9px', background:bmTheme.accentSoft, border:`1px solid ${bmTheme.border}`, color:bmTheme.accent, fontSize:'12px', fontFamily:'var(--font-lora)', letterSpacing:'0.05em', textDecoration:'none', transition:'all 0.15s' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Customize
              </Link>
            </div>
          </div>
        )}

        {/* ── Estadísticas ── */}
        <div className="grid grid-cols-4 gap-4 mb-3">
          {[
            { value:leidos.length,     label:'Read',       color:'text-[#a8c870]' },
            { value:leyendo.length,    label:'Reading',    color:'text-[#c9a84c]' },
            { value:quieroLeer.length, label:'Pending',    color:'text-[#7ab0d4]' },
            { value:avgRating||'—',    label:'Avg. rating',color:'text-[#c9a84c]' },
          ].map((stat,i) => (
            <div key={i} className="bg-[#12100a] border border-[#c9a84c20] rounded-xl p-4 text-center">
              <p className={`text-3xl font-bold ${stat.color}`} style={{fontFamily:'var(--font-playfair)'}}>
                {stat.value}
              </p>
              <p className="text-[#5a4a30] text-xs mt-1 tracking-wider uppercase">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-end mb-6">
          <Link href="/estadisticas" className="text-[#c9a84c] hover:text-[#d4b86a] text-xs tracking-wider transition">
            View full stats →
          </Link>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 border-b border-[#c9a84c20] mb-8">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm tracking-wider transition border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-[#c9a84c] text-[#c9a84c]'
                  : 'border-transparent text-[#5a4a30] hover:text-[#a89070]'
              }`}>
              {tab.label}
              <span className="ml-2 text-xs opacity-60">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* ── Contenido del tab ── */}
        {activeTab === 'resenas' ? (
          <div className="flex flex-col gap-4">
            {reviews.length === 0 ? (
              <p className="text-[#a89070] italic text-center py-10">You haven't written any reviews yet.</p>
            ) : reviews.map(review => (
              <Link key={review.id} href={`/libro/${review.book_id}`}
                className="bg-[#12100a] border border-[#c9a84c15] hover:border-[#c9a84c40] rounded-xl p-5 flex gap-4 transition">
                {review.book_cover && (
                  <img src={review.book_cover} alt={review.book_title} className="w-12 h-18 object-cover rounded shrink-0" />
                )}
                <div className="flex-1">
                  <h3 style={{fontFamily:'var(--font-playfair)'}} className="font-semibold text-[#e8dcc8]">{review.book_title}</h3>
                  <p className="text-[#a89070] text-xs">{review.book_author}</p>
                  <div className="flex gap-0.5 mt-1">
                    {[1,2,3,4,5].map(star => (
                      <span key={star} className={star <= review.rating ? 'text-[#c9a84c]' : 'text-[#2a2010]'}>★</span>
                    ))}
                  </div>
                  {review.content && <p className="text-[#a89070] text-sm mt-2 italic">"{review.content}"</p>}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div>
            {activeBooks.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-[#a89070] italic mb-4">No books in this list.</p>
                <Link href="/buscar" className="text-[#c9a84c] hover:text-[#d4b86a] transition text-sm">Explore books →</Link>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                {activeBooks.map(book => (
                  <Link key={book.id} href={`/libro/${book.book_id}`} className="group flex flex-col gap-2">
                    {book.book_cover
                      ? <img src={book.book_cover} alt={book.book_title} className="w-full aspect-[2/3] object-cover rounded-lg shadow-lg group-hover:shadow-[#c9a84c20] transition" />
                      : <div className="w-full aspect-[2/3] bg-[#1e1a10] border border-[#c9a84c20] rounded-lg flex items-center justify-center text-[#c9a84c30] text-2xl">📖</div>
                    }
                    <p className="text-[#a89070] text-xs line-clamp-1 text-center">{book.book_title}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </>
  )
}