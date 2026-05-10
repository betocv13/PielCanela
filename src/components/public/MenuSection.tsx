'use client'

import { useRef, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Product } from '@/types'
import ProductCard from './ProductCard'

interface MenuSectionProps {
  products: Product[]
  onOrderProduct: (product: Product) => void
  loading?: boolean
}

function SkeletonCard() {
  return (
    <div
      className="menu-card-wrapper animate-pulse"
      style={{ borderRadius: 'var(--content-radius)', background: '#F0F0F0' }}
    />
  )
}

export default function MenuSection({ products, onOrderProduct, loading = false }: MenuSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const update = () => {
      setCanScrollLeft(el.scrollLeft > 1)
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1)
    }

    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [products])

  const scrollByCard = (dir: 1 | -1) => {
    const el = scrollRef.current
    if (!el) return
    // One card width = (container - 2 gaps) / 3 + 1 gap
    const gap = 16
    const cardWidth = (el.clientWidth - 2 * gap) / 3
    el.scrollBy({ left: dir * (cardWidth + gap), behavior: 'smooth' })
  }

  const isLoading = loading || products.length === 0

  return (
    <section className="bg-white py-10 md:py-14">
      {/* Section title aligned to content inset */}
      <div className="content-inset mb-6">
        <h2 className="text-2xl font-menu font-bold" style={{ color: '#6D6D6D' }}>
          Our Menu
        </h2>
      </div>

      {/*
        Outer: positioning context for arrows + enforces content margins.
        Inner clip div: masks any card that slides partially out of the bounded area.
        Scroll div: the actual horizontally-scrolling flex row.
      */}
      <div className="content-inset-margin relative">
        {/* Left arrow — desktop only, hidden when at start */}
        {canScrollLeft && (
          <button
            onClick={() => scrollByCard(-1)}
            className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full shadow-md"
            style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(4px)' }}
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
        )}

        {/* Right arrow — desktop only, hidden when at end */}
        {canScrollRight && (
          <button
            onClick={() => scrollByCard(1)}
            className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full shadow-md"
            style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(4px)' }}
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        )}

        {/* Clip boundary — cards never bleed past the content area edges */}
        <div className="overflow-hidden">
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', scrollSnapType: 'x mandatory' }}
          >
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
              : products.map((product) => (
                  <div
                    key={product.id}
                    className="menu-card-wrapper"
                    style={{ scrollSnapAlign: 'start' }}
                  >
                    <ProductCard product={product} onOrder={onOrderProduct} />
                  </div>
                ))}
          </div>
        </div>
      </div>
    </section>
  )
}
