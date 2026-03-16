'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function Lector() {
  const { id } = useParams()
  const [profile, setProfile] = useState(null)
  const [reviews, setReviews] = useState([])
  const [booklist, setBooklist] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('leidos')

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      const { data: profileData } = await supabase
        .from('profiles').select('*').eq('id', id).single()
      setProfile(profileData)

      const { data: reviewsData } = await supabase
        .from('reviews').select('*').eq('user_id', id)
        .order('created_at', { ascending: false })
      setReviews(reviewsData || [])

      const { data: booklistData } = await supabase
        .from('booklist').select('*').eq('user_id', id)
        .order('created_at', { ascending: false })
      setBooklist(booklistData || [])

      const { count: followers } = await supabase
        .from('follows').select('*', { count: 'exact', head: true })
        .eq('following_id', id)
      setFollowersCount(followers || 0)

      const { count: followingC } = await supabase
        .from('follows').select('*', { count: 'exact', head: true })
        .eq('follower_id', id)
      setFollowingCount(followingC || 0)

      if (user) {
        const { data: followData } = await supabase
          .from('follows')
          .select('*')
          .eq('follower_id', user.id)
          .eq('following_id', id)
          .single()
        setIsFollowing(!!followData)
      }

      setLoading(false)
    }
    loadData()
  }, [id])

  async function toggleFollow() {
    if (!currentUser) return

    if (isFollowing) {
      await supabase.from('follows').delete()
        .eq('follower_id', currentUser.id)
        .eq('following_id', id)
      setIsFollowing(false)
      setFollowersCount(prev => prev - 1)
    } else {
      await supabase.from('follows').insert({
        follower_id: currentUser.id,
        following_id: id,
      })
      setIsFollowing(true)
      setFollowersCount(prev => prev + 1)
    }
  }

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

  if (!profile) {
    return (
      <main className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <p className="text-[#a89070]">Reader not found.</p>
      </main>
    )
  }

  const leidos = booklist.filter(b => b.status === 'read')
  const leyendo = booklist.filter(b => b.status === 'reading')
  const quieroLeer = booklist.filter(b => b.status === 'want_to_read')
  const avgRating = reviews.length
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : null

  const tabs = [
    { id: 'leidos', label: 'Read', count: leidos.length },
    { id: 'leyendo', label: 'Reading', count: leyendo.length },
    { id: 'quiero', label: 'Want to Read', count: quieroLeer.length },
    { id: 'resenas', label: 'Reviews', count: reviews.length },
  ]

  const activeBooks = activeTab === 'leidos' ? leidos : activeTab === 'leyendo' ? leyendo : activeTab === 'quiero' ? quieroLeer : []

  return (
    <main className="max-w-4xl mx-auto px-6 py-12">

      {/* Cabecera */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-7">
          <div className="w-24 h-24 rounded-full bg-[#2a2010] border-2 border-[#c9a84c40] flex items-center justify-center text-[#c9a84c] text-4xl font-bold shrink-0"
            style={{fontFamily: 'var(--font-playfair)'}}>
            {profile.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-1">Reader</p>
            <h1 style={{fontFamily: 'var(--font-playfair)'}} className="text-3xl font-bold text-[#e8dcc8]">
              {profile.username}
            </h1>
            <div className="flex gap-5 mt-2">
              <span className="text-[#a89070] text-sm">
                <span className="text-[#e8dcc8] font-semibold">{followersCount}</span> followers
              </span>
              <span className="text-[#a89070] text-sm">
                <span className="text-[#e8dcc8] font-semibold">{followingCount}</span> following
              </span>
            </div>
            {profile.bio && <p className="text-[#a89070] mt-2 italic text-sm">"{profile.bio}"</p>}
          </div>
        </div>

        {currentUser && currentUser.id !== id && (
          <button
            onClick={toggleFollow}
            className={`text-sm px-6 py-2.5 rounded transition tracking-wider border ${
              isFollowing
                ? 'border-[#c9a84c50] text-[#c9a84c] hover:border-red-800 hover:text-red-400'
                : 'bg-[#c9a84c] hover:bg-[#d4b86a] text-[#12100a] border-transparent font-semibold'
            }`}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        )}
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-4 gap-4 mb-10">
        {[
          { value: leidos.length, label: 'Read', color: 'text-[#a8c870]' },
          { value: leyendo.length, label: 'Reading', color: 'text-[#c9a84c]' },
          { value: quieroLeer.length, label: 'Want to Read', color: 'text-[#7ab0d4]' },
          { value: avgRating || '—', label: 'Avg. Rating', color: 'text-[#c9a84c]' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#12100a] border border-[#c9a84c20] rounded-xl p-4 text-center">
            <p className={`text-3xl font-bold ${stat.color}`} style={{fontFamily: 'var(--font-playfair)'}}>
              {stat.value}
            </p>
            <p className="text-[#5a4a30] text-xs mt-1 tracking-wider uppercase">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
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

      {/* Contenido */}
      {activeTab === 'resenas' ? (
        <div className="flex flex-col gap-4">
          {reviews.length === 0 ? (
            <p className="text-[#a89070] italic text-center py-10">This reader hasn't written any reviews yet.</p>
          ) : reviews.map(review => (
            <Link key={review.id} href={`/libro/${review.book_id}`}
              className="bg-[#12100a] border border-[#c9a84c15] hover:border-[#c9a84c40] rounded-xl p-5 flex gap-4 transition">
              {review.book_cover && (
                <img src={review.book_cover} alt={review.book_title} className="w-12 h-18 object-cover rounded shrink-0" />
              )}
              <div className="flex-1">
                <h3 style={{fontFamily: 'var(--font-playfair)'}} className="font-semibold text-[#e8dcc8]">
                  {review.book_title}
                </h3>
                <p className="text-[#a89070] text-xs">{review.book_author}</p>
                <div className="flex gap-0.5 mt-1">
                  {[1,2,3,4,5].map(star => (
                    <span key={star} className={star <= review.rating ? 'text-[#c9a84c]' : 'text-[#2a2010]'}>★</span>
                  ))}
                </div>
                {review.content && (
                  <p className="text-[#a89070] text-sm mt-2 italic">"{review.content}"</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div>
          {activeBooks.length === 0 ? (
            <p className="text-[#a89070] italic text-center py-10">No books in this list.</p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
              {activeBooks.map(book => (
                <Link key={book.id} href={`/libro/${book.book_id}`} className="group flex flex-col gap-2">
                  {book.book_cover ? (
                    <img src={book.book_cover} alt={book.book_title}
                      className="w-full aspect-[2/3] object-cover rounded-lg shadow-lg group-hover:shadow-[#c9a84c20] transition" />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-[#1e1a10] border border-[#c9a84c20] rounded-lg flex items-center justify-center text-[#c9a84c30] text-2xl">
                      📖
                    </div>
                  )}
                  <p className="text-[#a89070] text-xs line-clamp-1 text-center">{book.book_title}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

    </main>
  )
}