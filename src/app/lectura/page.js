'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Lectura() {
  const [user, setUser] = useState(null)
  const [progress, setProgress] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeBook, setActiveBook] = useState(null)
  const [newPages, setNewPages] = useState('')
  const [totalPages, setTotalPages] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      const { data: progressData } = await supabase
        .from('reading_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
      setProgress(progressData || [])

      const { data: logsData } = await supabase
        .from('reading_log')
        .select('*')
        .eq('user_id', user.id)
        .order('log_date', { ascending: false })
        .limit(365)
      setLogs(logsData || [])

      // Cargar libros que está leyendo
      const { data: readingBooks } = await supabase
        .from('booklist')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'reading')

      // Añadir libros leyendo que no tienen progreso aún
      if (readingBooks) {
        for (const book of readingBooks) {
          const existing = progressData?.find(p => p.book_id === book.book_id)
          if (!existing) {
            await supabase.from('reading_progress').upsert({
              user_id: user.id,
              book_id: book.book_id,
              book_title: book.book_title,
              book_cover: book.book_cover,
              current_page: 0,
            }, { onConflict: 'user_id,book_id' })
          }
        }

        const { data: refreshed } = await supabase
          .from('reading_progress')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
        setProgress(refreshed || [])
      }

      setLoading(false)
    }
    loadData()
  }, [])

  async function handleUpdateProgress() {
    if (!activeBook || !newPages) return
    setSaving(true)

    const pages = parseInt(newPages)
    const total = totalPages ? parseInt(totalPages) : activeBook.total_pages

    // Actualizar progreso
    const newCurrentPage = Math.min(
      (activeBook.current_page || 0) + pages,
      total || 99999
    )

    const { error: progressError } = await supabase
      .from('reading_progress')
      .upsert({
        user_id: user.id,
        book_id: activeBook.book_id,
        book_title: activeBook.book_title,
        book_cover: activeBook.book_cover,
        current_page: newCurrentPage,
        total_pages: total || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,book_id' })

    if (progressError) {
      setMessage({ type: 'error', text: 'Error saving progress.' })
      setSaving(false)
      return
    }

    // Registrar en el log del día
    const today = new Date().toISOString().split('T')[0]
    const { data: existingLog } = await supabase
      .from('reading_log')
      .select('*')
      .eq('user_id', user.id)
      .eq('book_id', activeBook.book_id)
      .eq('log_date', today)
      .single()

    if (existingLog) {
      await supabase.from('reading_log')
        .update({ pages_read: existingLog.pages_read + pages })
        .eq('id', existingLog.id)
    } else {
      await supabase.from('reading_log').insert({
        user_id: user.id,
        book_id: activeBook.book_id,
        book_title: activeBook.book_title,
        pages_read: pages,
        log_date: today,
      })
    }

    // Recargar datos
    const { data: refreshed } = await supabase
      .from('reading_progress')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
    setProgress(refreshed || [])

    const { data: refreshedLogs } = await supabase
      .from('reading_log')
      .select('*')
      .eq('user_id', user.id)
      .order('log_date', { ascending: false })
      .limit(365)
    setLogs(refreshedLogs || [])

    setActiveBook(refreshed?.find(p => p.book_id === activeBook.book_id) || null)
    setNewPages('')
    setMessage({ type: 'success', text: `+${pages} pages logged!` })
    setTimeout(() => setMessage(null), 2000)
    setSaving(false)
  }

  // Calcular calendario (últimos 365 días)
  function getCalendarData() {
    const today = new Date()
    const days = []

    for (let i = 364; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const log = logs.filter(l => l.log_date === dateStr)
      const pages = log.reduce((acc, l) => acc + l.pages_read, 0)
      days.push({ date: dateStr, pages })
    }

    return days
  }

  function getIntensity(pages) {
    if (pages === 0) return 'bg-[#1a1408] border border-[#2a2010]'
    if (pages < 20) return 'bg-[#4a6a20]'
    if (pages < 50) return 'bg-[#6a9a30]'
    if (pages < 100) return 'bg-[#a8c870]'
    return 'bg-[#c9a84c]'
  }

  // Calcular racha
  function getStreak() {
    const today = new Date().toISOString().split('T')[0]
    const logDates = [...new Set(logs.map(l => l.log_date))].sort((a, b) => b.localeCompare(a))
    let streak = 0
    let current = today

    for (const date of logDates) {
      if (date === current) {
        streak++
        const d = new Date(current)
        d.setDate(d.getDate() - 1)
        current = d.toISOString().split('T')[0]
      } else break
    }
    return streak
  }

  // Páginas totales leídas
  const totalPagesRead = logs.reduce((acc, l) => acc + l.pages_read, 0)
  const todayPages = logs
    .filter(l => l.log_date === new Date().toISOString().split('T')[0])
    .reduce((acc, l) => acc + l.pages_read, 0)
  const streak = getStreak()
  const calendarDays = getCalendarData()

  // Agrupar calendario en semanas
  const weeks = []
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7))
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
    <main className="max-w-4xl mx-auto px-6 py-12">

      {/* Cabecera */}
      <div className="text-center mb-12">
        <p className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-3">Your reading</p>
        <h1 style={{fontFamily: 'var(--font-playfair)'}} className="text-4xl font-bold text-[#e8dcc8]">
          Reading Tracker
        </h1>
        <div className="flex items-center justify-center gap-4 mt-4">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#c9a84c40]" />
          <span className="text-[#c9a84c40]">✦</span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#c9a84c40]" />
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { value: streak, label: 'Day streak', color: 'text-[#c9a84c]', icon: '🔥' },
          { value: todayPages, label: 'Pages today', color: 'text-[#a8c870]', icon: '📖' },
          { value: totalPagesRead, label: 'Total pages', color: 'text-[#7ab0d4]', icon: '✦' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#12100a] border border-[#c9a84c20] rounded-xl p-5 text-center">
            <p className="text-2xl mb-1">{stat.icon}</p>
            <p style={{fontFamily: 'var(--font-playfair)'}} className={`text-3xl font-bold ${stat.color}`}>
              {stat.value}
            </p>
            <p className="text-[#5a4a30] text-xs mt-1 tracking-wider uppercase">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Libros en progreso */}
      <section className="mb-10">
        <div className="flex items-center gap-4 mb-6">
          <h2 style={{fontFamily: 'var(--font-playfair)'}} className="text-2xl font-bold text-[#e8dcc8]">
            Currently reading
          </h2>
          <div className="h-px flex-1 bg-[#c9a84c20]" />
        </div>

        {progress.length === 0 ? (
          <div className="text-center py-10 border border-[#c9a84c20] rounded-xl">
            <p className="text-[#a89070] italic mb-4">No books in progress.</p>
            <Link href="/buscar" className="text-[#c9a84c] hover:text-[#d4b86a] transition text-sm">
              Find a book to read →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {progress.map(book => {
              const pct = book.total_pages
                ? Math.min(Math.round((book.current_page / book.total_pages) * 100), 100)
                : null
              const isActive = activeBook?.book_id === book.book_id

              return (
                <div key={book.book_id}
                  className={`bg-[#12100a] border rounded-xl p-5 transition cursor-pointer ${
                    isActive ? 'border-[#c9a84c]' : 'border-[#c9a84c15] hover:border-[#c9a84c30]'
                  }`}
                  onClick={() => {
                    setActiveBook(isActive ? null : book)
                    setNewPages('')
                    setTotalPages('')
                  }}
                >
                  <div className="flex gap-4 items-center">
                    {book.book_cover ? (
                      <img src={book.book_cover} alt={book.book_title}
                        className="w-12 h-16 object-cover rounded shadow-lg shrink-0" />
                    ) : (
                      <div className="w-12 h-16 bg-[#1e1a10] border border-[#c9a84c20] rounded shrink-0 flex items-center justify-center text-[#c9a84c30]">
                        📖
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 style={{fontFamily: 'var(--font-playfair)'}}
                        className="font-semibold text-[#e8dcc8] text-sm line-clamp-1">
                        {book.book_title}
                      </h3>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[#a89070] text-xs">
                          Page <span className="text-[#c9a84c] font-semibold">{book.current_page}</span>
                          {book.total_pages && <span className="text-[#5a4a30]"> / {book.total_pages}</span>}
                        </span>
                        {pct !== null && (
                          <span className="text-[#a8c870] text-xs font-semibold">{pct}%</span>
                        )}
                      </div>

                      {book.total_pages && (
                        <div className="mt-2 h-1.5 bg-[#2a2010] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#c9a84c] rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                    </div>

                    <span className={`text-[#c9a84c] transition-transform duration-200 shrink-0 ${isActive ? 'rotate-180' : ''}`}>
                      ▾
                    </span>
                  </div>

                  {/* Panel de actualización */}
                  {isActive && (
                    <div className="mt-5 pt-5 border-t border-[#c9a84c20]"
                      onClick={e => e.stopPropagation()}>

                      {message && (
                        <div className={`mb-4 px-4 py-2 rounded text-sm border ${
                          message.type === 'success'
                            ? 'bg-[#1a2010] border-[#4a6a20] text-[#a8c870]'
                            : 'bg-[#201008] border-[#6a2010] text-[#c87040]'
                        }`}>
                          {message.text}
                        </div>
                      )}

                      <div className="flex gap-3 flex-wrap">
                        <div className="flex-1 min-w-[120px]">
                          <label className="text-[#a89070] text-xs tracking-wider uppercase mb-2 block">
                            Pages read today
                          </label>
                          <input
                            type="number"
                            value={newPages}
                            onChange={e => setNewPages(e.target.value)}
                            placeholder="e.g. 30"
                            min="1"
                            className="w-full bg-[#1e1a10] border border-[#c9a84c20] focus:border-[#c9a84c] rounded px-4 py-2.5 text-[#e8dcc8] placeholder-[#3a2a10] outline-none transition"
                            style={{fontFamily: 'var(--font-lora)'}}
                          />
                        </div>

                        {!book.total_pages && (
                          <div className="flex-1 min-w-[120px]">
                            <label className="text-[#a89070] text-xs tracking-wider uppercase mb-2 block">
                              Total pages
                            </label>
                            <input
                              type="number"
                              value={totalPages}
                              onChange={e => setTotalPages(e.target.value)}
                              placeholder="e.g. 320"
                              min="1"
                              className="w-full bg-[#1e1a10] border border-[#c9a84c20] focus:border-[#c9a84c] rounded px-4 py-2.5 text-[#e8dcc8] placeholder-[#3a2a10] outline-none transition"
                              style={{fontFamily: 'var(--font-lora)'}}
                            />
                          </div>
                        )}

                        <div className="flex items-end">
                          <button
                            onClick={handleUpdateProgress}
                            disabled={saving || !newPages}
                            className="bg-[#c9a84c] hover:bg-[#d4b86a] disabled:bg-[#5a4a20] text-[#12100a] font-semibold px-6 py-2.5 rounded transition tracking-wider text-sm"
                          >
                            {saving ? '...' : 'Log pages'}
                          </button>
                        </div>
                      </div>

                      {/* Historial del libro */}
                      {(() => {
                        const bookLogs = logs
                          .filter(l => l.book_id === book.book_id)
                          .slice(0, 5)
                        if (bookLogs.length === 0) return null
                        return (
                          <div className="mt-4">
                            <p className="text-[#5a4a30] text-xs tracking-wider uppercase mb-2">Recent sessions</p>
                            <div className="flex flex-col gap-1">
                              {bookLogs.map(log => (
                                <div key={log.id} className="flex items-center justify-between">
                                  <span className="text-[#5a4a30] text-xs">
                                    {new Date(log.log_date).toLocaleDateString('en-US', {
                                      month: 'short', day: 'numeric'
                                    })}
                                  </span>
                                  <span className="text-[#a8c870] text-xs font-semibold">
                                    +{log.pages_read} pages
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Calendario de actividad */}
      <section>
        <div className="flex items-center gap-4 mb-6">
          <h2 style={{fontFamily: 'var(--font-playfair)'}} className="text-2xl font-bold text-[#e8dcc8]">
            Reading calendar
          </h2>
          <div className="h-px flex-1 bg-[#c9a84c20]" />
        </div>

        <div className="bg-[#12100a] border border-[#c9a84c20] rounded-xl p-6">

          {/* Meses */}
          <div className="flex gap-1 mb-2 overflow-x-auto">
            {weeks.map((week, wi) => {
              const firstDay = week[0]?.date
              if (!firstDay) return null
              const date = new Date(firstDay)
              const isFirstOfMonth = date.getDate() <= 7
              return (
                <div key={wi} className="flex-1 min-w-[12px] text-center">
                  {isFirstOfMonth && (
                    <span className="text-[#5a4a30] text-xs">
                      {date.toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Grid */}
          <div className="flex gap-1 overflow-x-auto">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1 flex-1 min-w-[12px]">
                {week.map((day, di) => (
                  <div
                    key={di}
                    title={`${day.date}: ${day.pages} pages`}
                    className={`w-full aspect-square rounded-sm ${getIntensity(day.pages)}`}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Leyenda */}
          <div className="flex items-center gap-2 mt-4 justify-end">
            <span className="text-[#5a4a30] text-xs">Less</span>
            {['bg-[#1a1408] border border-[#2a2010]', 'bg-[#4a6a20]', 'bg-[#6a9a30]', 'bg-[#a8c870]', 'bg-[#c9a84c]'].map((cls, i) => (
              <div key={i} className={`w-3 h-3 rounded-sm ${cls}`} />
            ))}
            <span className="text-[#5a4a30] text-xs">More</span>
          </div>
        </div>
      </section>

    </main>
  )
}