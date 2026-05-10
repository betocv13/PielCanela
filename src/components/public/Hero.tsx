'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Menu, X, ShoppingCart } from 'lucide-react'
import { useCart } from '@/components/providers/CartProvider'

export default function Hero() {
  const { totalItems, setIsCartOpen } = useCart()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [navVisible, setNavVisible] = useState(true)
  const lastScrollY = useRef(0)

  useEffect(() => {
    lastScrollY.current = window.scrollY

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const delta = currentScrollY - lastScrollY.current

      // Ignore micro-movements (iOS bounce, etc.)
      if (Math.abs(delta) < 5) return

      if (delta > 0 && currentScrollY > 80) {
        // Scrolling down — hide nav, close mobile menu
        setNavVisible(false)
        setMobileMenuOpen(false)
      } else if (delta < 0) {
        // Scrolling up — show nav
        setNavVisible(true)
      }

      lastScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinkClass =
    'font-nav text-[11px] font-bold tracking-[0.14em] uppercase text-white hover:text-white/70 transition-colors duration-200'

  return (
    <section className="bg-white px-3 md:px-6 pt-2 pb-6">
      <div className="relative rounded-[20px] md:rounded-[24px] overflow-hidden h-[72vh] md:h-[78vh]">

        {/* Images */}
        <Image
          src="/images/Mobile.png"
          alt="Piel Canela Coffee"
          fill
          className="object-cover md:hidden"
          priority
          sizes="(max-width: 767px) 100vw, 0px"
        />
        <Image
          src="/images/BannerPink.png"
          alt="Piel Canela Coffee"
          fill
          className="object-cover hidden md:block"
          priority
          sizes="(min-width: 768px) 100vw, 0px"
        />

        {/*
          Nav wrapper — absolutely anchored to the top of the image container.
          translateY(-100%) slides it up into the overflow-hidden clip zone,
          so it disappears at the hero's top edge and never floats above it.
        */}
        <div
          className="absolute top-0 inset-x-0 z-10"
          style={{
            transform: navVisible ? 'translateY(0)' : 'translateY(-100%)',
            transition: 'transform 0.3s ease',
          }}
        >
          {/* Gradient scrim for text legibility */}
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />

          {/* Desktop nav — 3 columns */}
          <nav className="relative hidden md:grid grid-cols-3 items-center h-20 px-8 lg:px-12">
            <div className="flex items-center gap-7">
              <Link href="#menu" className={navLinkClass}>Shop</Link>
              <Link href="/about" className={navLinkClass}>About</Link>
              <Link href="/socials" className={navLinkClass}>Socials</Link>
            </div>

            <div className="flex justify-center">
              <Link href="/" className="font-heading text-2xl tracking-wider text-white">
                PIEL CANELA
              </Link>
            </div>

            <div className="flex items-center gap-7 justify-end">
              <Link href="/login" className={navLinkClass}>Account</Link>
              <button
                onClick={() => setIsCartOpen(true)}
                className={navLinkClass}
                aria-label="Open cart"
              >
                Cart ({totalItems})
              </button>
            </div>
          </nav>

          {/* Mobile nav bar */}
          <div className="relative md:hidden flex items-center justify-between h-16 px-5">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1 text-white"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/" className="font-heading text-xl tracking-wider text-white">
              PIEL CANELA
            </Link>

            <button
              onClick={() => setIsCartOpen(true)}
              className="p-1 relative text-white"
              aria-label="Shopping cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-pink text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </button>
          </div>

          {/* Mobile dropdown */}
          {mobileMenuOpen && (
            <div className="relative md:hidden flex flex-col gap-5 px-6 py-5 bg-black/70 backdrop-blur-sm border-t border-white/10">
              <Link href="#menu" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>Shop</Link>
              <Link href="/about" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>About</Link>
              <Link href="/socials" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>Socials</Link>
              <Link href="/login" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>Account</Link>
            </div>
          )}
        </div>

        {/* Bottom-right: hero text + CTA */}
        <div className="absolute bottom-7 right-6 md:bottom-10 md:right-10 text-right z-10">
          <p className="text-white text-[10px] md:text-[11px] font-bold tracking-[0.22em] uppercase mb-2 drop-shadow">
            Bienvenidos
          </p>
          <h1 className="text-white text-3xl md:text-5xl font-heading leading-tight mb-4 drop-shadow-lg">
            Un Toque Mexicano
          </h1>
          <a
            href="#menu"
            className="inline-block border border-white text-white font-nav text-[11px] font-bold tracking-[0.14em] uppercase px-7 py-3 rounded-full hover:bg-white hover:text-brand-brown transition-colors duration-200"
          >
            Order Now
          </a>
        </div>
      </div>
    </section>
  )
}
