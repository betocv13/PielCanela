'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Search, ChevronDown } from 'lucide-react'
import { Product } from '@/types'
import AdminProductCard from '@/components/dashboard/AdminProductCard'
import ProductModal from '@/components/dashboard/ProductModal'
import DeleteConfirmModal from '@/components/dashboard/DeleteConfirmModal'

type SortOption = 'name' | 'price-asc' | 'price-desc' | 'newest'

export default function MenuManagementPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter and sort state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState<SortOption>('name')

  // Modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // Get unique categories from products
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category))
    return ['all', ...Array.from(cats)]
  }, [products])

  // Fetch products
  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?includeUnavailable=true')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch products')
      }

      setProducts(data.products)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products]

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      )
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory)
    }

    // Sort
    switch (sortBy) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'price-asc':
        result.sort((a, b) => a.base_price - b.base_price)
        break
      case 'price-desc':
        result.sort((a, b) => b.base_price - a.base_price)
        break
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
    }

    return result
  }, [products, searchQuery, selectedCategory, sortBy])

  // Handle add new product
  const handleAddNew = () => {
    setSelectedProduct(null)
    setIsProductModalOpen(true)
  }

  // Handle edit product
  const handleEdit = (product: Product) => {
    setSelectedProduct(product)
    setIsProductModalOpen(true)
  }

  // Handle delete product
  const handleDelete = (product: Product) => {
    setSelectedProduct(product)
    setIsDeleteModalOpen(true)
  }

  // Handle toggle availability
  const handleToggleAvailability = async (product: Product) => {
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: !product.available }),
      })

      if (!response.ok) {
        throw new Error('Failed to update availability')
      }

      // Update local state
      setProducts(products.map(p =>
        p.id === product.id ? { ...p, available: !p.available } : p
      ))
    } catch (err) {
      console.error('Error toggling availability:', err)
      alert('Failed to update availability')
    }
  }

  // Handle save product (create/update)
  const handleSaveProduct = async (data: {
    name: string
    description: string
    category: string
    base_price: number
    sizes: { name: string; size: string; price: number }[]
    milk_options: { name: string; priceAdjustment: number }[]
    addons: { name: string; priceAdjustment: number }[]
    available: boolean
    image_url: string | null
  }) => {
    const url = selectedProduct
      ? `/api/products/${selectedProduct.id}`
      : '/api/products'
    const method = selectedProduct ? 'PUT' : 'POST'

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Failed to save product')
    }

    // Refresh products list
    await fetchProducts()
  }

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!selectedProduct) return

    const response = await fetch(`/api/products/${selectedProduct.id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Failed to delete product')
    }

    // Refresh products list
    await fetchProducts()
  }

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl lg:text-3xl font-heading text-brand-brown mb-6">
          Menu Management
        </h1>
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-brand-brown/70">Loading products...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl lg:text-3xl font-heading text-brand-brown mb-6">
          Menu Management
        </h1>
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-red-500">{error}</p>
          <button
            onClick={() => {
              setError(null)
              setIsLoading(true)
              fetchProducts()
            }}
            className="mt-4 px-4 py-2 bg-brand-brown text-white rounded-lg hover:bg-brand-brown/90"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl lg:text-3xl font-heading text-brand-brown">
          Menu Management
        </h1>
        <button
          onClick={handleAddNew}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-brown text-white rounded-lg hover:bg-brand-brown/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-brown focus:border-transparent"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="appearance-none w-full lg:w-48 px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-brown focus:border-transparent bg-white capitalize"
            >
              {categories.map(cat => (
                <option key={cat} value={cat} className="capitalize">
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="appearance-none w-full lg:w-48 px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-brown focus:border-transparent bg-white"
            >
              <option value="name">Sort: Name</option>
              <option value="price-asc">Sort: Price (Low)</option>
              <option value="price-desc">Sort: Price (High)</option>
              <option value="newest">Sort: Newest</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-brand-brown/70">
            {products.length === 0
              ? 'No products yet. Click "Add New Product" to create your first product.'
              : 'No products match your search criteria.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {filteredProducts.map(product => (
            <AdminProductCard
              key={product.id}
              product={product}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleAvailability={handleToggleAvailability}
            />
          ))}
        </div>
      )}

      {/* Product Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false)
          setSelectedProduct(null)
        }}
        onSave={handleSaveProduct}
        product={selectedProduct}
        existingCategories={categories.filter(c => c !== 'all')}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setSelectedProduct(null)
        }}
        onConfirm={handleConfirmDelete}
        productName={selectedProduct?.name || ''}
      />
    </div>
  )
}
