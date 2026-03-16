'use client'

import { useState, useEffect } from 'react'

export default function Intro({ children }) {
  const [show, setShow] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    // Si ya se vio la intro en esta sesión, no la mostramos
    const seen = sessionStorage.getItem('intro_seen')
    if (seen) {
      setDone(true)
      return
    }

    setShow(true)

    const timer = setTimeout(() => {
      setShow(false)
      setTimeout(() => {
        sessionStorage.setItem('intro_seen', 'true')
        setDone(true)
      }, 800)
    }, 2800)

    return () => clearTimeout(timer)
  }, [])

  if (done) return <>{children}</>

  return (
    <>
      {/* Pantalla de intro */}
      <div
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0e0c07] transition-opacity duration-700 ${
          show ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Fondo con patrón sutil */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg, transparent, transparent 40px,
              #c9a84c08 40px, #c9a84c08 41px
            ), repeating-linear-gradient(
              90deg, transparent, transparent 40px,
              #c9a84c08 40px, #c9a84c08 41px
            )`
          }}
        />

        {/* Contenido central */}
        <div className={`flex flex-col items-center gap-6 transition-all duration-700 ${
          show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>

          {/* Icono animado */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-[#c9a84c15] animate-ping" />
            <div className="relative w-20 h-20 rounded-full border border-[#c9a84c30] flex items-center justify-center">
              <span className="text-[#c9a84c] text-4xl">✦</span>
            </div>
          </div>

          {/* Nombre */}
          <div className="text-center">
            <h1
              style={{fontFamily: 'var(--font-playfair)', letterSpacing: '0.15em'}}
              className="text-5xl font-bold text-[#e8dcc8]"
            >
              Bookboxd
            </h1>
            <div className="flex items-center justify-center gap-3 mt-3">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#c9a84c50]" />
              <p className="text-[#c9a84c] text-xs tracking-[0.4em] uppercase">
                Your personal library
              </p>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#c9a84c50]" />
            </div>
          </div>

          {/* Cita */}
          <p
            style={{fontFamily: 'var(--font-lora)'}}
            className="text-[#5a4a30] text-sm italic text-center max-w-xs mt-2"
          >
            "A reader lives a thousand lives before he dies"
          </p>

        </div>

        {/* Barra de progreso */}
        <div className="absolute bottom-0 left-0 h-0.5 bg-[#c9a84c] transition-all duration-[2800ms] ease-linear"
          style={{ width: show ? '100%' : '0%' }}
        />
      </div>

      {/* Contenido real que aparece tras la intro */}
      <div className={`transition-opacity duration-500 ${done ? 'opacity-100' : 'opacity-0'}`}>
        {children}
      </div>
    </>
  )
}