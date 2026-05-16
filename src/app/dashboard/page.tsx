'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, formatDistanceToNow, isToday, parseISO } from 'date-fns'
import { Clock, User, Phone, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Order } from '@/types'

type FilterTab = 'all' | 'cancelled' | 'completed'
type SortOption = 'pickup_time' | 'created_at' | 'order_number'

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [sortBy, setSortBy] = useState<SortOption>('pickup_time')
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [confirmingComplete, setConfirmingComplete] = useState<{ id: string; orderNumber: string } | null>(null)
  const [confirmingCancel, setConfirmingCancel] = useState<{ id: string; orderNumber: string } | null>(null)

  // Calculate stats
  const todaysOrders = orders.filter(order => isToday(parseISO(order.pickup_date))).length
  const completedCount = orders.filter(order => order.status === 'completed').length

  const fetchOrders = useCallback(async () => {
    const supabase = createClient()

    // Get today's date for filtering
    const today = format(new Date(), 'yyyy-MM-dd')

    // Clean up old completed orders (older than 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    await supabase
      .from('orders')
      .delete()
      .eq('status', 'completed')
      .lt('completed_at', oneHourAgo)

    // Clean up old cancelled orders (older than 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    await supabase
      .from('orders')
      .delete()
      .eq('status', 'cancelled')
      .lt('created_at', oneDayAgo)

    // Clean up abandoned pending orders (older than 2 days — pickup date has passed)
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    await supabase
      .from('orders')
      .delete()
      .eq('status', 'pending')
      .lt('created_at', twoDaysAgo)

    // Fetch active orders (not completed) and today's completed orders
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .gte('pickup_date', today)
      .or(`status.neq.completed,and(status.eq.completed,pickup_date.gte.${today})`)
      .order('pickup_date', { ascending: true })
      .order('pickup_time', { ascending: true })

    if (error) {
      console.error('Error fetching orders:', error)
      return
    }

    setOrders(data || [])
    setIsLoading(false)
  }, [])

  useEffect(() => {
    fetchOrders()

    // Set up real-time subscription
    const supabase = createClient()
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          fetchOrders()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchOrders])

  // Filter orders based on active tab
  const filteredOrders = orders.filter(order => {
    switch (activeTab) {
      case 'cancelled':
        return order.status === 'cancelled'
      case 'completed':
        return order.status === 'completed'
      default:
        return order.status !== 'completed' && order.status !== 'cancelled'
    }
  })

  // Sort orders
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    switch (sortBy) {
      case 'pickup_time':
        const dateCompare = a.pickup_date.localeCompare(b.pickup_date)
        if (dateCompare !== 0) return dateCompare
        return a.pickup_time.localeCompare(b.pickup_time)
      case 'created_at':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'order_number':
        return a.order_number.localeCompare(b.order_number)
      default:
        return 0
    }
  })

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    const supabase = createClient()

    const updates: { status: Order['status']; completed_at?: string | null } = { status }
    if (status === 'completed') {
      updates.completed_at = new Date().toISOString()
    } else {
      updates.completed_at = null
    }

    const { error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)

    if (error) {
      console.error('Error updating order status:', error)
      return
    }

    fetchOrders()
  }

  const cancelOrder = async (orderId: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId)
    if (error) {
      console.error('Error cancelling order:', error)
      return
    }
    fetchOrders()
  }

  const formatPickupTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const formatPickupDate = (pickupDate: string) => {
    const date = parseISO(pickupDate)
    if (isToday(date)) {
      return 'Today'
    }
    return format(date, 'EEE') // Returns day name like "Fri", "Sat", etc.
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'venmo':
        return 'Venmo'
      case 'cashapp':
        return 'Cash App'
      case 'cash':
        return 'Cash on Pickup'
      case 'stripe':
        return 'Card (Stripe)'
      default:
        return method
    }
  }

  const formatOrderedTime = (createdAt: string) => {
    return formatDistanceToNow(new Date(createdAt), { addSuffix: true })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-brown"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl lg:text-3xl font-heading text-brand-brown">Orders</h1>
        <p className="text-brand-brown/70 text-sm mt-1 sm:mt-0">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 lg:gap-4 mb-6">
        <div className="bg-[#F5F0E8] rounded-lg p-4">
          <p className="text-sm text-brand-brown/70 mb-1">Today&apos;s Orders</p>
          <p className="text-2xl lg:text-3xl font-bold text-brand-brown">{todaysOrders}</p>
        </div>
        <div className="bg-[#F5F0E8] rounded-lg p-4">
          <p className="text-sm text-brand-brown/70 mb-1">Completed</p>
          <p className="text-2xl lg:text-3xl font-bold text-green-600">{completedCount}</p>
        </div>
      </div>

      {/* Filter Tabs and Sort - Desktop */}
      <div className="hidden lg:flex items-center justify-between mb-6">
        <div className="flex gap-1 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'all'
                ? 'border-brand-brown text-brand-brown'
                : 'border-transparent text-gray-500 hover:text-brand-brown'
            }`}
          >
            All Orders
          </button>
          <button
            onClick={() => setActiveTab('cancelled')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'cancelled'
                ? 'border-brand-brown text-brand-brown'
                : 'border-transparent text-gray-500 hover:text-brand-brown'
            }`}
          >
            Cancelled
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'completed'
                ? 'border-brand-brown text-brand-brown'
                : 'border-transparent text-gray-500 hover:text-brand-brown'
            }`}
          >
            Completed
          </button>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="flex items-center gap-2 text-sm text-brand-brown hover:text-brand-brown/80"
          >
            Sort by: {sortBy === 'pickup_time' ? 'Pickup Time' : sortBy === 'created_at' ? 'Order Time' : 'Order Number'}
            <ChevronDown className="w-4 h-4" />
          </button>
          {showSortDropdown && (
            <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              <button
                onClick={() => { setSortBy('pickup_time'); setShowSortDropdown(false) }}
                className="block w-full text-left px-4 py-2 text-sm hover:bg-brand-cream"
              >
                Pickup Time
              </button>
              <button
                onClick={() => { setSortBy('created_at'); setShowSortDropdown(false) }}
                className="block w-full text-left px-4 py-2 text-sm hover:bg-brand-cream"
              >
                Order Time
              </button>
              <button
                onClick={() => { setSortBy('order_number'); setShowSortDropdown(false) }}
                className="block w-full text-left px-4 py-2 text-sm hover:bg-brand-cream"
              >
                Order Number
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Sort - Mobile */}
      <div className="lg:hidden flex gap-3 mb-6">
        <div className="relative flex-1">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as FilterTab)}
            className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm text-brand-brown pr-10"
          >
            <option value="all">All Orders</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-brown pointer-events-none" />
        </div>
        <div className="relative flex-1">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm text-brand-brown pr-10"
          >
            <option value="pickup_time">Pickup Time</option>
            <option value="created_at">Order Time</option>
            <option value="order_number">Order Number</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-brown pointer-events-none" />
        </div>
      </div>

      {/* Orders Grid */}
      {sortedOrders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-brand-brown/70">No orders found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sortedOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200"
            >
              {/* Order Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-brand-brown">#{order.order_number}</span>
                  <span className="flex items-center gap-1 text-sm text-brand-brown/70">
                    <Clock className="w-4 h-4" />
                    {formatPickupTime(order.pickup_time)}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-brand-brown/50" />
                    <span className="text-brand-brown">{order.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-brand-brown/50" />
                    <span className="text-brand-brown/70">{order.customer_phone}</span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="p-4 border-b border-gray-100">
                <p className="text-sm font-medium text-brand-brown mb-2 flex items-center gap-1">
                  <span>ORDER:</span>
                </p>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <div>
                        <p className="text-brand-brown">
                          • {item.quantity}x {item.productName} {item.size && `(${item.size})`}
                        </p>
                        {(item.milk || item.addons.length > 0) && (
                          <p className="text-brand-brown/60 text-xs ml-3">
                            {[item.milk, ...item.addons].filter(Boolean).join(', ')}
                          </p>
                        )}
                        {item.specialInstructions && (
                          <p className="text-brand-brown/70 text-xs ml-3 italic">
                            Note: {item.specialInstructions}
                          </p>
                        )}
                      </div>
                      <span className="text-brand-brown font-medium">
                        ${item.itemTotal.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                {order.tip > 0 && (
                  <div className="flex justify-between mt-3 pt-3 border-t border-gray-100">
                    <span className="font-semibold text-brand-brown">Tip:</span>
                    <span className="font-bold text-[#8B4513]">${order.tip.toFixed(2)}</span>
                  </div>
                )}
                <div className={`flex justify-between ${order.tip > 0 ? 'mt-1' : 'mt-3 pt-3 border-t border-gray-100'}`}>
                  <span className="font-semibold text-brand-brown">Total:</span>
                  <span className="font-bold text-[#8B4513]">${order.total.toFixed(2)}</span>
                </div>
                <p className="text-sm text-brand-brown/70 mt-1">
                  {getPaymentMethodLabel(order.payment_method)}
                </p>
              </div>

              {/* Payment Info */}
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-brand-brown">PAYMENT:</span>
                  {order.payment_method === 'stripe' ? (
                    order.payment_confirmed ? (
                      <span className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                        Paid via Card
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                        Awaiting Payment
                      </span>
                    )
                  ) : (
                    <span className="text-sm font-medium text-brand-brown/70 bg-brand-cream px-3 py-1 rounded-full border border-brand-brown/20">
                      Cash on Pickup
                    </span>
                  )}
                </div>
              </div>

              {order.status !== 'completed' && order.status !== 'cancelled' && (
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmingCancel({ id: order.id, orderNumber: order.order_number })}
                      className="flex-1 py-2 px-3 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                      Cancel Order
                    </button>
                    <button
                      onClick={() => setConfirmingComplete({ id: order.id, orderNumber: order.order_number })}
                      className="flex-1 py-2 px-3 rounded-lg text-sm font-medium bg-brand-brown text-white hover:bg-brand-brown/90 transition-colors"
                    >
                      Complete Order
                    </button>
                  </div>
                </div>
              )}

              {order.status === 'cancelled' && (
                <div className="px-4 py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    Cancelled
                  </span>
                </div>
              )}

              {/* Order Footer */}
              <div className="px-4 py-3 bg-gray-50 text-xs text-brand-brown/60">
                <p>Pickup: {formatPickupDate(order.pickup_date)} at {formatPickupTime(order.pickup_time)}</p>
                <p>Ordered {formatOrderedTime(order.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Complete Order Confirmation */}
      {confirmingComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmingComplete(null)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 mx-4 max-w-sm w-full">
            <h3 className="text-lg font-bold text-brand-brown mb-2">Complete Order #{confirmingComplete.orderNumber}?</h3>
            <p className="text-sm text-gray-500 mb-6">This will mark the order as done and remove it from your active queue after 1 hour.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmingComplete(null)}
                className="flex-1 py-2 px-4 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateOrderStatus(confirmingComplete.id, 'completed')
                  setConfirmingComplete(null)
                }}
                className="flex-1 py-2 px-4 rounded-lg text-sm font-medium bg-brand-brown text-white hover:bg-brand-brown/90 transition-colors"
              >
                Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Confirmation */}
      {confirmingCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmingCancel(null)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 mx-4 max-w-sm w-full">
            <h3 className="text-lg font-bold text-brand-brown mb-2">Cancel Order #{confirmingCancel.orderNumber}?</h3>
            <p className="text-sm text-gray-500 mb-6">This will mark the order as cancelled. It will remain visible on the dashboard.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmingCancel(null)}
                className="flex-1 py-2 px-4 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={() => {
                  cancelOrder(confirmingCancel.id)
                  setConfirmingCancel(null)
                }}
                className="flex-1 py-2 px-4 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
