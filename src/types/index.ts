// Database types based on schema

// Size option for products
export interface SizeOption {
  name: string
  size: string
  priceAdjustment: number
}

// Milk option for products
export interface MilkOption {
  name: string
  priceAdjustment: number
}

// Add-on option for products
export interface AddonOption {
  name: string
  priceAdjustment: number
}

// Product type
export interface Product {
  id: string
  name: string
  description: string | null
  category: string
  base_price: number
  image_url: string | null
  available: boolean
  deleted: boolean
  sizes: SizeOption[]
  milk_options: MilkOption[]
  addons: AddonOption[]
  tax_rate: number | null  // Per-product tax rate (percentage), null uses default
  created_at: string
  updated_at: string
}

// Order item (what customer adds to cart)
export interface OrderItem {
  productId: string
  productName: string
  quantity: number
  size: string | null
  milk: string | null
  addons: string[]
  specialInstructions: string | null
  itemTotal: number
}

// Cart item (extends order item with product details for display)
export interface CartItem extends OrderItem {
  basePrice: number
}

// Order type
export interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string
  customer_email: string | null
  items: OrderItem[]
  subtotal: number
  tax: number
  total: number
  payment_method: 'cash' | 'venmo' | 'cashapp'
  payment_confirmed: boolean
  status: 'pending' | 'ready' | 'completed'
  pickup_date: string
  pickup_time: string
  special_notes: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
}

// Business hours type
export interface BusinessHours {
  id: string
  day_of_week: number
  is_open: boolean
  open_time: string
  close_time: string
  created_at: string
  updated_at: string
}

// Settings type
export interface Setting {
  id: string
  key: string
  value: string | boolean | number
  created_at: string
  updated_at: string
}

// App settings (parsed from settings table)
export interface AppSettings {
  ordering_enabled: boolean
  ordering_closed_message: string
  venmo_username: string
  cashapp_username: string
  venmo_qr_url: string
  cashapp_qr_url: string
  owner_email: string
  notification_frequency: 'instant' | 'batched' | 'daily'
  global_milk_options: MilkOption[]
  default_tax_rate: number
  max_orders_per_slot: number
}

// Customer form data
export interface CustomerFormData {
  name: string
  phone: string
  email?: string
  specialNotes?: string
}

// Create order payload
export interface CreateOrderPayload {
  customer_name: string
  customer_phone: string
  customer_email?: string
  items: OrderItem[]
  subtotal: number
  total: number
  payment_method: 'cash' | 'venmo' | 'cashapp'
  pickup_date: string
  pickup_time: string
  special_notes?: string
}

// Product form data (for creating/editing products)
export interface ProductFormData {
  name: string
  description?: string
  category: string
  base_price: number
  sizes: SizeOption[]
  milk_options: MilkOption[]
  addons: AddonOption[]
  available: boolean
  image_url?: string | null
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface ProductsResponse {
  products: Product[]
}

export interface OrderResponse {
  order: Order
}

export interface OrdersResponse {
  orders: Order[]
  count: number
}

export interface BusinessHoursResponse {
  hours: BusinessHours[]
  ordering_enabled: boolean
  closed_message: string
}

export interface AvailableTimesResponse {
  date: string
  slots: string[]
}

// Dashboard stats
export interface DashboardStats {
  todaysOrders: number
  pendingPayment: number
  upcomingOrders: number
  todaysRevenue: number
}
