'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Product } from '@/types'
import ProductCard from './ProductCard'
import ProductCardSkeleton from './ProductCardSkeleton'

interface MenuSectionProps {
  products: Product[]
  onOrderProduct: (product: Product) => void
  loading?: boolean
}

const PRODUCTS_PER_PAGE = 6

export default function MenuSection({ products, onOrderProduct, loading = false }: MenuSectionProps) {
  // Dynamically derive categories from products
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(products.map(p => p.category)))

    // Sort categories alphabetically but keep common ones in a nice order
    const categoryOrder = ['coffee', 'matcha', 'other']
    uniqueCategories.sort((a, b) => {
      const aIndex = categoryOrder.indexOf(a.toLowerCase())
      const bIndex = categoryOrder.indexOf(b.toLowerCase())

      // If both are in the order list, sort by that order
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
      // If only a is in the list, it comes first
      if (aIndex !== -1) return -1
      // If only b is in the list, it comes first
      if (bIndex !== -1) return 1
      // Otherwise sort alphabetically
      return a.localeCompare(b)
    })

    // Build category objects with proper labels
    const categoryList = [
      { id: 'all', label: 'All Drinks' },
      ...uniqueCategories.map(cat => ({
        id: cat.toLowerCase(),
        label: cat.charAt(0).toUpperCase() + cat.slice(1)
      }))
    ]

    return categoryList
  }, [products])
  const [activeCategory, setActiveCategory] = useState('all')
  const [currentSlide, setCurrentSlide] = useState(0)
  const [displayCount, setDisplayCount] = useState(PRODUCTS_PER_PAGE)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Show skeleton loading when loading or products haven't loaded yet
  const isLoading = loading || products.length === 0

  // Filter products by category (case-insensitive)
  const filteredProducts = activeCategory === 'all'
    ? products
    : products.filter((p) => p.category.toLowerCase() === activeCategory.toLowerCase())

  // Reset slide and display count when category changes
  useEffect(() => {
    setCurrentSlide(0)
    setDisplayCount(PRODUCTS_PER_PAGE)
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' })
    }
  }, [activeCategory])

  // Handle View More click
  const handleViewMore = () => {
    setDisplayCount(filteredProducts.length)
  }

  // Handle scroll to update dot pagination
  const handleScroll = () => {
    if (!scrollContainerRef.current) return
    const container = scrollContainerRef.current
    const cardWidth = container.scrollWidth / filteredProducts.length
    const newSlide = Math.round(container.scrollLeft / cardWidth)
    setCurrentSlide(newSlide)
  }

  // Scroll to specific slide
  const scrollToSlide = (index: number) => {
    if (!scrollContainerRef.current) return
    const container = scrollContainerRef.current
    const cardWidth = container.scrollWidth / filteredProducts.length
    container.scrollTo({ left: cardWidth * index, behavior: 'smooth' })
  }

  return (
    <section className="py-12 md:py-16 bg-brand-cream">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-heading text-brand-brown mb-2">
            Menu
          </h2>
          <p className="text-brand-brown/70 italic">drinks</p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex overflow-x-auto md:flex-wrap md:justify-center gap-2 md:gap-3 mb-8 pb-2 md:pb-0 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeCategory === category.id
                  ? 'bg-brand-brown text-white'
                  : 'bg-white text-brand-brown border border-brand-brown/30 hover:border-brand-brown'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Desktop Grid - 2 rows x 3 cards */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? Array.from({ length: 6 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))
            : filteredProducts.slice(0, displayCount).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onOrder={onOrderProduct}
                />
              ))}
        </div>

        {/* Mobile Horizontal Scroll */}
        <div className="md:hidden">
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {isLoading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 w-[280px] snap-center"
                  >
                    <ProductCardSkeleton />
                  </div>
                ))
              : filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex-shrink-0 w-[280px] snap-center"
                  >
                    <ProductCard product={product} onOrder={onOrderProduct} />
                  </div>
                ))}
          </div>

          {/* Dot Pagination */}
          {!isLoading && filteredProducts.length > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {filteredProducts.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollToSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    currentSlide === index
                      ? 'bg-brand-brown w-4'
                      : 'bg-brand-brown/30'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* View More Button (only show if there are more products to load) */}
        {displayCount < filteredProducts.length && (
          <div className="hidden md:flex justify-center mt-8">
            <button
              onClick={handleViewMore}
              className="px-6 py-2.5 border-2 border-brand-brown text-brand-brown rounded-button font-medium hover:bg-brand-brown hover:text-white transition-colors"
            >
              View More
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
