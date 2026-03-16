'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Feed() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    async function loadFeed() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) { router.push('/login'); return }
      setCurrentUser(user)

      // Obtener IDs de usuarios que sigo
      const { data: followData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)

      const followingIds = (followData || []).map(f => f.following_id)

      if (followingIds.length === 0) {
        setLoading(false)
        return
      }

      // Obtener actividad de esos usuarios
      const { data: feedData } = await supabase
        .from('activity_feed')
        .select('*')
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })
        .limit(30)

      setActivities(feedData || [])
      setLoading(false)
    }
    loadFeed()
  }, [])

  function getStatusLabel(status) {
    if (status === 'read') return { label: 'has read', color: 'text-[#a8c870]', icon: '✓' }
    if (status === 'reading') return { label: 'is reading', color: 'text-[#c9a84c]', icon: '📖' }
    if (status === 'want_to_read') return { label: 'wants to read', color: 'text-[#7ab0d4]', icon: '+' }
    return { label: '', color: '', icon: '' }
  }

  function timeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `ago ${minutes} min`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `ago ${hours}h`
    const days = Math.floor(hours / 24)
    if (days < 7) return `ago ${days}d`
    return new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">

      {/* Cabecera */}
      <div className="text-center mb-10">
        <p className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-3">Community</p>
        <h1 style={{fontFamily: 'var(--font-playfair)'}} className="text-4xl font-bold text-[#e8dcc8]">
          Activity
        </h1>
        <div className="flex items-center justify-center gap-4 mt-4">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#c9a84c40]" />
          <span className="text-[#c9a84c40]">✦</span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#c9a84c40]" />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <span className="text-[#c9a84c] text-4xl">✦</span>
          <p className="text-[#a89070] mt-4">Loading activity...</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-20 border border-[#c9a84c20] rounded-xl">
          <p className="text-[#a89070] italic mb-2">No recent activity.</p>
          <p className="text-[#5a4a30] text-sm mb-6">Follow other readers to see what they're reading.</p>
          <Link href="/usuarios" className="bg-[#c9a84c] hover:bg-[#d4b86a] text-[#12100a] font-semibold px-6 py-2.5 rounded transition tracking-wider text-sm">
            Find readers
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {activities.map(activity => (
            <div key={`${activity.type}-${activity.id}`}
              className="bg-[#12100a] border border-[#c9a84c15] hover:border-[#c9a84c30] rounded-xl p-5 transition">

              {/* Cabecera de la actividad */}
              <div className="flex items-center justify-between mb-4">
                <Link href={`/lector/${activity.user_id}`} className="flex items-center gap-3 group">
                  <div className="w-9 h-9 rounded-full bg-[#2a2010] border border-[#c9a84c30] flex items-center justify-center text-[#c9a84c] font-bold text-sm shrink-0"
                    style={{fontFamily: 'var(--font-playfair)'}}>
                    {activity.username?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <span style={{fontFamily: 'var(--font-playfair)'}}
                      className="font-semibold text-[#e8dcc8] group-hover:text-[#c9a84c] transition text-sm">
                      {activity.username}
                    </span>
                    {activity.type === 'review' ? (
                      <span className="text-[#5a4a30] text-sm"> wrote a review</span>
                    ) : (
                      <span className={`text-sm ${getStatusLabel(activity.status).color}`}>
                        {' '}{getStatusLabel(activity.status).label}
                      </span>
                    )}
                  </div>
                </Link>
                <span className="text-[#3a3020] text-xs">{timeAgo(activity.created_at)}</span>
              </div>

              {/* Libro */}
              <Link href={`/libro/${activity.book_id}`} className="flex gap-4 group">
                {activity.book_cover ? (
                  <img src={activity.book_cover} alt={activity.book_title}
                    className="w-12 h-18 object-cover rounded shadow-lg shrink-0" />
                ) : (
                  <div className="w-12 h-18 bg-[#1e1a10] border border-[#c9a84c20] rounded flex items-center justify-center text-[#c9a84c30] shrink-0">
                    📖
                  </div>
                )}
                <div className="flex flex-col justify-center">
                  <h3 style={{fontFamily: 'var(--font-playfair)'}}
                    className="font-semibold text-[#e8dcc8] group-hover:text-[#c9a84c] transition leading-tight">
                    {activity.book_title}
                  </h3>
                  {activity.book_author && (
                    <p className="text-[#a89070] text-xs mt-0.5">{activity.book_author}</p>
                  )}
                  {activity.type === 'review' && (
                    <div className="flex gap-0.5 mt-1">
                      {[1,2,3,4,5].map(star => (
                        <span key={star} className={star <= activity.rating ? 'text-[#c9a84c] text-sm' : 'text-[#2a2010] text-sm'}>★</span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>

              {/* Reseña si existe */}
              {activity.type === 'review' && activity.content && (
                <div className="mt-4 pl-16">
                  <p className="text-[#a89070] text-sm italic leading-relaxed line-clamp-3">
                    "{activity.content}"
                  </p>
                </div>
              )}

            </div>
          ))}
        </div>
      )}

    </main>
  )
}