'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const INSTAGRAM_URL = 'https://www.instagram.com/pielcanela.coffee/'

const IMAGES = [
  'https://eobgaersvyjrbvykqqug.supabase.co/storage/v1/object/public/About/1.webp',
  'https://eobgaersvyjrbvykqqug.supabase.co/storage/v1/object/public/About/2.webp',
  'https://eobgaersvyjrbvykqqug.supabase.co/storage/v1/object/public/About/3.webp',
  'https://eobgaersvyjrbvykqqug.supabase.co/storage/v1/object/public/About/4.webp',
  'https://eobgaersvyjrbvykqqug.supabase.co/storage/v1/object/public/About/5.webp',
]

const pillClass =
  'border border-[#3B1F0F] text-[#3B1F0F] font-menu font-bold text-[11px] tracking-[0.14em] uppercase px-6 py-2.5 rounded-full hover:bg-[#3B1F0F] hover:text-white transition-colors duration-200'

const STAGGER_DELAYS = ['0s', '0.1s', '0.2s', '0.3s', '0.4s']

export default function SocialsSection() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)

  const update = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setCanScrollLeft(el.scrollLeft > 1)
    setCanScrollRight(el.scrollLeft < max - 1)
    setProgress(max > 0 ? el.scrollLeft / max : 0)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [update])

  // IntersectionObserver: trigger zoom-out animation when section enters viewport
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const scrollByCard = (dir: 1 | -1) => {
    const el = scrollRef.current
    if (!el) return
    // one card = container / 3.5 + gap
    const cardWidth = el.clientWidth / 3.5 + 16
    el.scrollBy({ left: dir * cardWidth, behavior: 'smooth' })
  }

  return (
    <section ref={sectionRef} className="bg-white py-6">
      <div
        className="content-inset-margin"
        style={{
          backgroundColor: '#FFE8E6',
          borderRadius: 'var(--content-radius)',
          padding: '2rem',
        }}
      >
        {/* Header: heading left, desktop CTA right */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-menu font-bold text-2xl md:text-3xl text-[#3B1F0F]">
            YOU + US
          </h2>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`hidden md:inline-block ${pillClass}`}
          >
            Find us on social
          </a>
        </div>

        {/* Carousel — negative right margin cancels parent padding so images reach the card edge */}
        <div className="overflow-hidden" style={{ borderRadius: 'var(--content-radius)', marginRight: '-2rem' }}>
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              scrollSnapType: 'x mandatory',
              paddingRight: '1.5rem',
            }}
          >
            {IMAGES.map((src, i) => (
              <div
                key={i}
                className="socials-card"
                style={{
                  borderRadius: 'var(--content-radius)',
                  overflow: 'hidden',
                  scrollSnapAlign: 'start',
                }}
              >
                <img
                  src={src}
                  alt={`Piel Canela community photo ${i + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    transform: visible ? 'scale(1)' : 'scale(1.08)',
                    transition: 'transform 0.7s ease-out',
                    transitionDelay: STAGGER_DELAYS[i] ?? '0s',
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Progress bar + arrow buttons row */}
        <div className="mt-4 flex items-center gap-3">
          {/* Progress bar */}
          <div
            className="flex-1 rounded-full overflow-hidden"
            style={{ height: '3px', backgroundColor: 'rgba(59,31,15,0.2)' }}
          >
            <div
              className="h-full rounded-full transition-[width] duration-150 ease-out"
              style={{ width: `${progress * 100}%`, backgroundColor: '#3B1F0F' }}
            />
          </div>

          {/* Arrow buttons — desktop only, right of progress bar */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => scrollByCard(-1)}
              disabled={!canScrollLeft}
              className="w-9 h-9 flex items-center justify-center rounded-full shadow-sm transition-opacity duration-200 disabled:opacity-0 disabled:pointer-events-none"
              style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(4px)' }}
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={() => scrollByCard(1)}
              disabled={!canScrollRight}
              className="w-9 h-9 flex items-center justify-center rounded-full shadow-sm transition-opacity duration-200 disabled:opacity-0 disabled:pointer-events-none"
              style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(4px)' }}
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4 text-gray-700" />
            </button>
          </div>
        </div>

        {/* Mobile CTA — centered below everything */}
        <div className="mt-6 flex justify-center md:hidden">
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={pillClass}
          >
            Find us on social
          </a>
        </div>
      </div>
    </section>
  )
}
