'use client'

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
      className="flex-shrink-0 animate-pulse"
      style={{ width: '290px', height: '390px', borderRadius: 'var(--content-radius)', background: '#F5F5F5' }}
    />
  )
}

export default function MenuSection({ products, onOrderProduct, loading = false }: MenuSectionProps) {
  const isLoading = loading || products.length === 0

  return (
    <section className="bg-white py-10 md:py-14">
      {/* Section title */}
      <div className="content-inset mb-6">
        <h2 className="text-2xl font-menu font-bold" style={{ color: '#6D6D6D' }}>
          Our Menu
        </h2>
      </div>

      {/* Horizontal scroll row */}
      <div
        className="flex gap-4 overflow-x-auto"
        style={{
          paddingLeft: 'var(--content-inset)',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : products.map((product) => (
              <div key={product.id} className="flex-shrink-0">
                <ProductCard product={product} onOrder={onOrderProduct} />
              </div>
            ))}

        {/* Right-side spacer so last card clears the viewport edge */}
        <div className="flex-shrink-0" style={{ width: 'var(--content-inset)' }} />
      </div>
    </section>
  )
}
