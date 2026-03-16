'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function EditarPerfil() {
  const [user, setUser] = useState(null)
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const router = useRouter()

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      const { data: profile } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()

      if (profile) {
        setUsername(profile.username || '')
        setBio(profile.bio || '')
      }

      setLoading(false)
    }
    loadProfile()
  }, [])

  async function handleSave() {
    if (!username.trim()) {
      setMessage({ type: 'error', text: 'Username cannot be empty.' })
      return
    }

    setSaving(true)
    setMessage(null)

    const { error } = await supabase
      .from('profiles')
      .update({ username: username.trim(), bio: bio.trim() })
      .eq('id', user.id)

    if (error) {
      if (error.code === '23505') {
        setMessage({ type: 'error', text: 'That username is already taken.' })
      } else {
        setMessage({ type: 'error', text: 'Error saving changes.' })
      }
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully.' })
      setTimeout(() => router.push('/perfil'), 1500)
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="text-center">
          <span className="text-[#c9a84c] text-4xl">✦</span>
          <p className="text-[#a89070] mt-4">Loading...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <span className="text-[#c9a84c] text-3xl">✦</span>
          <h1 style={{fontFamily: 'var(--font-playfair)'}} className="text-3xl font-bold text-[#e8dcc8] mt-3">
            Edit profile
          </h1>
          <p className="text-[#a89070] text-sm mt-2">Customize your library</p>
        </div>

        <div className="bg-[#12100a] border border-[#c9a84c20] rounded-xl p-8">

          {/* Avatar */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-full bg-[#2a2010] border-2 border-[#c9a84c40] flex items-center justify-center text-[#c9a84c] text-3xl font-bold"
              style={{fontFamily: 'var(--font-playfair)'}}>
              {username?.[0]?.toUpperCase()}
            </div>
          </div>

          <div className="flex flex-col gap-5">

            <div>
              <label className="text-[#a89070] text-xs tracking-wider uppercase mb-2 block">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your username"
                maxLength={30}
                className="w-full bg-[#1e1a10] border border-[#c9a84c20] focus:border-[#c9a84c] rounded px-4 py-3 text-[#e8dcc8] placeholder-[#3a2a10] outline-none transition"
                style={{fontFamily: 'var(--font-lora)'}}
              />
              <p className="text-[#3a3020] text-xs mt-1 text-right">{username.length}/30</p>
            </div>

            <div>
              <label className="text-[#a89070] text-xs tracking-wider uppercase mb-2 block">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us something about you as a reader..."
                rows={4}
                maxLength={160}
                className="w-full bg-[#1e1a10] border border-[#c9a84c20] focus:border-[#c9a84c] rounded px-4 py-3 text-[#e8dcc8] placeholder-[#3a2a10] outline-none transition resize-none"
                style={{fontFamily: 'var(--font-lora)'}}
              />
              <p className="text-[#3a3020] text-xs mt-1 text-right">{bio.length}/160</p>
            </div>

            {message && (
              <div className={`px-4 py-3 rounded text-sm border ${
                message.type === 'success'
                  ? 'bg-[#1a2010] border-[#4a6a20] text-[#a8c870]'
                  : 'bg-[#201008] border-[#6a2010] text-[#c87040]'
              }`}>
                {message.text}
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#c9a84c] hover:bg-[#d4b86a] disabled:bg-[#5a4a20] text-[#12100a] font-semibold py-3 rounded transition tracking-wider text-sm mt-1"
            >
              {saving ? '' : 'Save changes'}
            </button>

            <Link href="/perfil"
              className="text-center text-[#5a4a30] hover:text-[#a89070] text-sm transition">
              Cancel
            </Link>

          </div>
        </div>
      </div>
    </main>
  )
}