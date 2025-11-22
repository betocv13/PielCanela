import { z } from 'zod'

// Customer form validation
export const customerFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  phone: z
    .string()
    .regex(/^\(\d{3}\) \d{3}-\d{4}$|^\d{10}$/, 'Please enter a valid phone number'),
  email: z
    .string()
    .email('Please enter a valid email')
    .optional()
    .or(z.literal('')),
  specialNotes: z
    .string()
    .max(200, 'Special notes must be less than 200 characters')
    .optional(),
})

// Order item validation
export const orderItemSchema = z.object({
  productId: z.string().uuid(),
  productName: z.string(),
  quantity: z.number().min(1).max(10),
  size: z.string().nullable(),
  milk: z.string().nullable(),
  addons: z.array(z.string()),
  specialInstructions: z.string().max(200).nullable(),
  itemTotal: z.number().positive(),
})

// Create order validation
export const createOrderSchema = z.object({
  customer_name: z.string().min(2).max(100),
  customer_phone: z.string().min(10).max(20),
  customer_email: z.string().email().optional().or(z.literal('')),
  items: z.array(orderItemSchema).min(1, 'Cart cannot be empty'),
  subtotal: z.number().positive(),
  total: z.number().positive(),
  payment_method: z.enum(['cash', 'venmo', 'cashapp']),
  pickup_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  pickup_time: z.string().regex(/^\d{2}:\d{2}$/),
  special_notes: z.string().max(200).optional(),
})

// Product form validation
export const productFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Product name is required')
    .max(100, 'Product name must be less than 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  category: z
    .string()
    .min(1, 'Category is required')
    .max(50, 'Category must be less than 50 characters'),
  base_price: z
    .number()
    .positive('Price must be greater than 0')
    .max(100, 'Price must be less than $100'),
  sizes: z
    .array(
      z.object({
        name: z.string().min(1),
        size: z.string().min(1),
        priceAdjustment: z.number(),
      })
    )
    .min(1, 'At least one size is required'),
  milk_options: z.array(
    z.object({
      name: z.string().min(1),
      priceAdjustment: z.number(),
    })
  ),
  addons: z.array(
    z.object({
      name: z.string().min(1),
      priceAdjustment: z.number(),
    })
  ),
  available: z.boolean(),
  image_url: z.string().nullable().optional(),
})

// Business hours validation
export const businessHoursSchema = z.object({
  day_of_week: z.number().min(0).max(6),
  is_open: z.boolean(),
  open_time: z.string().regex(/^\d{2}:\d{2}$/),
  close_time: z.string().regex(/^\d{2}:\d{2}$/),
})

// Settings validation
export const settingsSchema = z.object({
  ordering_enabled: z.boolean().optional(),
  ordering_closed_message: z.string().max(200).optional(),
  venmo_username: z.string().max(50).optional(),
  cashapp_username: z.string().max(50).optional(),
  owner_email: z.string().email().optional(),
  notification_frequency: z.enum(['instant', 'batched', 'daily']).optional(),
})

// Login validation
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

// Type exports from schemas
export type CustomerFormData = z.infer<typeof customerFormSchema>
export type OrderItemData = z.infer<typeof orderItemSchema>
export type CreateOrderData = z.infer<typeof createOrderSchema>
export type ProductFormData = z.infer<typeof productFormSchema>
export type BusinessHoursData = z.infer<typeof businessHoursSchema>
export type SettingsData = z.infer<typeof settingsSchema>
export type LoginData = z.infer<typeof loginSchema>
