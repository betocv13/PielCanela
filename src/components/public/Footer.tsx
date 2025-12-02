'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Instagram, Facebook } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      setStatus('error')
      setMessage('Please enter an email address')
      return
    }

    setStatus('loading')
    setMessage('')

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage('Successfully subscribed!')
        setEmail('')
        // Clear success message after 3 seconds
        setTimeout(() => {
          setStatus('idle')
          setMessage('')
        }, 3000)
      } else {
        setStatus('error')
        setMessage(data.error || 'Failed to subscribe')
        // Clear error message after 5 seconds
        setTimeout(() => {
          setStatus('idle')
          setMessage('')
        }, 5000)
      }
    } catch {
      setStatus('error')
      setMessage('An error occurred. Please try again.')
      setTimeout(() => {
        setStatus('idle')
        setMessage('')
      }, 5000)
    }
  }

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
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === 'loading'}
                className="px-4 py-2 border border-brand-brown/30 rounded-button text-sm focus:outline-none focus:border-brand-pink focus:ring-1 focus:ring-brand-pink disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="px-4 py-2 bg-brand-pink text-white rounded-button text-sm font-medium hover:bg-brand-pink/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? 'Signing Up...' : 'Sign Up'}
              </button>
            </form>
            {message && (
              <p className={`mt-2 text-sm ${status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {message}
              </p>
            )}
            <a
              href="mailto:pielcanelacoffee@gmail.com"
              className="inline-block mt-3 text-sm text-brand-brown hover:text-brand-pink transition-colors"
            >
              Questions? Contact Us
            </a>
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
