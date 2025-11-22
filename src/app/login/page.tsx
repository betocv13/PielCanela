'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // TODO: Implement actual authentication
    try {
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // For now, just log the attempt
      console.log('Login attempt:', { email })

      // Show placeholder message
      setError('Authentication not yet implemented')
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col">
      {/* Header */}
      <header className="p-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-brand-brown hover:text-brand-pink transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Login Form Container */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-heading text-brand-brown mb-2">
              PIEL CANELA
            </h1>
            <p className="text-brand-brown/70">Sign in to your account</p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-card shadow-card p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="label">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="Enter your email"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="label">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Error Message */}
              {error && (
                <p className="text-red-600 text-sm">{error}</p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-brand-brown text-white py-3 px-4 rounded-button font-semibold
                         hover:bg-brand-brown/90 transition-colors duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            {/* Additional Options */}
            <div className="space-y-3">
              <p className="text-center text-sm text-gray-600">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  className="text-brand-brown font-medium hover:text-brand-pink transition-colors"
                  onClick={() => setError('Registration not yet implemented')}
                >
                  Sign up
                </button>
              </p>
              <p className="text-center text-sm">
                <button
                  type="button"
                  className="text-brand-brown font-medium hover:text-brand-pink transition-colors"
                  onClick={() => setError('Password reset not yet implemented')}
                >
                  Forgot your password?
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
