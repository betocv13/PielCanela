import Link from 'next/link'
import { Instagram, Facebook } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-brand-beige">
      {/* Main Footer */}
      <div className="container-custom py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="text-2xl">☕</span>
            <span className="font-heading text-brand-brown text-xl">PC</span>
          </div>

          {/* Newsletter / Contact */}
          <div className="text-center">
            <p className="font-semibold text-brand-brown mb-3">Stay Updated</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-4 py-2 border border-brand-brown/30 rounded-button text-sm focus:outline-none focus:border-brand-brown"
              />
              <button className="px-4 py-2 bg-brand-brown text-white rounded-button text-sm font-medium hover:bg-brand-brown/90 transition-colors">
                Sign Up
              </button>
            </div>
            <Link
              href="/contact"
              className="inline-block mt-3 text-sm text-brand-brown underline hover:text-brand-pink"
            >
              Questions? Contact Us
            </Link>
          </div>

          {/* Social Links */}
          <div className="flex gap-4">
            <a
              href="https://instagram.com/pielcanelacoffee"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-white rounded-full text-brand-brown hover:bg-brand-brown hover:text-white transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="https://facebook.com/pielcanelacoffee"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-white rounded-full text-brand-brown hover:bg-brand-brown hover:text-white transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-brand-brown/20">
        <div className="container-custom py-4">
          <p className="text-center text-sm text-brand-brown/70">
            &copy; {currentYear} Piel Canela Coffee. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
