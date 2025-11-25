'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X, Plus, Minus, Trash2, ShoppingBag, Loader2, CheckCircle, ChevronLeft, Banknote, Smartphone, ExternalLink } from 'lucide-react'
import { useCart } from '@/components/providers/CartProvider'
import { formatPrice, generateVenmoLink, generateCashAppLink } from '@/lib/utils'

interface AvailableSlot {
  date: string
  displayDate: string
  slots: string[]
}

interface PaymentSettings {
  venmo_username: string
  cashapp_username: string
  venmo_qr_url: string
  cashapp_qr_url: string
}

// Format 24-hour time to 12-hour format (e.g., "20:30" -> "8:30 PM")
const formatTime12Hour = (time: string): string => {
  const [hourStr, minuteStr] = time.split(':')
  let hour = parseInt(hourStr, 10)
  const minute = minuteStr || '00'
  const ampm = hour >= 12 ? 'PM' : 'AM'
  hour = hour % 12 || 12
  return minute === '00' ? `${hour} ${ampm}` : `${hour}:${minute} ${ampm}`
}

export default function CheckoutPanel() {
  const { items, removeItem, updateQuantity, isCartOpen, setIsCartOpen, subtotal, clearCart } = useCart()

  // Step state (1: Order, 2: Details, 3: Payment)
  const [step, setStep] = useState(1)

  // Order state
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

  // Payment settings for success screen
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null)

  // Store order total for confirmation screen (since cart gets cleared)
  const [orderTotal, setOrderTotal] = useState(0)

  // Lock body scroll when panel is open (works on iOS too)
  useEffect(() => {
    if (isCartOpen) {
      // Save current scroll position
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.left = '0'
      document.body.style.right = '0'
      document.body.style.overflow = 'hidden'
    } else {
      // Restore scroll position
      const scrollY = document.body.style.top
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.overflow = ''
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1)
      }
    }
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.overflow = ''
    }
  }, [isCartOpen])

  // Fetch payment settings when order is complete
  useEffect(() => {
    async function fetchPaymentSettings() {
      if (!orderComplete) return

      try {
        const res = await fetch('/api/settings')
        if (res.ok) {
          const data = await res.json()
          setPaymentSettings({
            venmo_username: data.settings.venmo_username || '',
            cashapp_username: data.settings.cashapp_username || '',
            venmo_qr_url: data.settings.venmo_qr_url || '',
            cashapp_qr_url: data.settings.cashapp_qr_url || ''
          })
        }
      } catch (error) {
        console.error('Error fetching payment settings:', error)
      }
    }

    fetchPaymentSettings()
  }, [orderComplete])

  const fetchAvailableSlots = useCallback(async () => {
    setLoadingSlots(true)
    try {
      // First fetch available pickup dates
      const pickupDatesRes = await fetch('/api/pickup-dates')
      if (!pickupDatesRes.ok) {
        setAvailableSlots([])
        return
      }

      const pickupDatesData = await pickupDatesRes.json()
      const pickupDates = pickupDatesData.dates || []

      if (pickupDates.length === 0) {
        setAvailableSlots([])
        return
      }

      // Fetch available time slots for each pickup date
      const slots: AvailableSlot[] = []

      for (const pickupDate of pickupDates) {
        const dateStr = pickupDate.date
        const res = await fetch(`/api/orders/available-slots?date=${dateStr}`)
        if (res.ok) {
          const data = await res.json()
          if (data.slots && data.slots.length > 0) {
            const date = new Date(dateStr + 'T00:00:00')
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
      if (slots.length > 0 && !pickupDate) {
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
  }, [pickupDate])

  const fetchTaxRate = useCallback(async () => {
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
  }, [subtotal])

  // Fetch available time slots when panel opens
  useEffect(() => {
    if (isCartOpen && items.length > 0) {
      fetchAvailableSlots()
      fetchTaxRate()
    }
  }, [isCartOpen, items.length, fetchAvailableSlots, fetchTaxRate])

  // Update tax when subtotal changes
  useEffect(() => {
    if (tax > 0) {
      fetchTaxRate()
    }
  }, [subtotal, fetchTaxRate, tax])

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

      // Save order total before clearing cart (to display on success screen)
      setOrderTotal(total)
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
      setOrderTotal(0)
      setCustomerName('')
      setCustomerPhone('')
      setCustomerEmail('')
      setPickupDate('')
      setPickupTime('')
      setPaymentMethod(null)
      setSpecialNotes('')
      setError('')
    }
    setIsCartOpen(false)
  }

  const selectedDateSlots = availableSlots.find(s => s.date === pickupDate)?.slots || []

  // Validation for each step
  const canProceedStep1 = items.length > 0
  const canProceedStep2 = customerName && customerPhone && pickupDate && pickupTime
  const canPlaceOrder = canProceedStep2 && paymentMethod !== null

  // Step titles
  const stepTitles = ['Your Order', 'Pickup Details', 'Payment']

  if (!isCartOpen) return null

  // Order complete screen
  if (orderComplete) {
    // Generate payment links
    const venmoLinks = paymentSettings && orderNumber && orderTotal
      ? generateVenmoLink(paymentSettings.venmo_username, orderTotal, orderNumber)
      : null

    const cashappLink = paymentSettings && orderTotal
      ? generateCashAppLink(paymentSettings.cashapp_username, orderTotal)
      : null

    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
        <div className="absolute right-0 top-0 h-full w-full md:max-w-lg bg-white shadow-xl flex flex-col overflow-y-auto">
          <div className="flex-1 p-8">
            {/* Success message */}
            <div className="text-center mb-8">
              <CheckCircle className="w-20 h-20 text-green-500 mb-6 mx-auto" />
              <h2 className="text-3xl font-body font-bold text-brand-brown mb-3">Order Placed!</h2>
              <p className="text-lg text-gray-600 mb-2">
                Your order number is
              </p>
              <p className="text-2xl font-bold text-brand-brown mb-4">
                #{orderNumber}
              </p>
              <p className="text-gray-500 max-w-sm mx-auto">
                Please arrive at your selected pickup time. We&apos;ll have your order ready!
              </p>
            </div>

            {/* Payment Information */}
            {paymentMethod && paymentSettings && (
              <div className="max-w-md mx-auto">
                {/* Venmo Payment */}
                {paymentMethod === 'venmo' && (
                  <div className="p-6 bg-blue-50 rounded-lg border border-blue-100">
                    <h3 className="font-body font-bold text-blue-800 mb-4 text-center text-lg">Complete Payment via Venmo</h3>

                    {paymentSettings.venmo_qr_url && (
                      <div className="flex justify-center mb-4">
                        <Image
                          src={paymentSettings.venmo_qr_url}
                          alt="Venmo QR Code"
                          width={200}
                          height={200}
                          className="rounded-lg"
                        />
                      </div>
                    )}

                    <div className="text-center mb-4">
                      <p className="text-sm text-blue-700 mb-2">
                        Send <strong className="text-lg">{formatPrice(orderTotal)}</strong> to
                      </p>
                      {venmoLinks && (
                        <a
                          href={venmoLinks.webLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block text-blue-600 font-bold text-xl hover:text-blue-700 underline"
                        >
                          {paymentSettings.venmo_username}
                        </a>
                      )}
                      <p className="text-xs text-blue-600 mt-2">
                        Include &quot;Order-{orderNumber}&quot; in the note
                      </p>
                    </div>

                    {venmoLinks && (
                      <div className="space-y-2">
                        <a
                          href={venmoLinks.deepLink}
                          className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                        >
                          <Smartphone className="w-5 h-5" />
                          Open Venmo App
                        </a>
                        <a
                          href={venmoLinks.webLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-3 px-4 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                        >
                          <ExternalLink className="w-5 h-5" />
                          Open in Browser
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Cash App Payment */}
                {paymentMethod === 'cashapp' && (
                  <div className="p-6 bg-green-50 rounded-lg border border-green-100">
                    <h3 className="font-body font-bold text-green-800 mb-4 text-center text-lg">Complete Payment via Cash App</h3>

                    {paymentSettings.cashapp_qr_url && (
                      <div className="flex justify-center mb-4">
                        <Image
                          src={paymentSettings.cashapp_qr_url}
                          alt="Cash App QR Code"
                          width={200}
                          height={200}
                          className="rounded-lg"
                        />
                      </div>
                    )}

                    <div className="text-center mb-4">
                      <p className="text-sm text-green-700 mb-2">
                        Send <strong className="text-lg">{formatPrice(orderTotal)}</strong> to
                      </p>
                      {cashappLink && (
                        <a
                          href={cashappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block text-green-600 font-bold text-xl hover:text-green-700 underline"
                        >
                          {paymentSettings.cashapp_username}
                        </a>
                      )}
                    </div>

                    {cashappLink && (
                      <a
                        href={cashappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                      >
                        <ExternalLink className="w-5 h-5" />
                        Open Cash App
                      </a>
                    )}
                  </div>
                )}

                {/* Cash Payment */}
                {paymentMethod === 'cash' && (
                  <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="font-body font-bold text-gray-800 mb-4 text-center text-lg">Cash Payment at Pickup</h3>
                    <p className="text-sm text-gray-600 text-center mb-3">
                      Please bring exact change if possible. Payment is due at pickup.
                    </p>
                    <p className="text-2xl font-bold text-brand-brown text-center">
                      Total due: {formatPrice(orderTotal)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Done button */}
            <div className="mt-8 max-w-md mx-auto">
              <button
                onClick={handleClose}
                className="w-full bg-brand-brown text-white py-4 px-6 rounded-button font-semibold text-lg
                           hover:bg-brand-brown/90 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full md:max-w-lg bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 border-b bg-white">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-500" />
                </button>
              )}
              <h2 className="text-xl font-body font-bold text-brand-brown">
                {items.length === 0 ? 'Your Cart' : stepTitles[step - 1]}
              </h2>
            </div>
            <button onClick={handleClose} className="p-2 rounded-full hover:bg-gray-100">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Step indicator */}
          {items.length > 0 && (
            <div className="px-4 pb-3">
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex-1 flex items-center">
                    <div
                      className={`h-1.5 w-full rounded-full transition-colors ${
                        s <= step ? 'bg-brand-brown' : 'bg-gray-200'
                      }`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-1">
                <span className={`text-xs ${step >= 1 ? 'text-brand-brown' : 'text-gray-400'}`}>Order</span>
                <span className={`text-xs ${step >= 2 ? 'text-brand-brown' : 'text-gray-400'}`}>Details</span>
                <span className={`text-xs ${step >= 3 ? 'text-brand-brown' : 'text-gray-400'}`}>Payment</span>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
              <ShoppingBag className="w-16 h-16 mb-4" />
              <p className="text-lg">Your cart is empty</p>
            </div>
          ) : (
            <div className="p-4">
              {/* Step 1: Order Details */}
              {step === 1 && (
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-brand-brown">
                            {item.productName}
                          </h4>
                          <div className="text-xs text-gray-500 space-y-0.5">
                            {item.size && <p>Size: {item.size}</p>}
                            {item.milk && <p>Milk: {item.milk}</p>}
                            {item.addons && item.addons.length > 0 && (
                              <p>Add-ons: {item.addons.join(', ')}</p>
                            )}
                            {item.specialInstructions && (
                              <p className="italic">Note: {item.specialInstructions}</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => removeItem(index)}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(index, item.quantity - 1)}
                            className="p-1 rounded border border-gray-200 hover:border-brand-brown/50"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(index, item.quantity + 1)}
                            className="p-1 rounded border border-gray-200 hover:border-brand-brown/50"
                            disabled={item.quantity >= 10}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="font-medium text-brand-brown">
                          {formatPrice(item.itemTotal)}
                        </span>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={clearCart}
                    className="text-xs text-gray-500 hover:text-red-500 underline"
                  >
                    Clear cart
                  </button>
                </div>
              )}

              {/* Step 2: Pickup Details & Contact Info */}
              {step === 2 && (
                <div className="space-y-6">
                  {/* Pickup Time */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Pickup Time
                    </h3>

                    {loadingSlots ? (
                      <div className="p-3 text-center text-gray-500">Loading available times...</div>
                    ) : availableSlots.length === 0 ? (
                      <div className="p-3 text-center text-red-500">No available pickup times</div>
                    ) : (
                      <>
                        <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
                          {availableSlots.map((slot) => (
                            <button
                              key={slot.date}
                              onClick={() => {
                                setPickupDate(slot.date)
                                setPickupTime(slot.slots[0] || '')
                              }}
                              className={`flex-shrink-0 px-3 py-2 rounded-lg border-2 text-sm ${
                                pickupDate === slot.date
                                  ? 'border-brand-brown bg-brand-cream'
                                  : 'border-gray-200 hover:border-brand-brown/50'
                              }`}
                            >
                              {slot.displayDate}
                            </button>
                          ))}
                        </div>

                        {selectedDateSlots.length > 0 && (
                          <div className="grid grid-cols-3 gap-2">
                            {selectedDateSlots.map((time) => (
                              <button
                                key={time}
                                onClick={() => setPickupTime(time)}
                                className={`px-2 py-2 rounded-lg border-2 text-sm ${
                                  pickupTime === time
                                    ? 'border-brand-brown bg-brand-cream'
                                    : 'border-gray-200 hover:border-brand-brown/50'
                                }`}
                              >
                                {formatTime12Hour(time)}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Contact Info
                    </h3>
                    <div className="space-y-3">
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
                    </div>
                  </div>

                  {/* Special Notes */}
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
                </div>
              )}

              {/* Step 3: Payment */}
              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-body font-bold text-brand-brown">Payment Method</h3>

                  <div className="grid gap-3">
                    {[
                      { id: 'cash' as const, name: 'Cash', description: 'Pay when you pick up', icon: Banknote, color: 'text-green-600' },
                      { id: 'venmo' as const, name: 'Venmo', description: 'Pay via Venmo app', icon: Smartphone, color: 'text-blue-500' },
                      { id: 'cashapp' as const, name: 'Cash App', description: 'Pay via Cash App', icon: Smartphone, color: 'text-green-500' }
                    ].map((method) => {
                      const Icon = method.icon
                      const isSelected = paymentMethod === method.id

                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setPaymentMethod(method.id)}
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

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                      {error}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        {items.length > 0 && (
          <div className="flex-shrink-0 border-t bg-brand-cream/50 p-4 space-y-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            {/* Totals */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span>{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-brand-brown pt-1 border-t">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            {/* Action Button */}
            {step === 1 && (
              <button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="w-full bg-brand-brown text-white py-4 px-4 rounded-button font-semibold text-lg
                           hover:bg-brand-brown/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            )}

            {step === 2 && (
              <button
                onClick={() => setStep(3)}
                disabled={!canProceedStep2}
                className="w-full bg-brand-brown text-white py-4 px-4 rounded-button font-semibold text-lg
                           hover:bg-brand-brown/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Payment
              </button>
            )}

            {step === 3 && (
              <button
                onClick={handleSubmit}
                disabled={!canPlaceOrder || loading}
                className="w-full bg-brand-brown text-white py-4 px-4 rounded-button font-semibold text-lg
                           hover:bg-brand-brown/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  `Place Order - ${formatPrice(total)}`
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
