'use client'

import { useState } from 'react'
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react'
import { useCart } from '@/components/providers/CartProvider'
import { formatPrice } from '@/lib/utils'
import CheckoutModal from './CheckoutModal'

export default function CartDrawer() {
  const { items, removeItem, updateQuantity, isCartOpen, setIsCartOpen, subtotal, clearCart } = useCart()
  const [showCheckout, setShowCheckout] = useState(false)

  const handleCheckout = () => {
    setIsCartOpen(false)
    setShowCheckout(true)
  }

  // If cart is closed and checkout is not showing, don't render anything
  if (!isCartOpen && !showCheckout) return null

  return (
    <>
      {/* Cart Drawer */}
      {isCartOpen && <div className="fixed inset-0 z-50">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => setIsCartOpen(false)}
        />

        {/* Drawer */}
        <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-heading text-brand-brown">Your Cart</h2>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <ShoppingBag className="w-12 h-12 mb-4" />
                <p>Your cart is empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-medium text-brand-brown">
                          {item.productName}
                        </h3>
                        <div className="text-sm text-gray-500 space-y-0.5">
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

                    {/* Quantity and price */}
                    <div className="flex items-center justify-between mt-3">
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

                {/* Clear cart button */}
                <button
                  onClick={clearCart}
                  className="text-sm text-gray-500 hover:text-red-500 underline"
                >
                  Clear cart
                </button>
              </div>
            )}
          </div>

          {/* Footer with subtotal and checkout */}
          {items.length > 0 && (
            <div className="border-t p-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-xl font-bold text-brand-brown">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Tax calculated at checkout
              </p>
              <button
                onClick={handleCheckout}
                className="w-full bg-brand-brown text-white py-3 px-4 rounded-button font-semibold
                           hover:bg-brand-brown/90 transition-colors duration-200"
              >
                Proceed to Checkout
              </button>
            </div>
          )}
        </div>
      </div>}

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
      />
    </>
  )
}
