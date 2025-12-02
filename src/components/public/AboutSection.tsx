'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

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
  const scrollContainerRef = useRef<HTMLDivElement>(null)

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

  // Update currentSlide based on scroll position
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft
      const itemWidth = container.offsetWidth
      const newSlide = Math.round(scrollLeft / itemWidth)
      setCurrentSlide(newSlide)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  if (loading || items.length === 0) {
    return null
  }

  return (
    <section className="py-16 px-4 bg-brand-cream">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-8">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading text-brand-brown md:flex-1">
              Cafe Y Matcha con un toque Mexicano
            </h2>
            <p className="text-base md:text-lg text-brand-brown/80 md:flex-1">
              Experience the perfect blend of traditional Mexican flavors with artisan coffee and matcha. Each drink is handcrafted with love, combining authentic ingredients to create a unique taste that celebrates our heritage. Delicious, authentic, and unforgettable.
            </p>
          </div>
        </div>

        {/* Desktop Grid - Hidden on mobile */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="relative aspect-[4/5] rounded-xl overflow-hidden group cursor-pointer"
            >
              <Image
                src={item.image_url}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-transparent transition-colors duration-300 group-hover:bg-brand-brown/50" />
              <div className="absolute bottom-0 left-0 p-6 text-left">
                <h3 className="text-white text-xl font-heading font-bold mb-2 drop-shadow-lg">
                  {item.title}
                </h3>
                <p className="text-white text-sm drop-shadow-lg opacity-90">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Swipeable Row */}
        <div className="md:hidden">
          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {items.map((item) => (
              <div
                key={item.id}
                className="relative flex-shrink-0 w-full aspect-[4/5] rounded-xl overflow-hidden snap-start"
              >
                <Image
                  src={item.image_url}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute bottom-0 left-0 p-6 text-left">
                  <h3 className="text-white text-xl font-heading font-bold mb-2 drop-shadow-lg">
                    {item.title}
                  </h3>
                  <p className="text-white text-sm drop-shadow-lg opacity-90">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Dots Indicator */}
          {items.length > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {items.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentSlide
                      ? 'bg-brand-brown w-6'
                      : 'bg-brand-brown/30'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
