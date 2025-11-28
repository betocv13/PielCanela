'use client'

import { useState, useEffect } from 'react'
import { Product, AboutItem } from '@/types'
import Header from './Header'
import Hero from './Hero'
import MenuSection from './MenuSection'
import AboutSection from './AboutSection'
import Footer from './Footer'
import OrderModal from './OrderModal'
import CheckoutPanel from './CheckoutPanel'

interface HomeClientProps {
  products: Product[]
  aboutItems: AboutItem[]
}

export default function HomeClient({ products, aboutItems }: HomeClientProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)

  // Track scroll position for header transparency
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleOrderProduct = (product: Product) => {
    setSelectedProduct(product)
    setIsOrderModalOpen(true)
  }

  const handleCloseOrderModal = () => {
    setIsOrderModalOpen(false)
    setSelectedProduct(null)
  }

  return (
    <div className="min-h-screen">
      <Header transparent={!isScrolled} />
      <Hero />
      <MenuSection products={products} onOrderProduct={handleOrderProduct} />
      <AboutSection items={aboutItems} />
      <Footer />

      {/* Order Modal */}
      <OrderModal
        product={selectedProduct}
        isOpen={isOrderModalOpen}
        onClose={handleCloseOrderModal}
      />

      {/* Checkout Panel */}
      <CheckoutPanel />
    </div>
  )
}
