'use client'

import { useEffect, useRef, useState } from 'react'
import { Banknote, CreditCard, Loader2 } from 'lucide-react'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { stripePromise } from '@/lib/stripe'
import { formatPrice } from '@/lib/utils'

interface StripePaymentFormProps {
  isReadyToConfirm: boolean
  onPaymentSuccess: () => void
  onPaymentError: (message: string) => void
}

function StripePaymentForm({ isReadyToConfirm, onPaymentSuccess, onPaymentError }: StripePaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)

  // Refs keep callbacks current without triggering the confirm effect
  const onSuccessRef = useRef(onPaymentSuccess)
  const onErrorRef = useRef(onPaymentError)
  useEffect(() => { onSuccessRef.current = onPaymentSuccess }, [onPaymentSuccess])
  useEffect(() => { onErrorRef.current = onPaymentError }, [onPaymentError])

  useEffect(() => {
    if (!isReadyToConfirm || !stripe || !elements) return

    let isMounted = true

    const confirm = async () => {
      setIsProcessing(true)

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.href },
        redirect: 'if_required',
      })

      if (!isMounted) return

      setIsProcessing(false)

      if (error) {
        onErrorRef.current(error.message ?? 'Payment failed. Please try again.')
      } else {
        onSuccessRef.current()
      }
    }

    confirm()

    return () => {
      isMounted = false
    }
  }, [isReadyToConfirm, stripe, elements])

  return (
    <div className={isProcessing ? 'opacity-50 pointer-events-none' : ''}>
      <PaymentElement options={{ layout: 'tabs' }} />
      {isProcessing && (
        <div className="flex items-center justify-center gap-2 mt-3 text-sm text-brand-brown/70">
          <Loader2 className="w-4 h-4 animate-spin" />
          Processing payment...
        </div>
      )}
    </div>
  )
}

interface PaymentOptionsProps {
  selectedMethod: 'cash' | 'stripe' | null
  onSelect: (method: 'cash' | 'stripe') => void
  total: number
  clientSecret: string | null
  isReadyToConfirm: boolean
  onPaymentSuccess: () => void
  onPaymentError: (message: string) => void
}

export default function PaymentOptions({
  selectedMethod,
  onSelect,
  total,
  clientSecret,
  isReadyToConfirm,
  onPaymentSuccess,
  onPaymentError,
}: PaymentOptionsProps) {
  const paymentMethods = [
    {
      id: 'cash' as const,
      name: 'Cash',
      description: 'Pay when you pick up',
      icon: Banknote,
      color: 'text-green-600',
    },
    {
      id: 'stripe' as const,
      name: 'Card',
      description: 'Pay securely by card',
      icon: CreditCard,
      color: 'text-blue-500',
    },
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-menu font-bold text-brand-brown">Payment Method</h3>

      <div className="grid grid-cols-2 gap-3">
        {paymentMethods.map((method) => {
          const Icon = method.icon
          const isSelected = selectedMethod === method.id

          return (
            <button
              key={method.id}
              type="button"
              onClick={() => onSelect(method.id)}
              className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all text-center ${
                isSelected
                  ? 'border-brand-brown bg-brand-cream'
                  : 'border-gray-200 hover:border-brand-brown/50'
              }`}
            >
              <div className={`p-2 rounded-lg bg-gray-100 ${method.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <p className="font-menu font-bold text-brand-brown text-sm">{method.name}</p>
            </button>
          )
        })}
      </div>

      {selectedMethod === 'cash' && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-menu font-bold text-gray-800 mb-2">Cash Payment</h4>
          <p className="text-sm text-gray-600">
            Bring exact change if possible. Payment is due at pickup.
          </p>
          <p className="text-lg font-semibold text-brand-brown mt-2">
            Total due: {formatPrice(total)}
          </p>
        </div>
      )}

      {selectedMethod === 'stripe' && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          {clientSecret ? (
            <Elements
              stripe={stripePromise}
              options={{ clientSecret, appearance: { theme: 'stripe' } }}
            >
              <StripePaymentForm
                isReadyToConfirm={isReadyToConfirm}
                onPaymentSuccess={onPaymentSuccess}
                onPaymentError={onPaymentError}
              />
            </Elements>
          ) : (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-brand-brown/60">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading payment form...
            </div>
          )}
        </div>
      )}
    </div>
  )
}
