'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, Plus, Minus } from 'lucide-react'
import { Product, CartItem, MilkOption, AddonOption } from '@/types'
import { useCart } from '@/components/providers/CartProvider'
import { formatPrice } from '@/lib/utils'

interface OrderModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
}

export default function OrderModal({ product, isOpen, onClose }: OrderModalProps) {
  const { addItem } = useCart()
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedMilk, setSelectedMilk] = useState<string | null>(null)
  const [selectedAddons, setSelectedAddons] = useState<string[]>([])
  const [quantity, setQuantity] = useState(1)
  const [specialInstructions, setSpecialInstructions] = useState('')

  // Global options from settings (single source of truth for prices)
  const [globalMilkOptions, setGlobalMilkOptions] = useState<MilkOption[]>([])
  const [globalAddonOptions, setGlobalAddonOptions] = useState<AddonOption[]>([])

  // Fetch global options from settings
  useEffect(() => {
    const fetchGlobalOptions = async () => {
      try {
        const response = await fetch('/api/settings')
        if (response.ok) {
          const data = await response.json()
          // API returns { settings: { global_milk_options: [...], global_addon_options: [...] } }

          // Fetch milk options
          if (data.settings?.global_milk_options) {
            const options = typeof data.settings.global_milk_options === 'string'
              ? JSON.parse(data.settings.global_milk_options)
              : data.settings.global_milk_options
            if (Array.isArray(options)) {
              setGlobalMilkOptions(options)
            }
          }

          // Fetch addon options
          if (data.settings?.global_addon_options) {
            const options = typeof data.settings.global_addon_options === 'string'
              ? JSON.parse(data.settings.global_addon_options)
              : data.settings.global_addon_options
            if (Array.isArray(options)) {
              setGlobalAddonOptions(options)
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch global options:', err)
      }
    }

    if (isOpen) {
      fetchGlobalOptions()
    }
  }, [isOpen])

  // Reset selections when product changes
  useEffect(() => {
    if (product) {
      // Set default size if available
      if (product.sizes && product.sizes.length > 0) {
        setSelectedSize(product.sizes[0].name)
      } else {
        setSelectedSize(null)
      }
      // Set default milk if available
      // Find first product milk option that exists in global options
      if (product.milk_options && product.milk_options.length > 0 && globalMilkOptions.length > 0) {
        const productMilkNames = product.milk_options.map(m => m.name)
        const firstAvailable = globalMilkOptions.find(m => productMilkNames.includes(m.name))
        setSelectedMilk(firstAvailable ? firstAvailable.name : null)
      } else if (product.milk_options && product.milk_options.length > 0) {
        // Fallback to product milk option if global not loaded yet
        setSelectedMilk(product.milk_options[0].name)
      } else {
        setSelectedMilk(null)
      }
      setSelectedAddons([])
      setQuantity(1)
      setSpecialInstructions('')
    }
  }, [product, globalMilkOptions])

  if (!isOpen || !product) return null

  // Get available milk options for this product (filtered from global settings)
  const getAvailableMilkOptions = () => {
    if (!product.milk_options || product.milk_options.length === 0) return []

    // Get the milk names that this product has enabled
    const productMilkNames = product.milk_options.map(m => m.name)

    // Filter global milk options to only show ones this product has
    // Use global prices as single source of truth
    return globalMilkOptions.filter(milk => productMilkNames.includes(milk.name))
  }

  // Get available addon options for this product (filtered from global settings)
  const getAvailableAddonOptions = () => {
    if (!product.addons || product.addons.length === 0) return []

    // Get the addon names that this product has enabled
    const productAddonNames = product.addons.map(a => a.name)

    // Filter global addon options to only show ones this product has
    // Use global prices as single source of truth
    return globalAddonOptions.filter(addon => productAddonNames.includes(addon.name))
  }

  // Calculate total price
  const calculateTotal = () => {
    let total = 0

    // Get size price (direct pricing)
    if (selectedSize && product.sizes) {
      const size = product.sizes.find(s => s.name === selectedSize)
      if (size) {
        // Support both old (priceAdjustment) and new (price) format
        total = 'price' in size ? size.price : (product.base_price + (((size as { priceAdjustment?: number }).priceAdjustment) || 0))
      }
    } else {
      // Fallback to base_price if no size selected
      total = product.base_price
    }

    // Add milk adjustment (use global settings price)
    if (selectedMilk) {
      const milk = globalMilkOptions.find(m => m.name === selectedMilk)
      if (milk) total += milk.priceAdjustment
    }

    // Add addon adjustments (use global settings price)
    if (selectedAddons.length > 0) {
      selectedAddons.forEach(addonName => {
        const addon = globalAddonOptions.find(a => a.name === addonName)
        if (addon) total += addon.priceAdjustment
      })
    }

    return total * quantity
  }

  const handleAddonToggle = (addonName: string) => {
    setSelectedAddons(prev =>
      prev.includes(addonName)
        ? prev.filter(a => a !== addonName)
        : [...prev, addonName]
    )
  }

  const handleAddToCart = () => {
    const cartItem: CartItem = {
      productId: product.id,
      productName: product.name,
      quantity,
      size: selectedSize,
      milk: selectedMilk,
      addons: selectedAddons,
      specialInstructions: specialInstructions || null,
      itemTotal: calculateTotal(),
      basePrice: product.base_price
    }

    addItem(cartItem)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 z-10"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Product image */}
        <div className="relative h-48 bg-brand-beige">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl">☕</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <h2 className="text-2xl font-heading text-brand-brown mb-2">
            {product.name}
          </h2>
          {product.description && (
            <p className="text-gray-600 text-sm mb-4">{product.description}</p>
          )}

          {/* Size selection */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium text-brand-brown mb-2">Size</h3>
              <div className="grid grid-cols-3 gap-2">
                {product.sizes.map((size) => {
                  // Support both old and new price format
                  const sizePrice = 'price' in size ? size.price : (product.base_price + (((size as { priceAdjustment?: number }).priceAdjustment) || 0))
                  return (
                    <button
                      key={size.name}
                      onClick={() => setSelectedSize(size.name)}
                      className={`py-2 px-3 rounded-lg border-2 text-sm transition-all ${
                        selectedSize === size.name
                          ? 'border-brand-brown bg-brand-cream'
                          : 'border-gray-200 hover:border-brand-brown/50'
                      }`}
                    >
                      <div className="font-medium">{size.name}</div>
                      <div className="text-xs text-gray-500">
                        {formatPrice(sizePrice)}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Milk selection */}
          {(() => {
            const availableMilkOptions = getAvailableMilkOptions()
            return availableMilkOptions.length > 0 && (
              <div className="mb-4">
                <h3 className="font-medium text-brand-brown mb-2">Milk</h3>
                <div className="space-y-2">
                  {availableMilkOptions.map((milk) => (
                    <button
                      key={milk.name}
                      onClick={() => setSelectedMilk(milk.name)}
                      className={`w-full flex items-center justify-between py-2 px-3 rounded-lg border-2 text-sm transition-all ${
                        selectedMilk === milk.name
                          ? 'border-brand-brown bg-brand-cream'
                          : 'border-gray-200 hover:border-brand-brown/50'
                      }`}
                    >
                      <span>{milk.name}</span>
                      {milk.priceAdjustment !== 0 && (
                        <span className="text-gray-500">
                          {milk.priceAdjustment > 0 ? '+' : ''}{formatPrice(milk.priceAdjustment)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Addons */}
          {(() => {
            const availableAddonOptions = getAvailableAddonOptions()
            return availableAddonOptions.length > 0 && (
              <div className="mb-4">
                <h3 className="font-medium text-brand-brown mb-2">Add-ons</h3>
                <div className="space-y-2">
                  {availableAddonOptions.map((addon) => (
                    <button
                      key={addon.name}
                      onClick={() => handleAddonToggle(addon.name)}
                      className={`w-full flex items-center justify-between py-2 px-3 rounded-lg border-2 text-sm transition-all ${
                        selectedAddons.includes(addon.name)
                          ? 'border-brand-brown bg-brand-cream'
                          : 'border-gray-200 hover:border-brand-brown/50'
                      }`}
                    >
                      <span>{addon.name}</span>
                      <span className="text-gray-500">
                        +{formatPrice(addon.priceAdjustment)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Special instructions */}
          <div className="mb-4">
            <h3 className="font-medium text-brand-brown mb-2">Special Instructions</h3>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Any special requests?"
              className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:border-brand-brown"
              rows={2}
            />
          </div>

          {/* Quantity */}
          <div className="mb-6">
            <h3 className="font-medium text-brand-brown mb-2">Quantity</h3>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="p-2 rounded-lg border border-gray-200 hover:border-brand-brown/50"
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-lg font-medium w-8 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(q => Math.min(10, q + 1))}
                className="p-2 rounded-lg border border-gray-200 hover:border-brand-brown/50"
                disabled={quantity >= 10}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Add to cart button */}
          <button
            onClick={handleAddToCart}
            className="w-full bg-brand-brown text-white py-3 px-4 rounded-button font-semibold
                       hover:bg-brand-brown/90 transition-colors duration-200 flex items-center justify-center gap-2"
          >
            Add to Cart - {formatPrice(calculateTotal())}
          </button>
        </div>
      </div>
    </div>
  )
}
