'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Menu, X, ShoppingCart } from 'lucide-react'
import { useCart } from '@/components/providers/CartProvider'

// Announcement bar: mt-3 (12px) + h-10 (40px) = 52px from page top.
// When at-top, we offset the fixed nav by exactly this amount so it sits
// just below the bar — perfectly flush with the start of the hero image.
const ANNOUNCEMENT_BOTTOM = 52

export default function Hero() {
  const { totalItems, setIsCartOpen } = useCart()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [navVisible, setNavVisible] = useState(true)
  const [atTop, setAtTop] = useState(true)
  const lastScrollY = useRef(0)

  useEffect(() => {
    lastScrollY.current = window.scrollY
    setAtTop(window.scrollY < ANNOUNCEMENT_BOTTOM)

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const delta = currentScrollY - lastScrollY.current
      const nowAtTop = currentScrollY < ANNOUNCEMENT_BOTTOM

      setAtTop(nowAtTop)

      if (nowAtTop) {
        // Always visible at the very top of the page
        setNavVisible(true)
      } else if (Math.abs(delta) < 5) {
        // Ignore micro-movements (iOS bounce, trackpad jitter)
      } else if (delta > 0) {
        // Scrolling down — hide
        setNavVisible(false)
        setMobileMenuOpen(false)
      } else {
        // Scrolling up — show
        setNavVisible(true)
      }

      lastScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Transform logic:
  //   atTop        → translateY(52px): nav appears within hero, below announcement bar
  //   visible+scrolled → translateY(0): docked at viewport top with brown bg
  //   hidden       → translateY(-100%): slid off screen upward
  const hidden = !atTop && !navVisible
  const transform = hidden
    ? 'translateY(-100%)'
    : atTop
      ? `translateY(${ANNOUNCEMENT_BOTTOM}px)`
      : 'translateY(0)'

  const navLinkClass =
    'font-nav text-[11px] font-bold tracking-[0.14em] uppercase text-white hover:text-white/70 transition-colors duration-200'

  return (
    <>
      {/*
        Fixed nav — lives outside the hero container so scroll works across
        the entire page, not just while the hero is in the viewport.

        Two visual states:
          atTop    → transparent bg, no radius — overlaid on hero image
          scrolled → #3B1F0F bg, rounded top corners — drops in from viewport top
      */}
      <div
        className={`fixed top-0 z-50 hero-nav ${atTop ? 'hero-nav-at-top' : 'hero-nav-scrolled'}`}
        style={{ transform }}
      >
        {/* Desktop — 3-column grid */}
        <nav className="relative z-[1] hidden md:grid grid-cols-3 items-center h-20 px-8 lg:px-12">
          <div className="flex items-center gap-7">
            <Link href="#menu" className={navLinkClass}>Shop</Link>
            <Link href="#" className={navLinkClass}>About</Link>
            <Link href="#" className={navLinkClass}>Socials</Link>
          </div>

          <div className="flex justify-center">
            <Link href="/" className="font-heading text-lg md:text-xl tracking-wider text-white whitespace-nowrap">
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

        {/* Mobile bar */}
        <div className="relative z-[1] md:hidden flex items-center justify-between h-16 px-5">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1 text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/" className="font-heading text-base tracking-wider text-white whitespace-nowrap">
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
          <div className="relative z-[1] md:hidden flex flex-col gap-5 px-6 py-5 bg-[#3B1F0F] border-t border-white/10">
            <Link href="#menu" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>Shop</Link>
            <Link href="#" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>About</Link>
            <Link href="#" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>Socials</Link>
            <Link href="/login" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>Account</Link>
          </div>
        )}
      </div>

      {/* Hero image section */}
      <section className="bg-white content-inset pt-2 pb-6">
        <div className="relative rounded-[12px] overflow-hidden h-[85vh] md:h-[90vh]">
          <img
            src="/images/MobileUpdate.webp"
            alt="Piel Canela Coffee"
            className="object-cover md:hidden absolute inset-0 w-full h-full"
          />
          <img
            src="/images/DesktopUpdate.webp"
            alt="Piel Canela Coffee"
            className="object-cover hidden md:block absolute inset-0 w-full h-full"
          />

          {/* Gradient scrim — inside overflow-hidden so it's clipped to image bounds */}
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/30 to-transparent pointer-events-none z-[1]" />

          {/* Bottom-right overlay */}
          <div className="absolute bottom-7 right-6 md:bottom-10 md:right-10 text-right z-10">
            <p className="text-white text-[10px] md:text-[11px] font-bold tracking-[0.22em] uppercase mb-2 drop-shadow">
              Bienvenidos
            </p>
            <h1 className="text-white text-2xl md:text-4xl font-menu font-bold leading-tight mb-4 drop-shadow-lg">
              Café con Cultura
            </h1>
            <a
              href="#menu"
              className="inline-block border border-white text-white font-nav text-[11px] font-bold tracking-[0.14em] uppercase px-6 py-2 rounded-full hover:bg-white hover:text-brand-brown transition-colors duration-200"
            >
              Order Now
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
