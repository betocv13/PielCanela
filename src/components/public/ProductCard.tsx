'use client'

import Image from 'next/image'
import { Product } from '@/types'
import { formatPrice } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  onOrder: (product: Product) => void
}

export default function ProductCard({ product, onOrder }: ProductCardProps) {
  return (
    <div className="bg-white rounded-card shadow-card hover:shadow-card-hover transition-shadow duration-300 overflow-hidden flex flex-col">
      {/* Product Image */}
      <div className="relative aspect-square bg-brand-beige">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl">☕</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-semibold text-brand-brown text-lg mb-1">
          {product.name}
        </h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2 flex-grow">
          {product.description}
        </p>
        <p className="text-brand-brown font-bold mb-3">
          {formatPrice(product.base_price)}
        </p>

        {/* Order Button */}
        <button
          onClick={() => onOrder(product)}
          className="w-full bg-brand-brown text-white py-2.5 px-4 rounded-button font-semibold
                     hover:bg-brand-brown/90 transition-colors duration-200 active:scale-[0.98]"
        >
          Order
        </button>
      </div>
    </div>
  )
}
