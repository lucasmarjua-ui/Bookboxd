'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function Usuarios() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [following, setFollowing] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      if (user) {
        const { data } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id)
        setFollowing((data || []).map(f => f.following_id))
      }
    }
    loadUser()
  }, [])

  async function handleSearch() {
    if (!query.trim()) return
    setLoading(true)

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${query}%`)
      .neq('id', currentUser?.id || '')
      .limit(10)

    setResults(data || [])
    setLoading(false)
  }

  async function toggleFollow(userId) {
    if (!currentUser) return

    const isFollowing = following.includes(userId)

    if (isFollowing) {
      await supabase.from('follows').delete()
        .eq('follower_id', currentUser.id)
        .eq('following_id', userId)
      setFollowing(prev => prev.filter(id => id !== userId))
    } else {
      await supabase.from('follows').insert({
        follower_id: currentUser.id,
        following_id: userId,
      })
      setFollowing(prev => [...prev, userId])
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">

      {/* Cabecera */}
      <div className="text-center mb-10">
        <p className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-3">Community</p>
        <h1 style={{fontFamily: 'var(--font-playfair)'}} className="text-4xl font-bold text-[#e8dcc8]">
          Find readers
        </h1>
        <div className="flex items-center justify-center gap-4 mt-4">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#c9a84c40]" />
          <span className="text-[#c9a84c40]">✦</span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#c9a84c40]" />
        </div>
      </div>

      {/* Buscador */}
      <div className="flex gap-3 mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search by username..."
          className="flex-1 bg-[#12100a] border border-[#c9a84c30] focus:border-[#c9a84c] rounded px-5 py-3 text-[#e8dcc8] placeholder-[#5a4a30] outline-none transition"
          style={{fontFamily: 'var(--font-lora)'}}
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-[#c9a84c] hover:bg-[#d4b86a] disabled:bg-[#5a4a20] text-[#12100a] font-semibold px-8 py-3 rounded transition tracking-wider text-sm"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Resultados */}
      <div className="flex flex-col gap-3">
        {results.length === 0 && query && !loading && (
          <p className="text-[#a89070] italic text-center py-8">No readers found with that username.</p>
        )}

        {results.map(profile => (
          <div key={profile.id}
            className="bg-[#12100a] border border-[#c9a84c15] hover:border-[#c9a84c30] rounded-xl p-5 flex items-center justify-between transition">

            <Link href={`/lector/${profile.id}`} className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-full bg-[#2a2010] border border-[#c9a84c30] flex items-center justify-center text-[#c9a84c] font-bold text-lg shrink-0"
                style={{fontFamily: 'var(--font-playfair)'}}>
                {profile.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <p style={{fontFamily: 'var(--font-playfair)'}}
                  className="font-semibold text-[#e8dcc8] group-hover:text-[#c9a84c] transition">
                  {profile.username}
                </p>
                {profile.bio && (
                  <p className="text-[#5a4a30] text-xs italic mt-0.5 line-clamp-1">"{profile.bio}"</p>
                )}
              </div>
            </Link>

            {currentUser && (
              <button
                onClick={() => toggleFollow(profile.id)}
                className={`text-sm px-5 py-2 rounded transition tracking-wider border ${
                  following.includes(profile.id)
                    ? 'border-[#c9a84c50] text-[#c9a84c] hover:border-red-800 hover:text-red-400'
                    : 'bg-[#c9a84c] hover:bg-[#d4b86a] text-[#12100a] border-transparent font-semibold'
                }`}
              >
                {following.includes(profile.id) ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
        ))}
      </div>

    </main>
  )
}