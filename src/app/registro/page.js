'use client'

import { useState } from 'react'
import { signUp } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Registro() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await signUp(email, password, username)
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/perfil')
  }

  return (
    <main className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <span className="text-[#c9a84c] text-3xl">✦</span>
          <h1 style={{fontFamily: 'var(--font-playfair)'}} className="text-3xl font-bold text-[#e8dcc8] mt-3">
            Create your library
          </h1>
          <p className="text-[#a89070] text-sm mt-2">Join the reading community</p>
        </div>

        <div className="bg-[#12100a] border border-[#c9a84c20] rounded-xl p-8">
          <div className="flex flex-col gap-5">

            <div>
              <label className="text-[#a89070] text-xs tracking-wider uppercase mb-2 block">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. classic_reader"
                className="w-full bg-[#1e1a10] border border-[#c9a84c20] focus:border-[#c9a84c] rounded px-4 py-3 text-[#e8dcc8] placeholder-[#3a2a10] outline-none transition"
                style={{fontFamily: 'var(--font-lora)'}}
              />
            </div>

            <div>
              <label className="text-[#a89070] text-xs tracking-wider uppercase mb-2 block">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full bg-[#1e1a10] border border-[#c9a84c20] focus:border-[#c9a84c] rounded px-4 py-3 text-[#e8dcc8] placeholder-[#3a2a10] outline-none transition"
                style={{fontFamily: 'var(--font-lora)'}}
              />
            </div>

            <div>
              <label className="text-[#a89070] text-xs tracking-wider uppercase mb-2 block">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full bg-[#1e1a10] border border-[#c9a84c20] focus:border-[#c9a84c] rounded px-4 py-3 text-[#e8dcc8] placeholder-[#3a2a10] outline-none transition"
                style={{fontFamily: 'var(--font-lora)'}}
              />
            </div>

            {error && (
              <p className="text-[#c87040] text-sm bg-[#201008] border border-[#6a2010] rounded px-4 py-3">
                {error}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-[#c9a84c] hover:bg-[#d4b86a] disabled:bg-[#5a4a20] text-[#12100a] font-semibold py-3 rounded transition tracking-wider text-sm mt-1"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>

          <p className="text-[#5a4a30] text-sm text-center mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-[#c9a84c] hover:text-[#d4b86a] transition">
              Sign in
            </Link>
          </p>
        </div>

      </div>
    </main>
  )
}