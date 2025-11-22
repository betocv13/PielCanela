'use client'

import Link from 'next/link'
import { User, ShoppingCart } from 'lucide-react'
import { useCart } from '@/components/providers/CartProvider'

interface HeaderProps {
  transparent?: boolean
}

export default function Header({ transparent = false }: HeaderProps) {
  const { totalItems, setIsCartOpen } = useCart()

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
        transparent ? 'bg-transparent' : 'bg-brand-cream/95 backdrop-blur-sm shadow-sm'
      }`}
    >
      <div className="container-custom">
        <nav className="flex items-center justify-between h-16 md:h-20">
          {/* Logo / Brand Name */}
          <Link href="/" className="flex items-center">
            <span
              className={`text-xl md:text-2xl font-heading font-bold tracking-wide ${
                transparent ? 'text-white' : 'text-brand-brown'
              }`}
            >
              PIEL CANELA
            </span>
          </Link>

          {/* Right side icons */}
          <div className="flex items-center gap-4">
            {/* Account / Login */}
            <Link
              href="/login"
              className={`p-2 rounded-full transition-colors ${
                transparent
                  ? 'text-white hover:bg-white/20'
                  : 'text-brand-brown hover:bg-brand-brown/10'
              }`}
              aria-label="Account"
            >
              <User className="w-5 h-5 md:w-6 md:h-6" />
            </Link>

            {/* Cart */}
            <button
              onClick={() => setIsCartOpen(true)}
              className={`p-2 rounded-full transition-colors relative ${
                transparent
                  ? 'text-white hover:bg-white/20'
                  : 'text-brand-brown hover:bg-brand-brown/10'
              }`}
              aria-label="Shopping cart"
            >
              <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-pink text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </button>
          </div>
        </nav>
      </div>
    </header>
  )
}
