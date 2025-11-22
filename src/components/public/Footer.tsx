import Link from 'next/link'
import Image from 'next/image'
import { Instagram, Facebook } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-brand-beige">
      {/* Main Footer */}
      <div className="container-custom py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center">
            <Image
              src="/images/footerlogo.png"
              alt="Piel Canela Coffee"
              width={120}
              height={60}
              className="h-12 w-auto"
            />
          </div>

          {/* Newsletter / Contact */}
          <div className="text-center">
            <p className="font-semibold text-brand-brown mb-3">Stay Updated</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-4 py-2 border border-brand-brown/30 rounded-button text-sm focus:outline-none focus:border-brand-pink focus:ring-1 focus:ring-brand-pink"
              />
              <button className="px-4 py-2 bg-brand-pink text-white rounded-button text-sm font-medium hover:bg-brand-pink/90 transition-colors">
                Sign Up
              </button>
            </div>
            <Link
              href="/contact"
              className="inline-block mt-3 text-sm text-brand-brown hover:text-brand-pink transition-colors"
            >
              Questions? Contact Us
            </Link>
          </div>

          {/* Social Links */}
          <div className="flex gap-4">
            <a
              href="https://www.instagram.com/pielcanela.coffee/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-white rounded-full text-brand-brown hover:bg-brand-pink hover:text-white transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=100091097307540"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-white rounded-full text-brand-brown hover:bg-brand-pink hover:text-white transition-colors"
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
