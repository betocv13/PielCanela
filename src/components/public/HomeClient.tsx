'use client'

import { useState, useEffect } from 'react'
import { Product } from '@/types'
import Header from './Header'
import Hero from './Hero'
import MenuSection from './MenuSection'
import Footer from './Footer'
import OrderModal from './OrderModal'
import CartDrawer from './CartDrawer'

interface HomeClientProps {
  products: Product[]
}

export default function HomeClient({ products }: HomeClientProps) {
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
      <Footer />

      {/* Order Modal */}
      <OrderModal
        product={selectedProduct}
        isOpen={isOrderModalOpen}
        onClose={handleCloseOrderModal}
      />

      {/* Cart Drawer */}
      <CartDrawer />
    </div>
  )
}
