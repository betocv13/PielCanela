'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Plus, Minus, Trash2, ShoppingBag, Loader2, CheckCircle, ChevronLeft, Lock, MapPin, CalendarPlus, Heart } from 'lucide-react'
import { useCart } from '@/components/providers/CartProvider'
import { formatPrice } from '@/lib/utils'
import PaymentOptions from './PaymentOptions'

interface AvailableSlot {
  date: string
  displayDate: string
  slots: string[]
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
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'stripe' | null>(null)
  const [specialNotes, setSpecialNotes] = useState('')

  // Stripe payment state
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isReadyToConfirm, setIsReadyToConfirm] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null)

  // Available time slots
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(true)

  // Tax calculation
  const [tax, setTax] = useState(0)

  // Tip state
  const [tipPercent, setTipPercent] = useState<number | null>(null)
  const [customTipAmount, setCustomTipAmount] = useState('')
  const [showTipOverlay, setShowTipOverlay] = useState(false)
  const [showCustomTip, setShowCustomTip] = useState(false)

  const tipAmount = tipPercent !== null
    ? Math.round(subtotal * tipPercent) / 100
    : customTipAmount && parseFloat(customTipAmount) > 0
    ? parseFloat(customTipAmount)
    : 0
  const total = subtotal + tax + tipAmount

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

  const handleSkipTip = () => {
    setTipPercent(null)
    setCustomTipAmount('')
    setShowCustomTip(false)
    setShowTipOverlay(false)
    setStep(2)
  }

  const handleConfirmTip = () => {
    setShowTipOverlay(false)
    setShowCustomTip(false)
    setStep(2)
  }

  const handlePaymentMethodSelect = async (method: 'cash' | 'stripe') => {
    setPaymentMethod(method)
    setPaymentError(null)

    // If switching away from stripe and there's a pending order, delete it
    if (pendingOrderId && method !== 'stripe') {
      await fetch(`/api/orders?id=${pendingOrderId}`, { method: 'DELETE' })
      setPendingOrderId(null)
      setClientSecret(null)
      setIsReadyToConfirm(false)
    }

    // If switching back to stripe, reset clientSecret so a fresh order is created
    if (method === 'stripe') {
      setClientSecret(null)
      setIsReadyToConfirm(false)
    }

    if (method !== 'stripe') return

    setLoading(true)

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

    const orderRes = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail || undefined,
        items: orderItems,
        subtotal,
        tip: tipAmount,
        total,
        payment_method: 'stripe',
        pickup_date: pickupDate,
        pickup_time: pickupTime,
        special_notes: specialNotes || undefined
      })
    })

    const orderData = await orderRes.json()

    if (!orderRes.ok) {
      setLoading(false)
      setError(orderData.error || 'Failed to create order')
      setPaymentMethod(null)
      return
    }

    const createdOrderId = orderData.order.id
    setPendingOrderId(createdOrderId)
    setOrderNumber(orderData.order.order_number)

    const intentRes = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: createdOrderId,
        amount: Math.round(total * 100),
        orderNumber: orderData.order.order_number
      })
    })

    const intentData = await intentRes.json()

    if (!intentRes.ok) {
      await fetch(`/api/orders?id=${createdOrderId}`, { method: 'DELETE' })
      setPendingOrderId(null)
      setLoading(false)
      setError(intentData.error || 'Failed to initialize payment')
      setPaymentMethod(null)
      return
    }

    setClientSecret(intentData.clientSecret)
    setLoading(false)
  }

  const handlePaymentSuccess = useCallback(() => {
    setIsReadyToConfirm(false)
    setIsProcessingPayment(false)
    setPendingOrderId(null)
    setOrderComplete(true)
    clearCart()
  }, [clearCart])

  const handlePaymentError = useCallback(async (message: string) => {
    setPaymentError(message)
    setIsReadyToConfirm(false)
    setIsProcessingPayment(false)
    setClientSecret(null)

    if (pendingOrderId) {
      await fetch(`/api/orders?id=${pendingOrderId}`, { method: 'DELETE' })
      setPendingOrderId(null)
    }

    // Reset method after a delay so the customer can read the error first
    setTimeout(() => {
      setPaymentMethod(null)
    }, 2000)
  }, [pendingOrderId])

  const handleSubmit = async () => {
    setError('')
    setPaymentError(null)

    // Stripe path: order + intent already created on method selection, just confirm
    if (paymentMethod === 'stripe') {
      setIsProcessingPayment(true)
      setIsReadyToConfirm(true)
      return
    }

    // Cash path
    setLoading(true)

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

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail || undefined,
          items: orderItems,
          subtotal,
          tip: tipAmount,
          total,
          payment_method: 'cash',
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

  const handleClose = async () => {
    // Delete orphan Stripe order if panel is closed before payment completes
    if (pendingOrderId && !orderComplete) {
      await fetch(`/api/orders?id=${pendingOrderId}`, { method: 'DELETE' })
      setPendingOrderId(null)
      setClientSecret(null)
      setIsReadyToConfirm(false)
      setIsProcessingPayment(false)
      setPaymentMethod(null)
      setPaymentError(null)
    }

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
      setError('')
      setClientSecret(null)
      setIsReadyToConfirm(false)
      setIsProcessingPayment(false)
      setPaymentError(null)
      setPendingOrderId(null)
      setTipPercent(null)
      setCustomTipAmount('')
      setShowCustomTip(false)
      setShowTipOverlay(false)
    }
    setIsCartOpen(false)
  }

  const selectedDateSlots = availableSlots.find(s => s.date === pickupDate)?.slots || []

  // Validation for each step
  const canProceedStep1 = items.length > 0
  const canProceedStep2 = customerName && customerPhone && pickupDate && pickupTime
  const canPlaceOrder = canProceedStep2 && paymentMethod !== null && (paymentMethod !== 'stripe' || clientSecret !== null)

  // Step titles
  const stepTitles = ['Your Order', 'Pickup Details', 'Payment']

  if (!isCartOpen) return null

  // Order complete screen
  const handleAddToCalendar = () => {
    const [year, month, day] = pickupDate.split('-').map(Number)
    const [hour, minute] = pickupTime.split(':').map(Number)

    const pad = (n: number) => String(n).padStart(2, '0')
    const dateStr = `${year}${pad(month)}${pad(day)}T${pad(hour)}${pad(minute)}00`
    // End time: 15 minutes after pickup
    const endMinute = minute + 15
    const endHour = hour + Math.floor(endMinute / 60)
    const endStr = `${year}${pad(month)}${pad(day)}T${pad(endHour)}${pad(endMinute % 60)}00`

    const description = `Piel Canela pickup order #${orderNumber}\\nLocation: 339 E Marion St\\, Des Moines\\, IA 50315\\nPlease go to the garage door entrance. You're welcome to park in the garage or walk up—just send us a message on Instagram or Facebook when you arrive so we can bring your order out promptly.`

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Piel Canela//Order Pickup//EN',
      'BEGIN:VEVENT',
      `DTSTART:${dateStr}`,
      `DTEND:${endStr}`,
      `SUMMARY:Piel Canela Pickup - Order #${orderNumber}`,
      `LOCATION:339 E Marion St\\, Des Moines\\, IA 50315`,
      `DESCRIPTION:${description}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Reminder',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `piel-canela-order-${orderNumber}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (orderComplete) {
    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
        <div className="absolute right-0 top-0 h-full w-full md:max-w-lg bg-white shadow-xl flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col items-center p-8 text-center">
              <CheckCircle className="w-20 h-20 text-green-500 mb-6" />
              <h2 className="text-3xl font-menu font-bold text-brand-brown mb-3">Order Placed!</h2>
              <p className="text-lg text-gray-600 mb-2">Your order number is</p>
              <p className="text-2xl font-bold text-brand-brown mb-6">#{orderNumber}</p>

              {/* Pickup details card */}
              <div className="w-full max-w-sm bg-brand-cream rounded-xl border border-brand-brown/20 p-5 text-left mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-4 h-4 text-brand-brown flex-shrink-0" />
                  <span className="font-menu font-bold text-brand-brown text-sm uppercase tracking-wide">Pickup Details</span>
                </div>
                <div className="space-y-3 text-sm text-gray-700">
                  <div>
                    <p className="font-semibold text-brand-brown mb-0.5">Scheduled pickup</p>
                    <p>
                      {pickupDate ? new Date(pickupDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : ''}
                      {pickupTime ? ` at ${formatTime12Hour(pickupTime)}` : ''}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-brand-brown mb-0.5">Location</p>
                    <p>339 E Marion St, Des Moines, IA 50315</p>
                  </div>
                  <div>
                    <p className="font-semibold text-brand-brown mb-0.5">Instructions</p>
                    <p>Please go to the garage door entrance. You&apos;re welcome to park in the garage or walk up—just send us a message on Instagram or Facebook when you arrive so we can bring your order out promptly.</p>
                  </div>
                  <p className="italic text-brand-brown/70">See you soon!</p>
                </div>
              </div>

              {/* Add to Calendar */}
              <button
                onClick={handleAddToCalendar}
                className="flex items-center justify-center gap-2 w-full max-w-sm border-2 border-brand-brown text-brand-brown py-3 px-6 rounded-button font-semibold
                           hover:bg-brand-cream transition-colors mb-3"
              >
                <CalendarPlus className="w-4 h-4" />
                Add to Calendar
              </button>

              <button
                onClick={handleClose}
                className="w-full max-w-sm bg-brand-brown text-white py-4 px-6 rounded-button font-semibold text-lg
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
                  onClick={async () => {
                    if (step === 3) {
                      if (pendingOrderId) {
                        await fetch(`/api/orders?id=${pendingOrderId}`, { method: 'DELETE' })
                        setPendingOrderId(null)
                      }
                      setClientSecret(null)
                      setIsReadyToConfirm(false)
                      setPaymentError(null)
                      setPaymentMethod(null)
                    }
                    if (step === 2) {
                      setTipPercent(null)
                      setCustomTipAmount('')
                      setShowCustomTip(false)
                    }
                    setStep(step - 1)
                  }}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-500" />
                </button>
              )}
              <h2 className="text-xl font-menu font-bold text-brand-brown">
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
                          <h4 className="font-menu font-bold text-brand-brown">
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
                        <span className="font-menu font-bold text-brand-brown">
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
                    <h3 className="text-sm font-menu font-bold text-gray-500 uppercase tracking-wide mb-3">
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
                    <h3 className="text-sm font-menu font-bold text-gray-500 uppercase tracking-wide mb-3">
                      Contact Info
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-menu font-bold text-brand-brown mb-1">
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
                        <label className="block text-sm font-menu font-bold text-brand-brown mb-1">
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
                        <label className="block text-sm font-menu font-bold text-brand-brown mb-1">
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
                    <label className="block text-sm font-menu font-bold text-brand-brown mb-1">
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
                  <PaymentOptions
                    selectedMethod={paymentMethod}
                    onSelect={handlePaymentMethodSelect}
                    total={total}
                    clientSecret={clientSecret}
                    isReadyToConfirm={isReadyToConfirm}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                  />

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

        {/* Tip overlay */}
        {showTipOverlay && (
          <div className="absolute inset-0 z-10 flex items-end justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={handleSkipTip} />
            <div className="relative w-full bg-white rounded-t-2xl shadow-xl p-6 pb-8">
              <div className="flex items-center gap-2 mb-1">
                <Heart className="w-5 h-5 text-brand-brown" />
                <h3 className="text-lg font-menu font-bold text-brand-brown">Add a tip?</h3>
              </div>
              <p className="text-sm text-gray-500 mb-5">100% of tips go to our team.</p>

              {!showCustomTip ? (
                <>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {[15, 20, 25].map((pct) => (
                      <button
                        key={pct}
                        onClick={() => { setTipPercent(pct); setCustomTipAmount('') }}
                        className={`flex flex-col items-center py-3 rounded-xl border-2 transition-all ${
                          tipPercent === pct
                            ? 'border-brand-brown bg-brand-cream'
                            : 'border-gray-200 hover:border-brand-brown/50'
                        }`}
                      >
                        <span className="font-menu font-bold text-brand-brown">{pct}%</span>
                        <span className="text-xs text-gray-500 mt-0.5">
                          {formatPrice(Math.round(subtotal * pct) / 100)}
                        </span>
                      </button>
                    ))}
                    <button
                      onClick={() => { setShowCustomTip(true); setTipPercent(null) }}
                      className={`flex flex-col items-center justify-center py-3 rounded-xl border-2 transition-all ${
                        customTipAmount && parseFloat(customTipAmount) > 0
                          ? 'border-brand-brown bg-brand-cream'
                          : 'border-gray-200 hover:border-brand-brown/50'
                      }`}
                    >
                      <span className="font-menu font-bold text-brand-brown text-sm">Other</span>
                      {customTipAmount && parseFloat(customTipAmount) > 0 && (
                        <span className="text-xs text-gray-500 mt-0.5">${parseFloat(customTipAmount).toFixed(2)}</span>
                      )}
                    </button>
                  </div>
                  <button
                    onClick={handleConfirmTip}
                    className="w-full bg-brand-brown text-white py-3 rounded-button font-semibold text-lg hover:bg-brand-brown/90 transition-colors mb-3"
                  >
                    {tipPercent !== null
                      ? `Add ${formatPrice(Math.round(subtotal * tipPercent) / 100)} tip`
                      : customTipAmount && parseFloat(customTipAmount) > 0
                      ? `Add ${formatPrice(parseFloat(customTipAmount))} tip`
                      : 'Continue'}
                  </button>
                </>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-menu font-bold text-brand-brown mb-2">
                      Enter tip amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={customTipAmount}
                        onChange={(e) => setCustomTipAmount(e.target.value)}
                        className="w-full pl-7 pr-3 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-brown text-lg"
                        placeholder="0.00"
                        autoFocus
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleConfirmTip}
                    disabled={!customTipAmount || parseFloat(customTipAmount) <= 0}
                    className="w-full bg-brand-brown text-white py-3 rounded-button font-semibold text-lg hover:bg-brand-brown/90 transition-colors mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {customTipAmount && parseFloat(customTipAmount) > 0
                      ? `Add ${formatPrice(parseFloat(customTipAmount))} tip`
                      : 'Enter an amount'}
                  </button>
                  <button
                    onClick={() => setShowCustomTip(false)}
                    className="w-full text-sm text-gray-500 hover:text-brand-brown py-1 mb-1"
                  >
                    Back to options
                  </button>
                </>
              )}

              <button
                onClick={handleSkipTip}
                className="w-full text-sm text-gray-400 hover:text-gray-600 py-2"
              >
                No Thanks
              </button>
            </div>
          </div>
        )}

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
              {tipAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tip</span>
                  <span>{formatPrice(tipAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-brand-brown pt-1 border-t">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            {/* Action Button */}
            {step === 1 && (
              <button
                onClick={() => setShowTipOverlay(true)}
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
              <>
                {paymentError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {paymentError}
                  </div>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={!canPlaceOrder || loading || isProcessingPayment}
                  className="w-full bg-brand-brown text-white py-4 px-4 rounded-button font-semibold text-lg
                             hover:bg-brand-brown/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                             flex items-center justify-center gap-2"
                >
                  {(loading || isProcessingPayment) ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : paymentMethod === 'stripe' ? (
                    <>
                      <Lock className="w-4 h-4" />
                      {`Pay ${formatPrice(total)}`}
                    </>
                  ) : (
                    `Place Order — ${formatPrice(total)}`
                  )}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
