'use client'

import Image from 'next/image'
import { Pencil, Trash2 } from 'lucide-react'
import { Product } from '@/types'
import { formatPrice } from '@/lib/utils'

interface AdminProductCardProps {
  product: Product
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
  onToggleAvailability: (product: Product) => void
}

export default function AdminProductCard({
  product,
  onEdit,
  onDelete,
  onToggleAvailability,
}: AdminProductCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Product Image */}
      <div className="relative aspect-square bg-gray-100">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-brand-cream">
            <span className="text-brand-brown/40 text-sm">No image</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-brand-brown text-lg truncate">
          {product.name}
        </h3>
        <p className="text-sm text-brand-brown/70 capitalize">
          Category: {product.category}
        </p>
        <p className="text-brand-brown font-medium mt-1">
          Base Price: {formatPrice(product.base_price)}
        </p>

        {/* Availability Toggle */}
        <div className="flex items-center justify-between mt-3">
          <span className="text-sm text-brand-brown/70">Available:</span>
          <button
            onClick={() => onToggleAvailability(product)}
            className="flex items-center gap-2"
          >
            <span className={`text-sm font-medium ${product.available ? 'text-green-600' : 'text-gray-400'}`}>
              {product.available ? 'ON' : 'OFF'}
            </span>
            <div
              className={`relative w-12 h-6 rounded-full transition-colors ${
                product.available ? 'bg-brand-brown' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  product.available ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </div>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onEdit(product)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-brand-brown text-brand-brown rounded-lg hover:bg-brand-cream transition-colors"
          >
            <Pencil className="w-4 h-4" />
            <span>Edit</span>
          </button>
          <button
            onClick={() => onDelete(product)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-red-400 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  )
}
