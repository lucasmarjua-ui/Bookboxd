'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Estadisticas() {
  const [booklist, setBooklist] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: booklistData } = await supabase
        .from('booklist').select('*').eq('user_id', user.id)
      setBooklist(booklistData || [])

      const { data: reviewsData } = await supabase
        .from('reviews').select('*').eq('user_id', user.id)
      setReviews(reviewsData || [])

      setLoading(false)
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="text-center">
          <span className="text-[#c9a84c] text-4xl">✦</span>
          <p className="text-[#a89070] mt-4">Loading statistics...</p>
        </div>
      </main>
    )
  }

  const leidos = booklist.filter(b => b.status === 'read')
  const leyendo = booklist.filter(b => b.status === 'reading')
  const pendientes = booklist.filter(b => b.status === 'want_to_read')

  // Libros leídos por mes (últimos 12 meses)
  const now = new Date()
  const meses = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
    return {
      label: d.toLocaleDateString('es-ES', { month: 'short' }),
      year: d.getFullYear(),
      month: d.getMonth(),
      count: 0,
    }
  })

  leidos.forEach(book => {
    const date = new Date(book.created_at)
    const mes = meses.find(m => m.year === date.getFullYear() && m.month === date.getMonth())
    if (mes) mes.count++
  })

  const maxCount = Math.max(...meses.map(m => m.count), 1)

  // Distribución de puntuaciones
  const ratingDist = [1, 2, 3, 4, 5].map(r => ({
    rating: r,
    count: reviews.filter(rev => rev.rating === r).length,
    label: ['', 'Pésimo', 'Regular', 'Bien', 'Muy bien', 'Obra maestra'][r],
  }))
  const maxRating = Math.max(...ratingDist.map(r => r.count), 1)

  // Media de puntuación
  const avgRating = reviews.length
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : null

  // Racha actual (días consecutivos con actividad)
  const streak = (() => {
    if (leidos.length === 0) return 0
    const dates = leidos
      .map(b => new Date(b.created_at).toDateString())
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => new Date(b) - new Date(a))

    let count = 0
    let current = new Date()
    current.setHours(0, 0, 0, 0)

    for (const dateStr of dates) {
      const date = new Date(dateStr)
      const diff = Math.round((current - date) / (1000 * 60 * 60 * 24))
      if (diff <= 1) { count++; current = date }
      else break
    }
    return count
  })()

  return (
    <main className="max-w-4xl mx-auto px-6 py-12">

      {/* Cabecera */}
      <div className="text-center mb-12">
        <p className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-3">Your progress</p>
        <h1 style={{fontFamily: 'var(--font-playfair)'}} className="text-4xl font-bold text-[#e8dcc8]">
          Statistics
        </h1>
        <div className="flex items-center justify-center gap-4 mt-4">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#c9a84c40]" />
          <span className="text-[#c9a84c40]">✦</span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#c9a84c40]" />
        </div>
      </div>

      {booklist.length === 0 ? (
        <div className="text-center py-20 border border-[#c9a84c20] rounded-xl">
          <p className="text-[#a89070] italic mb-4">You haven't added any books yet.</p>
          <Link href="/buscar" className="bg-[#c9a84c] hover:bg-[#d4b86a] text-[#12100a] font-semibold px-6 py-2.5 rounded transition tracking-wider text-sm">
            Explore books
          </Link>
        </div>
      ) : (
        <>

          {/* Resumen general */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            {[
              { value: leidos.length, label: 'Reads', color: 'text-[#a8c870]' },
              { value: leyendo.length, label: 'Reading', color: 'text-[#c9a84c]' },
              { value: pendientes.length, label: 'To Read', color: 'text-[#7ab0d4]' },
              { value: avgRating || '—', label: 'Avg. Rating', color: 'text-[#c9a84c]' },
            ].map((stat, i) => (
              <div key={i} className="bg-[#12100a] border border-[#c9a84c20] rounded-xl p-5 text-center">
                <p className={`text-4xl font-bold ${stat.color}`} style={{fontFamily: 'var(--font-playfair)'}}>
                  {stat.value}
                </p>
                <p className="text-[#5a4a30] text-xs mt-2 tracking-wider uppercase">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Gráfico de libros por mes */}
          <div className="bg-[#12100a] border border-[#c9a84c20] rounded-xl p-7 mb-6">
            <h2 style={{fontFamily: 'var(--font-playfair)'}} className="text-xl font-bold text-[#e8dcc8] mb-6">
              Books read per month
            </h2>
            <div className="flex items-end gap-2 h-36">
              {meses.map((mes, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[#a89070] text-xs">{mes.count > 0 ? mes.count : ''}</span>
                  <div className="w-full rounded-t transition-all duration-500"
                    style={{
                      height: `${(mes.count / maxCount) * 100}%`,
                      minHeight: mes.count > 0 ? '4px' : '2px',
                      backgroundColor: mes.count > 0 ? '#c9a84c' : '#2a2010',
                    }}
                  />
                  <span className="text-[#5a4a30] text-xs">{mes.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Distribución de puntuaciones */}
          {reviews.length > 0 && (
            <div className="bg-[#12100a] border border-[#c9a84c20] rounded-xl p-7 mb-6">
              <h2 style={{fontFamily: 'var(--font-playfair)'}} className="text-xl font-bold text-[#e8dcc8] mb-6">
                Rating distribution
              </h2>
              <div className="flex flex-col gap-3">
                {ratingDist.reverse().map(r => (
                  <div key={r.rating} className="flex items-center gap-3">
                    <div className="flex gap-0.5 w-24 shrink-0 justify-end">
                      {[1,2,3,4,5].map(star => (
                        <span key={star} className={star <= r.rating ? 'text-[#c9a84c] text-sm' : 'text-[#2a2010] text-sm'}>★</span>
                      ))}
                    </div>
                    <div className="flex-1 h-5 bg-[#1e1a10] rounded overflow-hidden">
                      <div
                        className="h-full bg-[#c9a84c] rounded transition-all duration-500"
                        style={{ width: `${(r.count / maxRating) * 100}%` }}
                      />
                    </div>
                    <span className="text-[#a89070] text-sm w-6 text-right">{r.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Datos curiosos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#12100a] border border-[#c9a84c20] rounded-xl p-5 text-center">
              <p style={{fontFamily: 'var(--font-playfair)'}} className="text-3xl font-bold text-[#c9a84c]">
                {streak}
              </p>
              <p className="text-[#5a4a30] text-xs mt-2 tracking-wider uppercase">Day streak</p>
            </div>
            <div className="bg-[#12100a] border border-[#c9a84c20] rounded-xl p-5 text-center">
              <p style={{fontFamily: 'var(--font-playfair)'}} className="text-3xl font-bold text-[#a8c870]">
                {reviews.length}
              </p>
              <p className="text-[#5a4a30] text-xs mt-2 tracking-wider uppercase">Reviews written</p>
            </div>
            <div className="bg-[#12100a] border border-[#c9a84c20] rounded-xl p-5 text-center">
              <p style={{fontFamily: 'var(--font-playfair)'}} className="text-3xl font-bold text-[#7ab0d4]">
                {leidos.length > 0 ? Math.round(leidos.length / Math.max(1, Math.ceil((new Date() - new Date(leidos[leidos.length - 1]?.created_at)) / (1000 * 60 * 60 * 24 * 30)))) : 0}
              </p>
              <p className="text-[#5a4a30] text-xs mt-2 tracking-wider uppercase">Books per month</p>
            </div>
          </div>

        </>
      )}

    </main>
  )
}
<div className="flex justify-end mb-2">
  <Link href="/estadisticas" className="text-[#c9a84c] hover:text-[#d4b86a] text-xs tracking-wider transition">
    View full stats →
  </Link>
</div>