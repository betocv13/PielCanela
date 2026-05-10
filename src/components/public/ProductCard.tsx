'use client'

import Image from 'next/image'
import { Product } from '@/types'
import { formatPrice } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  onOrder: (product: Product) => void
}

function categoryBadge(category: string): string {
  const c = category.toLowerCase().trim()
  if (c === 'matcha') return '#6D7862'
  if (c === 'sugar free' || c === 'sugar-free') return '#5170FF'
  if (c === 'coffee') return '#805538'
  return '#000000'
}

export default function ProductCard({ product, onOrder }: ProductCardProps) {
  return (
    <button
      onClick={() => onOrder(product)}
      className="flex flex-col text-left cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-brown"
      style={{
        width: '290px',
        height: '390px',
        borderRadius: 'var(--content-radius)',
        background: 'white',
      }}
    >
      {/* ── Image area ── */}
      <div className="relative flex-1 bg-[#F5F5F5]">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover"
            sizes="290px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl">☕</span>
          </div>
        )}

        {/* Category badge */}
        <span
          className="absolute top-3 left-3 px-3 py-1 rounded-full text-white text-[10px] font-bold tracking-wide uppercase font-menu"
          style={{ backgroundColor: categoryBadge(product.category) }}
        >
          {product.category}
        </span>
      </div>

      {/* ── Text area — fixed height so all cards align ── */}
      <div
        className="flex-shrink-0 px-4 pt-3 pb-3 bg-white"
        style={{ height: '90px' }}
      >
        {/* Name + price on one row */}
        <div className="flex items-baseline justify-between gap-3 mb-1.5">
          <h3
            className="text-[13px] font-bold font-menu truncate flex-1 leading-tight"
            style={{ color: '#6D6D6D' }}
          >
            {product.name}
          </h3>
          <span
            className="text-[13px] font-bold font-menu flex-shrink-0 leading-tight"
            style={{ color: '#6D6D6D' }}
          >
            {formatPrice(product.base_price)}
          </span>
        </div>

        {/* Description — 2-line clamp */}
        <p
          className="text-[11px] font-menu leading-snug"
          style={{
            color: '#6D6D6D',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {product.description}
        </p>
      </div>
    </button>
  )
}
