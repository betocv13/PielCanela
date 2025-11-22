'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Banknote, Smartphone, ExternalLink } from 'lucide-react'
import { generateVenmoLink, generateCashAppLink, formatPrice } from '@/lib/utils'

interface PaymentOptionsProps {
  selectedMethod: 'cash' | 'venmo' | 'cashapp' | null
  onSelect: (method: 'cash' | 'venmo' | 'cashapp') => void
  orderNumber?: string
  total?: number
}

interface PaymentSettings {
  venmo_username: string
  cashapp_username: string
  venmo_qr_url: string
  cashapp_qr_url: string
}

export default function PaymentOptions({
  selectedMethod,
  onSelect,
  orderNumber,
  total
}: PaymentOptionsProps) {
  const [settings, setSettings] = useState<PaymentSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings')
        if (res.ok) {
          const data = await res.json()
          setSettings({
            venmo_username: data.settings.venmo_username || '',
            cashapp_username: data.settings.cashapp_username || '',
            venmo_qr_url: data.settings.venmo_qr_url || '',
            cashapp_qr_url: data.settings.cashapp_qr_url || ''
          })
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const paymentMethods = [
    {
      id: 'cash' as const,
      name: 'Cash',
      description: 'Pay when you pick up',
      icon: Banknote,
      color: 'text-green-600'
    },
    {
      id: 'venmo' as const,
      name: 'Venmo',
      description: 'Pay via Venmo app',
      icon: Smartphone,
      color: 'text-blue-500'
    },
    {
      id: 'cashapp' as const,
      name: 'Cash App',
      description: 'Pay via Cash App',
      icon: Smartphone,
      color: 'text-green-500'
    }
  ]

  // Generate payment links
  const venmoLinks = settings && orderNumber && total
    ? generateVenmoLink(settings.venmo_username, total, orderNumber)
    : null

  const cashappLink = settings && total
    ? generateCashAppLink(settings.cashapp_username, total)
    : null

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-heading text-brand-brown">Payment Method</h3>

      {/* Payment method selection */}
      <div className="grid gap-3">
        {paymentMethods.map((method) => {
          const Icon = method.icon
          const isSelected = selectedMethod === method.id

          return (
            <button
              key={method.id}
              type="button"
              onClick={() => onSelect(method.id)}
              className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left ${
                isSelected
                  ? 'border-brand-brown bg-brand-cream'
                  : 'border-gray-200 hover:border-brand-brown/50'
              }`}
            >
              <div className={`p-2 rounded-lg bg-gray-100 ${method.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-brand-brown">{method.name}</p>
                <p className="text-sm text-brand-brown/60">{method.description}</p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 ${
                  isSelected
                    ? 'border-brand-brown bg-brand-brown'
                    : 'border-gray-300'
                }`}
              >
                {isSelected && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Payment details for selected method */}
      {selectedMethod === 'venmo' && settings && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h4 className="font-medium text-blue-800 mb-3">Venmo Payment</h4>

          {settings.venmo_qr_url && (
            <div className="flex justify-center mb-4">
              <Image
                src={settings.venmo_qr_url}
                alt="Venmo QR Code"
                width={180}
                height={180}
                className="rounded-lg"
              />
            </div>
          )}

          <p className="text-sm text-blue-700 mb-2">
            Send <strong>{total ? formatPrice(total) : ''}</strong> to{' '}
            <strong>{settings.venmo_username}</strong>
          </p>

          {orderNumber && (
            <p className="text-xs text-blue-600 mb-3">
              Include &quot;Order-{orderNumber}&quot; in the note
            </p>
          )}

          {venmoLinks && (
            <div className="space-y-2">
              <a
                href={venmoLinks.deepLink}
                className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Smartphone className="w-4 h-4" />
                Open Venmo App
              </a>
              <a
                href={venmoLinks.webLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2 px-4 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Open in Browser
              </a>
            </div>
          )}
        </div>
      )}

      {selectedMethod === 'cashapp' && settings && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-100">
          <h4 className="font-medium text-green-800 mb-3">Cash App Payment</h4>

          {settings.cashapp_qr_url && (
            <div className="flex justify-center mb-4">
              <Image
                src={settings.cashapp_qr_url}
                alt="Cash App QR Code"
                width={180}
                height={180}
                className="rounded-lg"
              />
            </div>
          )}

          <p className="text-sm text-green-700 mb-3">
            Send <strong>{total ? formatPrice(total) : ''}</strong> to{' '}
            <strong>{settings.cashapp_username}</strong>
          </p>

          {cashappLink && (
            <a
              href={cashappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open Cash App
            </a>
          )}
        </div>
      )}

      {selectedMethod === 'cash' && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-800 mb-2">Cash Payment</h4>
          <p className="text-sm text-gray-600">
            Please bring exact change if possible. Payment is due at pickup.
          </p>
          {total && (
            <p className="text-lg font-semibold text-brand-brown mt-2">
              Total due: {formatPrice(total)}
            </p>
          )}
        </div>
      )}

      {loading && (
        <div className="text-center text-sm text-gray-500 py-4">
          Loading payment options...
        </div>
      )}
    </div>
  )
}
