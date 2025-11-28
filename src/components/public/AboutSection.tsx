'use client'

import { AboutItem } from '@/types'
import Image from 'next/image'
import { useState } from 'react'

interface AboutSectionProps {
  items: AboutItem[]
}

export default function AboutSection({ items }: AboutSectionProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Don't render if no items
  if (items.length === 0) {
    return null
  }

  // Sort items by display_order
  const sortedItems = [...items].sort((a, b) => a.display_order - b.display_order)

  return (
    <section className="py-16 md:py-20 bg-brand-beige">
      <div className="container-custom">
        {/* Header Section - Stacked on mobile, two columns on desktop */}
        <div className="flex flex-col md:grid md:grid-cols-2 gap-6 md:gap-8 mb-12 md:mb-16">
          {/* Heading */}
          <div>
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-heading text-brand-brown leading-tight">
              HECHO CON AMOR
            </h2>
          </div>

          {/* Subtitle Text */}
          <div>
            <p className="text-base md:text-xl text-brand-brown/80 leading-relaxed">
              Cafe y Matcha, pero con un toque Mexicano. 100% confident you&apos;ll love every single one!
            </p>
          </div>
        </div>

        {/* Mobile: Horizontal Scroll */}
        <div className="md:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
          <div className="flex gap-4 pb-4">
            {sortedItems.map((item, index) => (
              <div
                key={item.id}
                className="relative flex-shrink-0 w-[280px] overflow-hidden rounded-card aspect-[3/4] cursor-pointer"
                onTouchStart={() => setHoveredIndex(index)}
                onTouchEnd={() => setHoveredIndex(null)}
              >
                {/* Image */}
                <Image
                  src={item.image_url}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-300"
                  sizes="280px"
                />

                {/* Brown Overlay - appears on touch */}
                <div
                  className={`absolute inset-0 bg-brand-brown/70 transition-opacity duration-300 ${
                    hoveredIndex === index ? 'opacity-100' : 'opacity-0'
                  }`}
                />

                {/* Text Content Overlay */}
                <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                  {/* Title - always visible */}
                  <h3 className="text-2xl font-heading mb-2 relative z-10">
                    {item.title}
                  </h3>

                  {/* Description - appears on touch */}
                  <p
                    className={`text-sm transition-all duration-300 relative z-10 ${
                      hoveredIndex === index
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-4'
                    }`}
                  >
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop/Tablet: Grid Layout */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sortedItems.map((item, index) => (
            <div
              key={item.id}
              className="relative group overflow-hidden rounded-card aspect-[3/4] cursor-pointer"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Image */}
              <Image
                src={item.image_url}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
                sizes="(max-width: 1024px) 50vw, 25vw"
              />

              {/* Brown Overlay - appears on hover */}
              <div
                className={`absolute inset-0 bg-brand-brown/70 transition-opacity duration-300 ${
                  hoveredIndex === index ? 'opacity-100' : 'opacity-0'
                }`}
              />

              {/* Text Content Overlay */}
              <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                {/* Title - always visible */}
                <h3 className="text-2xl md:text-3xl font-heading mb-2 relative z-10">
                  {item.title}
                </h3>

                {/* Description - appears on hover */}
                <p
                  className={`text-sm md:text-base transition-all duration-300 relative z-10 ${
                    hoveredIndex === index
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-4'
                  }`}
                >
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
