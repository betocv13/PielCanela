'use client'

import { useState } from 'react'
import { Product } from '@/types'
import AnnouncementBar from './AnnouncementBar'
import Hero from './Hero'
import MenuSection from './MenuSection'
import Footer from './Footer'
import OrderModal from './OrderModal'
import CheckoutPanel from './CheckoutPanel'

interface HomeClientProps {
  products: Product[]
}

export default function HomeClient({ products }: HomeClientProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)

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
