'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, ShoppingCart } from 'lucide-react'
import { useCart } from '@/components/providers/CartProvider'

interface HeaderProps {
  visible?: boolean
}

export default function Header({ visible = false }: HeaderProps) {
  const { totalItems, setIsCartOpen } = useCart()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const linkClass =
    'font-nav text-[11px] font-bold tracking-[0.14em] uppercase text-brand-brown hover:text-brand-pink transition-colors duration-200'

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm
        transition-transform duration-300 ${visible ? 'translate-y-0' : '-translate-y-full'}`}
    >
      {/* Desktop nav — 3 columns */}
      <nav className="hidden md:grid grid-cols-3 items-center h-16 px-8 lg:px-12">
        <div className="flex items-center gap-7">
          <Link href="#menu" className={linkClass}>Shop</Link>
          <Link href="/about" className={linkClass}>About</Link>
          <Link href="/socials" className={linkClass}>Socials</Link>
        </div>

        <div className="flex justify-center">
          <Link href="/" className="font-heading text-xl tracking-wider text-brand-brown">
            PIEL CANELA
          </Link>
        </div>

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
      <div className="md:hidden flex items-center justify-between h-14 px-5">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1 text-brand-brown"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <Link href="/" className="font-heading text-lg tracking-wider text-brand-brown">
          PIEL CANELA
        </Link>

        <button
          onClick={() => setIsCartOpen(true)}
          className="p-1 relative text-brand-brown"
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
        <div className="md:hidden flex flex-col gap-5 px-6 py-5 border-t border-gray-100 bg-white">
          <Link href="#menu" className={linkClass} onClick={() => setMobileMenuOpen(false)}>Shop</Link>
          <Link href="/about" className={linkClass} onClick={() => setMobileMenuOpen(false)}>About</Link>
          <Link href="/socials" className={linkClass} onClick={() => setMobileMenuOpen(false)}>Socials</Link>
          <Link href="/login" className={linkClass} onClick={() => setMobileMenuOpen(false)}>Account</Link>
        </div>
      )}
    </header>
  )
}
