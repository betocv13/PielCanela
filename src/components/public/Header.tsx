'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, ShoppingCart } from 'lucide-react'
import { useCart } from '@/components/providers/CartProvider'

interface HeaderProps {
  transparent?: boolean
}

export default function Header({ transparent = false }: HeaderProps) {
  const { totalItems, setIsCartOpen } = useCart()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const linkClass = `font-nav text-[11px] font-bold tracking-[0.14em] uppercase transition-colors duration-200 ${
    transparent
      ? 'text-white hover:text-white/70'
      : 'text-brand-brown hover:text-brand-pink'
  }`

  const logoClass = `font-heading text-2xl tracking-wider ${
    transparent ? 'text-white' : 'text-brand-brown'
  }`

  return (
    <header
      className={`fixed top-9 left-0 right-0 z-50 transition-colors duration-300 ${
        transparent ? 'bg-transparent' : 'bg-white/95 backdrop-blur-sm shadow-sm'
      }`}
    >
      {/* Desktop nav — 3 columns */}
      <nav className="hidden md:grid grid-cols-3 items-center h-20 px-8 lg:px-12">
        {/* Left: links */}
        <div className="flex items-center gap-7">
          <Link href="#menu" className={linkClass}>Shop</Link>
          <Link href="/about" className={linkClass}>About</Link>
          <Link href="/socials" className={linkClass}>Socials</Link>
        </div>

        {/* Center: wordmark */}
        <div className="flex justify-center">
          <Link href="/" className={logoClass}>
            PIEL CANELA
          </Link>
        </div>

        {/* Right: account + cart */}
        <div className="flex items-center gap-7 justify-end">
          <Link href="/login" className={linkClass}>Account</Link>
          <button
            onClick={() => setIsCartOpen(true)}
            className={linkClass}
            aria-label="Open cart"
          >
            Cart ({totalItems})
          </button>
        </div>
      </nav>

      {/* Mobile nav */}
      <div className="md:hidden flex items-center justify-between h-16 px-5">
        {/* Hamburger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`p-1 transition-colors ${transparent ? 'text-white' : 'text-brand-brown'}`}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Logo */}
        <Link href="/" className={logoClass}>
          PIEL CANELA
        </Link>

        {/* Cart icon */}
        <button
          onClick={() => setIsCartOpen(true)}
          className={`p-1 relative transition-colors ${transparent ? 'text-white' : 'text-brand-brown'}`}
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
        <div
          className={`md:hidden flex flex-col gap-5 px-6 py-5 border-t ${
            transparent
              ? 'bg-black/75 backdrop-blur-sm border-white/10'
              : 'bg-white border-gray-100'
          }`}
        >
          <Link href="#menu" className={linkClass} onClick={() => setMobileMenuOpen(false)}>Shop</Link>
          <Link href="/about" className={linkClass} onClick={() => setMobileMenuOpen(false)}>About</Link>
          <Link href="/socials" className={linkClass} onClick={() => setMobileMenuOpen(false)}>Socials</Link>
          <Link href="/login" className={linkClass} onClick={() => setMobileMenuOpen(false)}>Account</Link>
        </div>
      )}
    </header>
  )
}
