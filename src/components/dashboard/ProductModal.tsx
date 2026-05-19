'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Image from 'next/image'
import { X, Upload, Plus, Trash2 } from 'lucide-react'
import { Product, SizeOption, MilkOption, AddonOption } from '@/types'

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: ProductFormData) => Promise<void>
  product?: Product | null
  existingCategories: string[]
}

interface ProductFormData {
  name: string
  description: string
  category: string
  base_price: number
  sizes: SizeOption[]
  milk_options: MilkOption[]
  addons: AddonOption[]
  available: boolean
  image_url: string | null
}

// Fallback milk options in case settings can't be loaded
const FALLBACK_MILK_OPTIONS: MilkOption[] = [
  { name: 'Whole Milk', priceAdjustment: 0 },
  { name: 'Oat Milk', priceAdjustment: 0.50 },
  { name: 'Almond Milk', priceAdjustment: 0 },
  { name: 'Coconut Milk', priceAdjustment: 0 },
]

const DEFAULT_ADDONS: AddonOption[] = [
  { name: 'Extra Shot', priceAdjustment: 1.00 },
  { name: 'Cold Foam', priceAdjustment: 1.00 },
  { name: 'Vanilla Syrup', priceAdjustment: 0.50 },
]

const DEFAULT_CATEGORIES = ['Coffee', 'Matcha', 'Other']

export default function ProductModal({
  isOpen,
  onClose,
  onSave,
  product,
  existingCategories,
}: ProductModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Global milk options from settings
  const [globalMilkOptions, setGlobalMilkOptions] = useState<MilkOption[]>(FALLBACK_MILK_OPTIONS)

  // Global addon options from settings
  const [globalAddonOptions, setGlobalAddonOptions] = useState<AddonOption[]>(DEFAULT_ADDONS)

  // Form state
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    category: 'coffee',
    base_price: 0,
    sizes: [],
    milk_options: [],
    addons: [],
    available: true,
    image_url: null,
  })

  // Selected options (for checkboxes)
  const [selectedMilk, setSelectedMilk] = useState<Set<string>>(new Set())
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set())

  // Product sizes (editable with direct prices)
  const [productSizes, setProductSizes] = useState<SizeOption[]>([
    { name: '16oz', size: '16oz', price: 4.00 }
  ])

  // Category state
  const [showCustomCategory, setShowCustomCategory] = useState(false)
  const [customCategory, setCustomCategory] = useState('')

  // Combine default and existing categories
  const allCategories = useMemo(() =>
    Array.from(new Set([...DEFAULT_CATEGORIES, ...existingCategories.map(c =>
      c.charAt(0).toUpperCase() + c.slice(1)
    )])),
    [existingCategories]
  )

  // Fetch global options from settings
  useEffect(() => {
    const fetchGlobalOptions = async () => {
      try {
        const response = await fetch('/api/settings')
        if (response.ok) {
          const data = await response.json()
          // API returns { settings: { global_milk_options: [...], global_addon_options: [...] } }

          // Fetch milk options
          const milkOptions = data.settings?.global_milk_options
          if (milkOptions) {
            const options = typeof milkOptions === 'string'
              ? JSON.parse(milkOptions)
              : milkOptions
            if (Array.isArray(options) && options.length > 0) {
              setGlobalMilkOptions(options)
            }
          }

          // Fetch addon options
          const addonOptions = data.settings?.global_addon_options
          if (addonOptions) {
            const options = typeof addonOptions === 'string'
              ? JSON.parse(addonOptions)
              : addonOptions
            if (Array.isArray(options) && options.length > 0) {
              setGlobalAddonOptions(options)
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch global options:', err)
        // Keep using fallback options
      }
    }

    if (isOpen) {
      fetchGlobalOptions()
    }
  }, [isOpen])

  // Initialize form when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || '',
        category: product.category,
        base_price: product.base_price,
        sizes: product.sizes,
        milk_options: product.milk_options,
        addons: product.addons,
        available: product.available,
        image_url: product.image_url,
      })

      // Set product sizes (migrate old priceAdjustment format if needed)
      const migratedSizes = product.sizes.map(s => ({
        name: s.name,
        size: s.size,
        price: 'price' in s ? s.price : (product.base_price + ((s as { priceAdjustment?: number }).priceAdjustment || 0))
      }))
      setProductSizes(migratedSizes.length > 0 ? migratedSizes : [{ name: '16oz', size: '16oz', price: 4.00 }])

      // Set selected milk (only select milk options that exist in global settings)
      const globalMilkNames = globalMilkOptions.map(m => m.name)
      const milkNames = new Set(product.milk_options.map(m => m.name).filter(name => globalMilkNames.includes(name)))
      setSelectedMilk(milkNames)

      // Set selected addons (only select addons that exist in global settings)
      const globalAddonNames = globalAddonOptions.map(a => a.name)
      const addonNames = new Set(product.addons.map(a => a.name).filter(name => globalAddonNames.includes(name)))
      setSelectedAddons(addonNames)

      // Check if category is custom
      if (!allCategories.map(c => c.toLowerCase()).includes(product.category.toLowerCase())) {
        setShowCustomCategory(true)
        setCustomCategory(product.category)
      }
    } else {
      // Reset form for new product
      setFormData({
        name: '',
        description: '',
        category: 'coffee',
        base_price: 0,
        sizes: [],
        milk_options: [],
        addons: [],
        available: true,
        image_url: null,
      })
      setProductSizes([{ name: '16oz', size: '16oz', price: 4.00 }])
      setSelectedMilk(new Set())
      setSelectedAddons(new Set())
      setShowCustomCategory(false)
      setCustomCategory('')
    }
    setError(null)
  }, [product, isOpen, globalMilkOptions, globalAddonOptions, allCategories])

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image')
      }

      setFormData(prev => ({ ...prev, image_url: data.url }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  // Build final data from selections
  const buildFinalData = (): ProductFormData => {
    // Build milk options array (using prices from global settings)
    // Products only store which milk options are available - prices come from global settings
    const milk_options: MilkOption[] = []
    globalMilkOptions.forEach(milk => {
      if (selectedMilk.has(milk.name)) {
        milk_options.push(milk)
      }
    })

    // Build addons array (using prices from global settings)
    // Products only store which addons are available - prices come from global settings
    const addons: AddonOption[] = []
    globalAddonOptions.forEach(addon => {
      if (selectedAddons.has(addon.name)) {
        addons.push(addon)
      }
    })

    // Calculate base_price as the minimum size price (for display purposes)
    const base_price = productSizes.length > 0
      ? Math.min(...productSizes.map(s => s.price))
      : 0

    return {
      ...formData,
      category: showCustomCategory ? customCategory : formData.category,
      base_price,
      sizes: productSizes,
      milk_options,
      addons,
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const finalData = buildFinalData()

      // Validate
      if (!finalData.name.trim()) {
        throw new Error('Product name is required')
      }
      if (!finalData.category.trim()) {
        throw new Error('Category is required')
      }
      if (finalData.sizes.length === 0) {
        throw new Error('At least one size is required')
      }
      if (finalData.sizes.some(s => s.price <= 0)) {
        throw new Error('All sizes must have a price greater than 0')
      }

      await onSave(finalData)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Add new size
  const addSize = () => {
    // Suggest next logical size based on existing sizes
    const existingNames = productSizes.map(s => s.name)
    let newSize: SizeOption

    if (!existingNames.includes('16oz')) {
      newSize = { name: '16oz', size: '16oz', price: 4.00 }
    } else if (!existingNames.includes('20oz')) {
      newSize = { name: '20oz', size: '20oz', price: 5.00 }
    } else {
      newSize = { name: 'Custom', size: '', price: 0 }
    }

    setProductSizes([...productSizes, newSize])
  }

  // Remove size
  const removeSize = (index: number) => {
    setProductSizes(productSizes.filter((_, i) => i !== index))
  }

  // Update size
  const updateSize = (index: number, field: keyof SizeOption, value: string | number) => {
    const newSizes = [...productSizes]
    newSizes[index] = { ...newSizes[index], [field]: value }
    setProductSizes(newSizes)
  }


  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-brand-brown">
              {product ? 'Edit Product' : 'Add New Product'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Basic Information */}
            <div>
              <h3 className="text-sm font-semibold text-brand-brown uppercase tracking-wide mb-4">
                Basic Information
              </h3>

              <div className="space-y-4">
                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-brown focus:border-transparent bg-gray-50"
                    placeholder="Churro Latte"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-brown focus:border-transparent bg-gray-50"
                    placeholder="Cinnamon sugar flavor..."
                    rows={3}
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  {!showCustomCategory ? (
                    <div className="flex gap-2">
                      <select
                        value={formData.category}
                        onChange={(e) => {
                          if (e.target.value === '__custom__') {
                            setShowCustomCategory(true)
                          } else {
                            setFormData({ ...formData, category: e.target.value })
                          }
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-brown focus:border-transparent bg-gray-50"
                      >
                        {allCategories.map(cat => (
                          <option key={cat} value={cat.toLowerCase()}>{cat}</option>
                        ))}
                        <option value="__custom__">+ Add new category</option>
                      </select>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-brown focus:border-transparent bg-gray-50"
                        placeholder="Enter new category"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setShowCustomCategory(false)
                          setCustomCategory('')
                        }}
                        className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Sizes & Prices */}
            <div>
              <h3 className="text-sm font-semibold text-brand-brown uppercase tracking-wide mb-4">
                Sizes & Prices
              </h3>
              <div className="space-y-3">
                {productSizes.map((size, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-3">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Name</label>
                        <input
                          type="text"
                          value={size.name}
                          onChange={(e) => updateSize(idx, 'name', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-brand-brown"
                          placeholder="16oz"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Size</label>
                        <input
                          type="text"
                          value={size.size}
                          onChange={(e) => updateSize(idx, 'size', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-brand-brown"
                          placeholder="16oz"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Price</label>
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-gray-500">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={size.price || ''}
                            onChange={(e) => updateSize(idx, 'price', parseFloat(e.target.value) || 0)}
                            className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-brand-brown"
                            placeholder="4.00"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        {productSizes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSize(idx)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addSize}
                  className="flex items-center gap-1 text-sm text-brand-brown hover:text-brand-brown/80"
                >
                  <Plus className="w-4 h-4" />
                  Add size
                </button>
              </div>
            </div>

            {/* Milk Options */}
            <div>
              <h3 className="text-sm font-semibold text-brand-brown uppercase tracking-wide mb-4">
                Milk Options
              </h3>
              <div className="space-y-2">
                {globalMilkOptions.map((milk) => (
                  <label key={milk.name} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedMilk.has(milk.name)}
                      onChange={(e) => {
                        const newSet = new Set(selectedMilk)
                        if (e.target.checked) {
                          newSet.add(milk.name)
                        } else {
                          newSet.delete(milk.name)
                        }
                        setSelectedMilk(newSet)
                      }}
                      className="w-4 h-4 text-brand-brown border-gray-300 rounded focus:ring-brand-brown"
                    />
                    <span className="text-sm text-gray-700">
                      {milk.name} {milk.priceAdjustment > 0 && `(+$${milk.priceAdjustment.toFixed(2)})`}
                    </span>
                  </label>
                ))}
                <p className="text-xs text-gray-500 mt-2">
                  Milk options and prices are managed in Settings
                </p>
              </div>
            </div>

            {/* Add-ons */}
            <div>
              <h3 className="text-sm font-semibold text-brand-brown uppercase tracking-wide mb-4">
                Add-ons
              </h3>
              <div className="space-y-2">
                {globalAddonOptions.map((addon) => (
                  <label key={addon.name} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedAddons.has(addon.name)}
                      onChange={(e) => {
                        const newSet = new Set(selectedAddons)
                        if (e.target.checked) {
                          newSet.add(addon.name)
                        } else {
                          newSet.delete(addon.name)
                        }
                        setSelectedAddons(newSet)
                      }}
                      className="w-4 h-4 text-brand-brown border-gray-300 rounded focus:ring-brand-brown"
                    />
                    <span className="text-sm text-gray-700">
                      {addon.name} (+${addon.priceAdjustment.toFixed(2)})
                    </span>
                  </label>
                ))}
                <p className="text-xs text-gray-500 mt-2">
                  Add-on options and prices are managed in Settings
                </p>
              </div>
            </div>

            {/* Product Image */}
            <div>
              <h3 className="text-sm font-semibold text-brand-brown uppercase tracking-wide mb-4">
                Product Image
              </h3>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  formData.image_url
                    ? 'border-brand-brown bg-brand-cream'
                    : 'border-gray-300 hover:border-brand-brown hover:bg-gray-50'
                }`}
              >
                {formData.image_url ? (
                  <div className="space-y-2">
                    <div className="w-32 h-32 relative mx-auto">
                      <Image
                        src={formData.image_url}
                        alt="Product preview"
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                    <p className="text-sm text-brand-brown">Click to change image</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-500">
                      {isUploading ? 'Uploading...' : 'Upload Image or drag & drop'}
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* Availability */}
            <div>
              <h3 className="text-sm font-semibold text-brand-brown uppercase tracking-wide mb-4">
                Availability
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Available for Ordering:</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, available: !formData.available })}
                  className="flex items-center gap-2"
                >
                  <span className={`text-sm font-medium ${formData.available ? 'text-green-600' : 'text-gray-400'}`}>
                    {formData.available ? 'ON' : 'OFF'}
                  </span>
                  <div
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      formData.available ? 'bg-brand-brown' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        formData.available ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </div>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="flex-1 px-4 py-3 bg-brand-brown text-white rounded-lg hover:bg-brand-brown/90 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
