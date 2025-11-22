'use client'

import { useState, useEffect } from 'react'
import { Product } from '@/types'
import Header from './Header'
import Hero from './Hero'
import MenuSection from './MenuSection'
import Footer from './Footer'

interface HomeClientProps {
  products: Product[]
}

export default function HomeClient({ products }: HomeClientProps) {
  const [isScrolled, setIsScrolled] = useState(false)

  // Track scroll position for header transparency
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleOrderProduct = (product: Product) => {
    // TODO: Open order customization modal
    console.log('Order product:', product.name)
  }

  return (
    <div className="min-h-screen">
      <Header transparent={!isScrolled} />
      <Hero />
      <MenuSection products={products} onOrderProduct={handleOrderProduct} />
      <Footer />
    </div>
  )
}
