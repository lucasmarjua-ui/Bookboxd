'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { signOut } from '@/lib/auth'
import { usePathname, useRouter } from 'next/navigation'

const NAV = [
  {
    section: null,
    items: [
      { href: '/descubrir', label: 'Discover', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
      { href: '/usuarios',  label: 'Readers',  icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
    ],
  },
  {
    section: 'My Shelf',
    items: [
      { href: '/feed',        label: 'Activity',     icon: 'M22 12h-4l-3 9L9 3l-3 9H2' },
      { href: '/listas',      label: 'Lists',        icon: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 12h6M9 16h4' },
      { href: '/lectura',     label: 'Tracker',      icon: 'M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z' },
      { href: '/logros',      label: 'Achievements', icon: 'M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM8.21 13.89L7 23l5-3 5 3-1.21-9.12' },
      { href: '/estadisticas',label: 'Stats',        icon: 'M18 20V10M12 20V4M6 20v-6' },
      { href: '/bookmark', label: 'Bookmark', icon: 'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z' },
    ],
  },
]

const PRIVATE = ['/feed', '/listas', '/lectura', '/logros', '/estadisticas']
const W_OPEN   = 220
const W_CLOSED =  56

export default function Sidebar({ onExpandedChange }) {
  const [user, setUser]           = useState(null)
  const [profile, setProfile]     = useState(null)
  const [expanded, setExpanded]   = useState(false)
  const [mounted, setMounted]     = useState(false)
  const [searchQuery, setSearch]  = useState('')
  const [searchFocused, setSF]    = useState(false)
  const pathname = usePathname()
  const router   = useRouter()
  const hoverTimer = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const { data } = await supabase
          .from('profiles').select('username, avatar_url')
          .eq('id', session.user.id).single()
        setProfile(data)
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const { data } = await supabase
          .from('profiles').select('username, avatar_url')
          .eq('id', session.user.id).single()
        setProfile(data)
      }
    })
    return () => { clearTimeout(t); subscription.unsubscribe() }
  }, [])

  // Notifica al layout el ancho actual
  useEffect(() => {
    onExpandedChange?.(expanded)
  }, [expanded])

  function handleMouseEnter() {
    clearTimeout(hoverTimer.current)
    setExpanded(true)
  }
  function handleMouseLeave() {
    // Pequeño delay para que no se cierre accidentalmente
    hoverTimer.current = setTimeout(() => setExpanded(false), 120)
  }

  function handleSearch(e) {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/buscar?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearch('')
    }
  }

  async function handleSignOut() {
    await signOut()
    router.push('/')
  }

  const isActive = (href) => pathname === href || pathname.startsWith(href + '/')
  const displayName = profile?.username || user?.email?.split('@')[0] || '?'
  const initials    = displayName[0]?.toUpperCase()

  return (
    <>
      <style>{`
        @keyframes sb-enter {
          from { opacity: 0; transform: translateX(-100%); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .sb-root {
          opacity: 0;
          transform: translateX(-100%);
        }
        .sb-root.mounted {
          animation: sb-enter 0.5s cubic-bezier(0.22,1,0.36,1) forwards;
        }

        /* Labels y elementos que se ocultan cuando está cerrado */
        .sb-label, .sb-search, .sb-section-label, .sb-user-name {
          opacity: 0;
          transform: translateX(-6px);
          transition: opacity 0.18s ease, transform 0.18s ease;
          white-space: nowrap;
          overflow: hidden;
          pointer-events: none;
        }
        .sb-expanded .sb-label,
        .sb-expanded .sb-search,
        .sb-expanded .sb-section-label,
        .sb-expanded .sb-user-name {
          opacity: 1;
          transform: translateX(0);
          pointer-events: auto;
        }
        /* Delays escalonados para entrada en cascada */
        .sb-expanded .sb-section-label  { transition-delay: 0.04s; }
        .sb-expanded .sb-label          { transition-delay: 0.06s; }
        .sb-expanded .sb-search         { transition-delay: 0.05s; }
        .sb-expanded .sb-user-name      { transition-delay: 0.07s; }

        .sb-link {
          position: relative;
          display: flex; align-items: center; gap: 12px;
          padding: 9px;
          border-radius: 10px;
          text-decoration: none;
          transition: color 0.15s, background 0.15s, padding 0.25s;
          color: rgba(232,220,200,0.28);
          font-size: 13px;
          font-family: var(--font-lora);
          letter-spacing: 0.02em;
          border: 1px solid transparent;
          overflow: hidden;
        }
        .sb-expanded .sb-link { padding: 9px 11px; }
        .sb-link:hover { color: rgba(232,220,200,0.72); background: rgba(255,255,255,0.035); }
        .sb-link.active {
          color: #c9a84c;
          background: rgba(201,168,76,0.07);
          border-color: rgba(201,168,76,0.14);
        }
        .sb-link.active .sb-icon { stroke: #c9a84c; }
        .sb-link.active .sb-dot  { opacity: 1; }

        .sb-dot {
          position: absolute; left: 2px; top: 50%; transform: translateY(-50%);
          width: 3px; height: 3px; border-radius: 50%;
          background: #c9a84c; opacity: 0; transition: opacity 0.2s;
          flex-shrink: 0;
        }
        .sb-icon { flex-shrink: 0; stroke: currentColor; transition: stroke 0.15s; }

        .sb-section-label {
          font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase;
          color: rgba(255,255,255,0.1); padding: 0 11px; margin: 18px 0 4px;
          font-family: var(--font-playfair);
        }
        .sb-divider {
          height: 1px; background: rgba(201,168,76,0.06); margin: 12px 10px;
        }
        .sb-logo-star {
          display: inline-block;
          transition: transform 0.5s cubic-bezier(0.34,1.56,0.64,1);
          color: #c9a84c; font-size: 14px; line-height: 1;
        }
        .sb-root:hover .sb-logo-star { transform: rotate(180deg) scale(1.15); }

        /* Search */
        .sb-search-wrap {
          display: flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 9px; padding: 0 11px; height: 33px;
          transition: background 0.2s, border-color 0.2s, opacity 0.2s;
          overflow: hidden;
        }
        .sb-search-wrap.sf {
          background: rgba(201,168,76,0.04);
          border-color: rgba(201,168,76,0.18);
        }
        .sb-search-input {
          flex: 1; background: none; border: none; outline: none;
          color: #e8dcc8; font-size: 12.5px; font-family: var(--font-lora);
          min-width: 0;
        }
        .sb-search-input::placeholder { color: rgba(232,220,200,0.18); }

        /* Mobile */
        .mob-bar {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
          background: #0a0906; border-top: 1px solid rgba(201,168,76,0.1);
          display: flex; align-items: center; justify-content: space-around;
          padding: 8px 0 10px;
        }
        .mob-item {
          display: flex; flex-direction: column; align-items: center; gap: 3px;
          text-decoration: none; padding: 4px 12px;
          color: rgba(255,255,255,0.25); transition: color 0.15s;
        }
        .mob-item.active { color: #c9a84c; }
        .mob-item span { font-size: 10px; font-family: var(--font-playfair); letter-spacing: 0.05em; }
        @media (min-width: 768px) { .mob-bar { display: none !important; } }
        @media (max-width: 767px)  { .sb-desktop { display: none !important; } }
      `}</style>

      {/* ── Desktop ── */}
      <aside
        className={`sb-desktop sb-root${mounted ? ' mounted' : ''}${expanded ? ' sb-expanded' : ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          position: 'fixed',
          left: 0, top: 0, bottom: 0,
          width: expanded ? `${W_OPEN}px` : `${W_CLOSED}px`,
          zIndex: 40,
          background: '#0a0906',
          borderRight: '1px solid rgba(201,168,76,0.07)',
          display: 'flex', flexDirection: 'column',
          transition: 'width 0.28s cubic-bezier(0.4,0,0.2,1)',
          overflow: 'hidden',
        }}
      >

        {/* ── Logo ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '20px 13px 18px',
          borderBottom: '1px solid rgba(201,168,76,0.06)',
          flexShrink: 0,
          overflow: 'hidden',
        }}>
          <Link href="/inicio" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <div style={{
              width: '30px', height: '30px',
              background: 'rgba(201,168,76,0.08)',
              border: '1px solid rgba(201,168,76,0.2)',
              borderRadius: '9px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              transition: 'background 0.2s, box-shadow 0.2s',
            }}>
              <span className="sb-logo-star">✦</span>
            </div>
            <span className="sb-label" style={{
              fontFamily: 'var(--font-playfair)',
              color: '#e8dcc8', fontWeight: 700,
              fontSize: '15px', letterSpacing: '0.04em',
            }}>
              Bookboxd
            </span>
          </Link>
        </div>

        {/* ── Search ── */}
        <div style={{ padding: '13px 10px 4px', flexShrink: 0, overflow: 'hidden' }}>
          <form onSubmit={handleSearch}>
            <div className={`sb-search-wrap${searchFocused ? ' sf' : ''}`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke={searchFocused ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.15)'}
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ flexShrink: 0, transition: 'stroke 0.2s' }}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearch(e.target.value)}
                onFocus={() => setSF(true)}
                onBlur={() => setSF(false)}
                placeholder="Search..."
                className="sb-search-input sb-search"
                style={{ width: expanded ? 'auto' : '0', minWidth: 0, padding: 0 }}
              />
              {searchQuery && expanded && (
                <button type="button" onClick={() => setSearch('')} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.15)', fontSize: '15px',
                  padding: 0, lineHeight: 1, flexShrink: 0, transition: 'color 0.15s',
                }}
                  onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.4)'}
                  onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.15)'}
                >×</button>
              )}
            </div>
          </form>
        </div>

        {/* ── Nav ── */}
        <nav style={{
          flex: 1, padding: '6px 8px',
          overflowY: 'auto', overflowX: 'hidden',
          scrollbarWidth: 'none',
        }}>
          {NAV.map((group, gi) => (
            <div key={gi}>
              {group.section && (
                <>
                  {expanded
                    ? <div className="sb-section-label">{group.section}</div>
                    : <div className="sb-divider" />
                  }
                </>
              )}
              {group.items
                .filter(item => !PRIVATE.includes(item.href) || user)
                .map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sb-link${isActive(item.href) ? ' active' : ''}`}
                    title={!expanded ? item.label : undefined}
                    style={{ justifyContent: expanded ? 'flex-start' : 'center' }}
                  >
                    <span className="sb-dot" />
                    <svg className="sb-icon" width="16" height="16" viewBox="0 0 24 24"
                      fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d={item.icon}/>
                    </svg>
                    <span className="sb-label">{item.label}</span>
                  </Link>
                ))}
            </div>
          ))}
        </nav>

        {/* ── Divider ── */}
        <div className="sb-divider" style={{ margin: '0 10px', flexShrink: 0 }} />

        {/* ── User footer ── */}
        {user && (
          <div style={{
            padding: '10px 10px 14px',
            flexShrink: 0,
            overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center',
              gap: expanded ? '9px' : '0',
              padding: expanded ? '8px 9px' : '8px',
              borderRadius: '10px',
              background: expanded ? 'rgba(201,168,76,0.04)' : 'transparent',
              border: `1px solid ${expanded ? 'rgba(201,168,76,0.08)' : 'transparent'}`,
              transition: 'background 0.2s, border-color 0.2s, padding 0.28s',
              justifyContent: expanded ? 'flex-start' : 'center',
            }}>
              <Link href="/perfil" title={!expanded ? displayName : undefined}
                style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '9px', flex: expanded ? 1 : 'none', minWidth: 0 }}>
                <div style={{
                  width: '30px', height: '30px', borderRadius: '50%',
                  background: 'rgba(201,168,76,0.12)',
                  border: '1px solid rgba(201,168,76,0.22)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#c9a84c', fontSize: '12px', fontWeight: 700,
                  fontFamily: 'var(--font-playfair)',
                  flexShrink: 0,
                  transition: 'all 0.15s',
                }}>
                  {initials}
                </div>
                <div className="sb-user-name" style={{ overflow: 'hidden', flex: 1 }}>
                  <p style={{
                    margin: 0, fontSize: '12px',
                    fontFamily: 'var(--font-playfair)',
                    color: 'rgba(232,220,200,0.8)', fontWeight: 600,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{displayName}</p>
                  <p style={{
                    margin: 0, fontSize: '10px',
                    color: 'rgba(255,255,255,0.18)', letterSpacing: '0.05em',
                    fontFamily: 'var(--font-lora)',
                  }}>Reader</p>
                </div>
              </Link>

              {expanded && (
                <button onClick={handleSignOut} title="Sign out" style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.15)', padding: '4px',
                  borderRadius: '6px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0,
                }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.15)'; e.currentTarget.style.background = 'none' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* ── Mobile bottom bar ── */}
      <nav className="mob-bar">
        {[
          { href: '/descubrir', label: 'Discover', d: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
          { href: '/feed',      label: 'Activity', d: 'M22 12h-4l-3 9L9 3l-3 9H2' },
          { href: '/buscar',    label: 'Search',   d: 'M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z' },
          { href: '/listas',    label: 'Lists',    d: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2' },
          { href: '/perfil',    label: 'Profile',  d: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className={`mob-item${isActive(item.href) ? ' active' : ''}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d={item.d}/>
            </svg>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  )
}