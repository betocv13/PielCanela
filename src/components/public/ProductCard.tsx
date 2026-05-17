'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Product } from '@/types'
import { formatPrice } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  onOrder: (product: Product) => void
  isOrderingOpen: boolean
}

function categoryBadge(category: string): string {
  const c = category.toLowerCase().trim()
  if (c === 'matcha') return '#6D7862'
  if (c === 'sugar free' || c === 'sugar-free') return '#5170FF'
  if (c === 'coffee') return '#805538'
  return '#000000'
}

export default function ProductCard({ product, onOrder, isOrderingOpen }: ProductCardProps) {
  const [imgError, setImgError] = useState(false)
  const [showClosedModal, setShowClosedModal] = useState(false)

  return (
    // Fills the .menu-card-wrapper container (position: relative, aspect-ratio)
    <button
      onClick={() => isOrderingOpen ? onOrder(product) : setShowClosedModal(true)}
      className="absolute inset-0 cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-brown"
      style={{ borderRadius: 'var(--content-radius)' }}
    >
      {/* Full-bleed product image */}
      <div className="absolute inset-0 bg-[#F5F5F5]">
        {product.image_url ? (
          imgError ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 767px) 85vw, 33vw"
              onError={() => setImgError(true)}
            />
          )
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl">☕</span>
          </div>
        )}
      </div>

      {/* Category badge */}
      <span
        className="absolute top-3 left-3 px-3 py-1 rounded-full text-white text-[10px] font-bold tracking-wide uppercase font-menu z-10"
        style={{ backgroundColor: categoryBadge(product.category) }}
      >
        {product.category}
      </span>

      {/* Bottom gradient scrim so white text is readable */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none z-10"
        style={{
          height: '48%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)',
        }}
      />

      {/* Text overlay — sits on top of the gradient */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-5 z-20 text-left">
        {/* Name + price row */}
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <h3
            className="text-[13px] font-bold font-menu text-white flex-1 min-w-0"
            style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {product.name}
          </h3>
          <span className="text-[13px] font-bold font-menu text-white flex-shrink-0">
            {formatPrice(product.base_price)}
          </span>
        </div>

        {/* Description — strictly 1 line */}
        <p
          className="text-[11px] font-menu text-white/80"
          style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {product.description}
        </p>
      </div>

      {/* Closed modal */}
      {showClosedModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          onClick={(e) => { e.stopPropagation(); setShowClosedModal(false) }}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative bg-white rounded-2xl p-8 max-w-xs w-full text-center shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-5xl mb-4">🔒</div>
            <h3 className="text-xl font-menu font-bold text-brand-brown mb-2">
              Ordering is Closed
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              We&apos;re not accepting orders right now. Check our Instagram for available times.
            </p>
            <a
              href="https://www.instagram.com/pielcanela.coffee/"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm font-semibold text-brand-brown hover:underline mb-5"
              onClick={(e) => e.stopPropagation()}
            >
              @pielcanelacoffee
            </a>
            <button
              onClick={(e) => { e.stopPropagation(); setShowClosedModal(false) }}
              className="w-full bg-brand-brown text-white py-3 rounded-button font-semibold hover:bg-brand-brown/90 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </button>
  )
}
