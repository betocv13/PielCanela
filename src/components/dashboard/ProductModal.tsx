'use client'

import { useState, useEffect, useRef } from 'react'
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

// Default options
const DEFAULT_SIZES: SizeOption[] = [
  { name: 'Small', size: '16oz', priceAdjustment: 0 },
  { name: 'Medium', size: '20oz', priceAdjustment: 1.00 },
  { name: 'Large', size: '24oz', priceAdjustment: 1.50 },
]

const DEFAULT_MILK_OPTIONS: MilkOption[] = [
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
  const [selectedSizes, setSelectedSizes] = useState<Set<string>>(new Set(['Small']))
  const [selectedMilk, setSelectedMilk] = useState<Set<string>>(new Set())
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set())

  // Custom items
  const [customSizes, setCustomSizes] = useState<SizeOption[]>([])
  const [customMilk, setCustomMilk] = useState<MilkOption[]>([])
  const [customAddons, setCustomAddons] = useState<AddonOption[]>([])

  // Category state
  const [showCustomCategory, setShowCustomCategory] = useState(false)
  const [customCategory, setCustomCategory] = useState('')

  // Combine default and existing categories
  const allCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...existingCategories.map(c =>
    c.charAt(0).toUpperCase() + c.slice(1)
  )]))

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

      // Set selected sizes
      const sizeNames = new Set(product.sizes.map(s => s.name))
      setSelectedSizes(sizeNames)

      // Separate custom sizes
      const defaultSizeNames = DEFAULT_SIZES.map(s => s.name)
      const custom = product.sizes.filter(s => !defaultSizeNames.includes(s.name))
      setCustomSizes(custom)

      // Set selected milk
      const milkNames = new Set(product.milk_options.map(m => m.name))
      setSelectedMilk(milkNames)

      // Separate custom milk
      const defaultMilkNames = DEFAULT_MILK_OPTIONS.map(m => m.name)
      const customM = product.milk_options.filter(m => !defaultMilkNames.includes(m.name))
      setCustomMilk(customM)

      // Set selected addons
      const addonNames = new Set(product.addons.map(a => a.name))
      setSelectedAddons(addonNames)

      // Separate custom addons
      const defaultAddonNames = DEFAULT_ADDONS.map(a => a.name)
      const customA = product.addons.filter(a => !defaultAddonNames.includes(a.name))
      setCustomAddons(customA)

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
      setSelectedSizes(new Set(['Small']))
      setSelectedMilk(new Set())
      setSelectedAddons(new Set())
      setCustomSizes([])
      setCustomMilk([])
      setCustomAddons([])
      setShowCustomCategory(false)
      setCustomCategory('')
    }
    setError(null)
  }, [product, isOpen])

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
    // Build sizes array
    const sizes: SizeOption[] = []
    DEFAULT_SIZES.forEach(size => {
      if (selectedSizes.has(size.name)) {
        sizes.push(size)
      }
    })
    customSizes.forEach(size => {
      if (selectedSizes.has(size.name)) {
        sizes.push(size)
      }
    })

    // Build milk options array
    const milk_options: MilkOption[] = []
    DEFAULT_MILK_OPTIONS.forEach(milk => {
      if (selectedMilk.has(milk.name)) {
        milk_options.push(milk)
      }
    })
    customMilk.forEach(milk => {
      if (selectedMilk.has(milk.name)) {
        milk_options.push(milk)
      }
    })

    // Build addons array
    const addons: AddonOption[] = []
    DEFAULT_ADDONS.forEach(addon => {
      if (selectedAddons.has(addon.name)) {
        addons.push(addon)
      }
    })
    customAddons.forEach(addon => {
      if (selectedAddons.has(addon.name)) {
        addons.push(addon)
      }
    })

    return {
      ...formData,
      category: showCustomCategory ? customCategory : formData.category,
      sizes,
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
      if (finalData.base_price <= 0) {
        throw new Error('Base price must be greater than 0')
      }
      if (finalData.sizes.length === 0) {
        throw new Error('At least one size is required')
      }

      await onSave(finalData)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Add custom size
  const addCustomSize = () => {
    const name = `Custom ${customSizes.length + 1}`
    const newSize: SizeOption = { name, size: '', priceAdjustment: 0 }
    setCustomSizes([...customSizes, newSize])
    setSelectedSizes(new Set([...selectedSizes, name]))
  }

  // Add custom milk
  const addCustomMilk = () => {
    const name = `Custom Milk ${customMilk.length + 1}`
    const newMilk: MilkOption = { name, priceAdjustment: 0 }
    setCustomMilk([...customMilk, newMilk])
    setSelectedMilk(new Set([...selectedMilk, name]))
  }

  // Add custom addon
  const addCustomAddon = () => {
    const name = `Custom Add-on ${customAddons.length + 1}`
    const newAddon: AddonOption = { name, priceAdjustment: 0 }
    setCustomAddons([...customAddons, newAddon])
    setSelectedAddons(new Set([...selectedAddons, name]))
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

                {/* Base Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Base Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.base_price || ''}
                    onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-brown focus:border-transparent bg-gray-50"
                    placeholder="4.50"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Sizes */}
            <div>
              <h3 className="text-sm font-semibold text-brand-brown uppercase tracking-wide mb-4">
                Sizes Available
              </h3>
              <div className="space-y-2">
                {DEFAULT_SIZES.map((size) => (
                  <label key={size.name} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedSizes.has(size.name)}
                      onChange={(e) => {
                        const newSet = new Set(selectedSizes)
                        if (e.target.checked) {
                          newSet.add(size.name)
                        } else {
                          newSet.delete(size.name)
                        }
                        setSelectedSizes(newSet)
                      }}
                      className="w-4 h-4 text-brand-brown border-gray-300 rounded focus:ring-brand-brown"
                    />
                    <span className="text-sm text-gray-700">
                      {size.size} ({size.name}) - {size.priceAdjustment === 0 ? 'Base price' : `+$${size.priceAdjustment.toFixed(2)}`}
                    </span>
                  </label>
                ))}
                {customSizes.map((size, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedSizes.has(size.name)}
                      onChange={(e) => {
                        const newSet = new Set(selectedSizes)
                        if (e.target.checked) {
                          newSet.add(size.name)
                        } else {
                          newSet.delete(size.name)
                        }
                        setSelectedSizes(newSet)
                      }}
                      className="w-4 h-4 text-brand-brown border-gray-300 rounded focus:ring-brand-brown"
                    />
                    <input
                      type="text"
                      value={size.name}
                      onChange={(e) => {
                        const oldName = size.name
                        const newSizes = [...customSizes]
                        newSizes[idx] = { ...newSizes[idx], name: e.target.value }
                        setCustomSizes(newSizes)
                        // Update selected set
                        const newSet = new Set(selectedSizes)
                        newSet.delete(oldName)
                        newSet.add(e.target.value)
                        setSelectedSizes(newSet)
                      }}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                      placeholder="Name"
                    />
                    <input
                      type="text"
                      value={size.size}
                      onChange={(e) => {
                        const newSizes = [...customSizes]
                        newSizes[idx] = { ...newSizes[idx], size: e.target.value }
                        setCustomSizes(newSizes)
                      }}
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                      placeholder="Size"
                    />
                    <span className="text-sm text-gray-500">+$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={size.priceAdjustment}
                      onChange={(e) => {
                        const newSizes = [...customSizes]
                        newSizes[idx] = { ...newSizes[idx], priceAdjustment: parseFloat(e.target.value) || 0 }
                        setCustomSizes(newSizes)
                      }}
                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newSet = new Set(selectedSizes)
                        newSet.delete(size.name)
                        setSelectedSizes(newSet)
                        setCustomSizes(customSizes.filter((_, i) => i !== idx))
                      }}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addCustomSize}
                  className="flex items-center gap-1 text-sm text-brand-brown hover:text-brand-brown/80 mt-2"
                >
                  <Plus className="w-4 h-4" />
                  Add custom size
                </button>
              </div>
            </div>

            {/* Milk Options */}
            <div>
              <h3 className="text-sm font-semibold text-brand-brown uppercase tracking-wide mb-4">
                Milk Options
              </h3>
              <div className="space-y-2">
                {DEFAULT_MILK_OPTIONS.map((milk) => (
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
                {customMilk.map((milk, idx) => (
                  <div key={idx} className="flex items-center gap-2">
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
                    <input
                      type="text"
                      value={milk.name}
                      onChange={(e) => {
                        const oldName = milk.name
                        const newMilk = [...customMilk]
                        newMilk[idx] = { ...newMilk[idx], name: e.target.value }
                        setCustomMilk(newMilk)
                        const newSet = new Set(selectedMilk)
                        newSet.delete(oldName)
                        newSet.add(e.target.value)
                        setSelectedMilk(newSet)
                      }}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                      placeholder="Name"
                    />
                    <span className="text-sm text-gray-500">+$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={milk.priceAdjustment}
                      onChange={(e) => {
                        const newMilk = [...customMilk]
                        newMilk[idx] = { ...newMilk[idx], priceAdjustment: parseFloat(e.target.value) || 0 }
                        setCustomMilk(newMilk)
                      }}
                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newSet = new Set(selectedMilk)
                        newSet.delete(milk.name)
                        setSelectedMilk(newSet)
                        setCustomMilk(customMilk.filter((_, i) => i !== idx))
                      }}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addCustomMilk}
                  className="flex items-center gap-1 text-sm text-brand-brown hover:text-brand-brown/80 mt-2"
                >
                  <Plus className="w-4 h-4" />
                  Add custom milk option
                </button>
              </div>
            </div>

            {/* Add-ons */}
            <div>
              <h3 className="text-sm font-semibold text-brand-brown uppercase tracking-wide mb-4">
                Add-ons
              </h3>
              <div className="space-y-2">
                {DEFAULT_ADDONS.map((addon) => (
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
                {customAddons.map((addon, idx) => (
                  <div key={idx} className="flex items-center gap-2">
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
                    <input
                      type="text"
                      value={addon.name}
                      onChange={(e) => {
                        const oldName = addon.name
                        const newAddons = [...customAddons]
                        newAddons[idx] = { ...newAddons[idx], name: e.target.value }
                        setCustomAddons(newAddons)
                        const newSet = new Set(selectedAddons)
                        newSet.delete(oldName)
                        newSet.add(e.target.value)
                        setSelectedAddons(newSet)
                      }}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                      placeholder="Name"
                    />
                    <span className="text-sm text-gray-500">+$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={addon.priceAdjustment}
                      onChange={(e) => {
                        const newAddons = [...customAddons]
                        newAddons[idx] = { ...newAddons[idx], priceAdjustment: parseFloat(e.target.value) || 0 }
                        setCustomAddons(newAddons)
                      }}
                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newSet = new Set(selectedAddons)
                        newSet.delete(addon.name)
                        setSelectedAddons(newSet)
                        setCustomAddons(customAddons.filter((_, i) => i !== idx))
                      }}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addCustomAddon}
                  className="flex items-center gap-1 text-sm text-brand-brown hover:text-brand-brown/80 mt-2"
                >
                  <Plus className="w-4 h-4" />
                  Add custom add-on
                </button>
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
                    <img
                      src={formData.image_url}
                      alt="Product preview"
                      className="w-32 h-32 object-cover rounded-lg mx-auto"
                    />
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
