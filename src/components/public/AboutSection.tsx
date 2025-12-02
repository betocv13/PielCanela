'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface AboutItem {
  id: string
  title: string
  description: string
  image_url: string
  display_order: number
  active: boolean
}

export default function AboutSection() {
  const [items, setItems] = useState<AboutItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    async function fetchAboutItems() {
      try {
        const response = await fetch('/api/about-items')
        if (response.ok) {
          const data = await response.json()
          setItems(data.items || [])
        }
      } catch (error) {
        console.error('Failed to fetch about items:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAboutItems()
  }, [])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % items.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + items.length) % items.length)
  }

  if (loading || items.length === 0) {
    return null
  }

  return (
    <section className="py-16 px-4 bg-brand-cream">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading text-brand-brown mb-4">
            Plant Protein to fuel your Body and Soul...
          </h2>
          <p className="text-lg md:text-xl text-brand-brown/80 max-w-3xl mx-auto">
            The creamiest smoothies are in your future! We've perfected our flavors and we are 100% confident you'll love every single one!
          </p>
        </div>

        {/* Desktop Grid - Hidden on mobile */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="relative aspect-square rounded-xl overflow-hidden group"
            >
              <Image
                src={item.image_url}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/20 transition-opacity duration-300 group-hover:bg-black/30" />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <h3 className="text-white text-2xl font-heading font-bold mb-2 drop-shadow-lg">
                  {item.title}
                </h3>
                <p className="text-white text-sm drop-shadow-lg opacity-90">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Carousel */}
        <div className="md:hidden relative">
          <div className="relative aspect-square rounded-xl overflow-hidden">
            <Image
              src={items[currentSlide].image_url}
              alt={items[currentSlide].title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <h3 className="text-white text-3xl font-heading font-bold mb-3 drop-shadow-lg">
                {items[currentSlide].title}
              </h3>
              <p className="text-white text-base drop-shadow-lg opacity-90">
                {items[currentSlide].description}
              </p>
            </div>
          </div>

          {/* Carousel Controls */}
          {items.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-brand-brown rounded-full p-2 shadow-lg transition-colors"
                aria-label="Previous item"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-brand-brown rounded-full p-2 shadow-lg transition-colors"
                aria-label="Next item"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              {/* Dots Indicator */}
              <div className="flex justify-center gap-2 mt-4">
                {items.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentSlide
                        ? 'bg-brand-brown w-6'
                        : 'bg-brand-brown/30'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
