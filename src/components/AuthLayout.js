'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'

const PUBLIC_ONLY_ROUTES = ['/login', '/registro', '/']
const W_OPEN   = 220
const W_CLOSED =  56

export default function AuthLayout({ children }) {
  const [user, setUser]               = useState(null)
  const [loading, setLoading]         = useState(true)
  const [sidebarExpanded, setExpanded] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const isPublicRoute = PUBLIC_ONLY_ROUTES.includes(pathname)
  const showChrome    = user && !isPublicRoute

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: '#1a1408',
      }}>
        <span style={{ color: '#c9a84c', fontSize: '2rem' }}>✦</span>
      </div>
    )
  }

  if (!showChrome) return <>{children}</>

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar onExpandedChange={setExpanded} />
      <main
        style={{
          flex: 1,
          marginLeft: sidebarExpanded ? `${W_OPEN}px` : `${W_CLOSED}px`,
          transition: 'margin-left 0.28s cubic-bezier(0.4,0,0.2,1)',
          minHeight: '100vh',
        }}
        className="pb-16 md:pb-0"
      >
        {children}
      </main>
    </div>
  )
}