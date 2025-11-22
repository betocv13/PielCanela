'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, CheckCircle } from 'lucide-react'
import { useCart } from '@/components/providers/CartProvider'
import { formatPrice } from '@/lib/utils'
import PaymentOptions from './PaymentOptions'

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
}

interface AvailableSlot {
  date: string
  displayDate: string
  slots: string[]
}

export default function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const { items, subtotal, clearCart } = useCart()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  const [error, setError] = useState('')

  // Form state
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [pickupDate, setPickupDate] = useState('')
  const [pickupTime, setPickupTime] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'venmo' | 'cashapp' | null>(null)
  const [specialNotes, setSpecialNotes] = useState('')

  // Available time slots
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(true)

  // Tax calculation
  const [tax, setTax] = useState(0)
  const total = subtotal + tax

  // Fetch available time slots
  useEffect(() => {
    if (isOpen) {
      fetchAvailableSlots()
      fetchTaxRate()
    }
  }, [isOpen])

  const fetchAvailableSlots = async () => {
    setLoadingSlots(true)
    try {
      // Fetch next 7 days of available slots
      const slots: AvailableSlot[] = []
      const today = new Date()

      for (let i = 0; i < 7; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() + i)
        const dateStr = date.toISOString().split('T')[0]

        const res = await fetch(`/api/available-times?date=${dateStr}`)
        if (res.ok) {
          const data = await res.json()
          if (data.slots && data.slots.length > 0) {
            slots.push({
              date: dateStr,
              displayDate: date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              }),
              slots: data.slots
            })
          }
        }
      }

      setAvailableSlots(slots)
      if (slots.length > 0) {
        setPickupDate(slots[0].date)
        if (slots[0].slots.length > 0) {
          setPickupTime(slots[0].slots[0])
        }
      }
    } catch (err) {
      console.error('Error fetching slots:', err)
    } finally {
      setLoadingSlots(false)
    }
  }

  const fetchTaxRate = async () => {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        const taxRate = Number(data.settings.default_tax_rate) || 0
        setTax(subtotal * (taxRate / 100))
      }
    } catch (err) {
      console.error('Error fetching tax rate:', err)
    }
  }

  const handleSubmit = async () => {
    setError('')
    setLoading(true)

    try {
      const orderItems = items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        size: item.size,
        milk: item.milk,
        addons: item.addons,
        specialInstructions: item.specialInstructions,
        itemTotal: item.itemTotal
      }))

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail || undefined,
          items: orderItems,
          subtotal,
          total,
          payment_method: paymentMethod,
          pickup_date: pickupDate,
          pickup_time: pickupTime,
          special_notes: specialNotes || undefined
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order')
      }

      setOrderNumber(data.order.order_number)
      setOrderComplete(true)
      clearCart()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (orderComplete) {
      setStep(1)
      setOrderComplete(false)
      setOrderNumber('')
      setCustomerName('')
      setCustomerPhone('')
      setCustomerEmail('')
      setPickupDate('')
      setPickupTime('')
      setPaymentMethod(null)
      setSpecialNotes('')
    }
    onClose()
  }

  const selectedDateSlots = availableSlots.find(s => s.date === pickupDate)?.slots || []

  const canProceedStep1 = customerName && customerPhone && pickupDate && pickupTime
  const canProceedStep2 = paymentMethod !== null

  if (!isOpen) return null

  // Order complete screen
  if (orderComplete) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
        <div className="relative bg-white rounded-lg max-w-md w-full p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-heading text-brand-brown mb-2">Order Placed!</h2>
          <p className="text-gray-600 mb-4">
            Your order number is <strong>#{orderNumber}</strong>
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Please arrive at your selected pickup time. We&apos;ll have your order ready!
          </p>
          <button
            onClick={handleClose}
            className="w-full bg-brand-brown text-white py-3 px-4 rounded-button font-semibold
                       hover:bg-brand-brown/90 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      <div className="relative bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-xl font-heading text-brand-brown">
            {step === 1 ? 'Checkout' : 'Payment'}
          </h2>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Step 1: Contact & Pickup */}
        {step === 1 && (
          <div className="p-6 space-y-4">
            {/* Contact info */}
            <div>
              <label className="block text-sm font-medium text-brand-brown mb-1">
                Name *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-brown"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-brown mb-1">
                Phone *
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-brown"
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-brown mb-1">
                Email (optional)
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-brown"
                placeholder="email@example.com"
              />
            </div>

            {/* Pickup date/time */}
            <div>
              <label className="block text-sm font-medium text-brand-brown mb-1">
                Pickup Date *
              </label>
              {loadingSlots ? (
                <div className="p-3 text-center text-gray-500">Loading available times...</div>
              ) : availableSlots.length === 0 ? (
                <div className="p-3 text-center text-red-500">No available pickup times</div>
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.date}
                      onClick={() => {
                        setPickupDate(slot.date)
                        setPickupTime(slot.slots[0] || '')
                      }}
                      className={`flex-shrink-0 px-4 py-2 rounded-lg border-2 text-sm ${
                        pickupDate === slot.date
                          ? 'border-brand-brown bg-brand-cream'
                          : 'border-gray-200 hover:border-brand-brown/50'
                      }`}
                    >
                      {slot.displayDate}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedDateSlots.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-brand-brown mb-1">
                  Pickup Time *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {selectedDateSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => setPickupTime(time)}
                      className={`px-3 py-2 rounded-lg border-2 text-sm ${
                        pickupTime === time
                          ? 'border-brand-brown bg-brand-cream'
                          : 'border-gray-200 hover:border-brand-brown/50'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Special notes */}
            <div>
              <label className="block text-sm font-medium text-brand-brown mb-1">
                Special Notes (optional)
              </label>
              <textarea
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-brand-brown"
                rows={2}
                placeholder="Any special requests for your order"
              />
            </div>

            {/* Order summary */}
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span>Tax</span>
                <span>{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-brand-brown">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!canProceedStep1}
              className="w-full bg-brand-brown text-white py-3 px-4 rounded-button font-semibold
                         hover:bg-brand-brown/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Payment
            </button>
          </div>
        )}

        {/* Step 2: Payment */}
        {step === 2 && (
          <div className="p-6 space-y-4">
            <button
              onClick={() => setStep(1)}
              className="text-sm text-brand-brown hover:underline mb-2"
            >
              ← Back to details
            </button>

            <PaymentOptions
              selectedMethod={paymentMethod}
              onSelect={setPaymentMethod}
              orderNumber={orderNumber || 'pending'}
              total={total}
            />

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!canProceedStep2 || loading}
              className="w-full bg-brand-brown text-white py-3 px-4 rounded-button font-semibold
                         hover:bg-brand-brown/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Placing Order...
                </>
              ) : (
                `Place Order - ${formatPrice(total)}`
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
