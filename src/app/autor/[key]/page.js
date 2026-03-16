'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const SORT_OPTIONS = [
  { value: 'popular', label: 'Most popular' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'newest', label: 'Newest first' },
]

export default function Autor() {
  const { key } = useParams()
  const [autor, setAutor] = useState(null)
  const [libros, setLibros] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('popular')
  const [onlyWithCover, setOnlyWithCover] = useState(true)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    async function loadAutor() {
      const res = await fetch(`https://openlibrary.org/authors/${key}.json`)
      const data = await res.json()

      setAutor({
        name: data.name,
        bio: typeof data.bio === 'string' ? data.bio : data.bio?.value || '',
        birthDate: data.birth_date || null,
        deathDate: data.death_date || null,
        photo: data.photos?.[0]
          ? `https://covers.openlibrary.org/a/id/${data.photos[0]}-L.jpg`
          : null,
      })

      const librosRes = await fetch(`https://openlibrary.org/authors/${key}/works.json?limit=50`)
      const librosData = await librosRes.json()

      const seen = new Set()
      const librosFormateados = (librosData.entries || [])
        .map((libro, index) => {
          // Extraer año de primera publicación
          let year = null
          if (libro.first_publish_date) {
            const match = libro.first_publish_date.match(/\d{4}/)
            if (match) year = parseInt(match[0])
          }
          if (!year && libro.created?.value) {
            const match = libro.created.value.match(/\d{4}/)
            if (match) year = parseInt(match[0])
          }

          return {
            id: libro.key.replace('/works/', ''),
            title: libro.title,
            cover: libro.covers?.[0] && libro.covers[0] > 0
              ? `https://covers.openlibrary.org/b/id/${libro.covers[0]}-M.jpg`
              : null,
            year,
            // Usamos el índice inverso como proxy de popularidad (la API devuelve obras más conocidas primero)
            popularity: -index,
          }
        })
        .filter(libro => {
          if (!libro.title || libro.title.length > 80) return false
          const normalized = libro.title.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .split(' ').slice(0, 4).join(' ')
          if (seen.has(normalized)) return false
          seen.add(normalized)
          return true
        })

      setLibros(librosFormateados)
      setLoading(false)
    }
    loadAutor()
  }, [key])

  useEffect(() => {
    let result = [...libros]

    if (onlyWithCover) {
      result = result.filter(l => l.cover)
    }

    if (sortBy === 'oldest') {
      result.sort((a, b) => (a.year || 9999) - (b.year || 9999))
    } else if (sortBy === 'newest') {
      result.sort((a, b) => (b.year || 0) - (a.year || 0))
    } else {
      // Popular: orden original de la API
      result.sort((a, b) => b.popularity - a.popularity)
    }

    setFiltered(result)
  }, [libros, sortBy, onlyWithCover])

  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="text-center">
          <span className="text-[#c9a84c] text-4xl">✦</span>
          <p className="text-[#a89070] mt-4">Loading author...</p>
        </div>
      </main>
    )
  }

  const currentSort = SORT_OPTIONS.find(o => o.value === sortBy)

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">

      {/* Cabecera del autor */}
      <div className="flex gap-10 mb-12">
        <div className="shrink-0">
          {autor.photo ? (
            <img src={autor.photo} alt={autor.name}
              className="w-36 h-44 object-cover rounded-lg shadow-2xl shadow-black/50" />
          ) : (
            <div className="w-36 h-44 bg-[#1e1a10] border border-[#c9a84c20] rounded-lg flex items-center justify-center text-[#c9a84c30] text-5xl">
              ✍️
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center">
          <p className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-2">Author</p>
          <h1 style={{fontFamily: 'var(--font-playfair)'}}
            className="text-4xl font-bold text-[#e8dcc8] mb-3 leading-tight">
            {autor.name}
          </h1>
          {(autor.birthDate || autor.deathDate) && (
            <p className="text-[#5a4a30] text-sm mb-4">
              {autor.birthDate}{autor.birthDate && autor.deathDate && ' — '}{autor.deathDate}
            </p>
          )}
          {autor.bio && (
            <p className="text-[#a89070] text-sm leading-relaxed line-clamp-4 italic max-w-xl">
              {autor.bio}
            </p>
          )}
        </div>
      </div>

      <div className="h-px bg-[#c9a84c20] mb-8" />

      {/* Controles */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <h2 style={{fontFamily: 'var(--font-playfair)'}} className="text-2xl font-bold text-[#e8dcc8]">
            Works
          </h2>
          <span className="text-[#5a4a30] text-sm">{filtered.length} books</span>
        </div>

        <div className="flex items-center gap-3">

          {/* Toggle portada */}
          <button
            onClick={() => setOnlyWithCover(!onlyWithCover)}
            className={`flex items-center gap-2 text-xs px-4 py-2.5 rounded-lg border transition ${
              onlyWithCover
                ? 'bg-[#c9a84c] border-[#c9a84c] text-[#12100a] font-semibold'
                : 'bg-[#12100a] border-[#c9a84c30] text-[#a89070] hover:border-[#c9a84c] hover:text-[#e8dcc8]'
            }`}
          >
            <span>{onlyWithCover ? '✓' : '○'}</span>
            <span>With cover</span>
          </button>

          {/* Dropdown personalizado */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 bg-[#12100a] border border-[#c9a84c30] hover:border-[#c9a84c] text-[#e8dcc8] text-xs px-4 py-2.5 rounded-lg transition min-w-[150px] justify-between"
            >
              <span className="text-[#c9a84c]">↕</span>
              <span>{currentSort?.label}</span>
              <span className={`text-[#c9a84c] transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}>
                ▾
              </span>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a1408] border border-[#c9a84c30] rounded-lg overflow-hidden shadow-xl z-10">
                {SORT_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => { setSortBy(option.value); setDropdownOpen(false) }}
                    className={`w-full text-left px-4 py-3 text-xs transition flex items-center justify-between ${
                      sortBy === option.value
                        ? 'bg-[#c9a84c15] text-[#c9a84c]'
                        : 'text-[#a89070] hover:bg-[#c9a84c10] hover:text-[#e8dcc8]'
                    }`}
                  >
                    <span>{option.label}</span>
                    {sortBy === option.value && <span className="text-[#c9a84c]">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-[#c9a84c20] rounded-xl">
          <p className="text-[#a89070] italic mb-3">No works found with the current filters.</p>
          <button onClick={() => setOnlyWithCover(false)}
            className="text-[#c9a84c] hover:text-[#d4b86a] text-sm transition">
            Show all works →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-5">
          {filtered.map(libro => (
            <Link key={libro.id} href={`/libro/${libro.id}`} className="group flex flex-col gap-2">
              <div className="aspect-[2/3] bg-[#1e1a10] border border-[#c9a84c15] rounded-lg overflow-hidden">
                {libro.cover ? (
                  <img src={libro.cover} alt={libro.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-2">
                    <span className="text-[#c9a84c20] text-2xl">📖</span>
                    <span className="text-[#3a3020] text-xs text-center line-clamp-3 leading-tight">
                      {libro.title}
                    </span>
                  </div>
                )}
              </div>
              <p style={{fontFamily: 'var(--font-playfair)'}}
                className="text-[#a89070] text-xs line-clamp-2 group-hover:text-[#c9a84c] transition text-center leading-tight">
                {libro.title}
              </p>
              {libro.year && (
                <p className="text-[#3a3020] text-xs text-center">{libro.year}</p>
              )}
            </Link>
          ))}
        </div>
      )}

    </main>
  )
}