'use client'

import { useState, useEffect } from 'react'
import { Product } from '@/types'
import AnnouncementBar from './AnnouncementBar'
import Header from './Header'
import Hero from './Hero'
import MenuSection from './MenuSection'
import Footer from './Footer'
import OrderModal from './OrderModal'
import CheckoutPanel from './CheckoutPanel'

interface HomeClientProps {
  products: Product[]
}

export default function HomeClient({ products }: HomeClientProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)

  useEffect(() => {
    // Wait until the hero nav overlay has scrolled out of view (~150px)
    // before sliding the fixed header in
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 150)
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
    <div className="min-h-screen bg-white">
      <Header visible={isScrolled} />
      <AnnouncementBar />
      <Hero />
      <div id="menu">
        <MenuSection products={products} onOrderProduct={handleOrderProduct} />
      </div>
      <Footer />

      <OrderModal
        product={selectedProduct}
        isOpen={isOrderModalOpen}
        onClose={handleCloseOrderModal}
      />
      <CheckoutPanel />
    </div>
  )
}
