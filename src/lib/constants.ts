// Brand Colors
export const COLORS = {
  primary: '#805437',      // Primary Brown
  secondary: '#efeae3',    // Secondary Cream
  accent: {
    pink: '#e47079',       // CTAs, highlights
    green: '#74a12e',      // Success states
  },
  beige: '#f0eade',        // Cards, sections
  white: '#ffffff',
  black: '#333333',
} as const

// Order Status
export const ORDER_STATUS = {
  PENDING: 'pending',
  READY: 'ready',
  COMPLETED: 'completed',
} as const

// Payment Methods
export const PAYMENT_METHODS = {
  CASH: 'cash',
  VENMO: 'venmo',
  CASHAPP: 'cashapp',
} as const

// Product Categories
export const CATEGORIES = {
  ALL: 'all',
  COFFEE: 'coffee',
  MATCHA: 'matcha',
  OTHER: 'other',
} as const

// Days of week (0 = Sunday)
export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

// Time constants
export const TIME_CONSTANTS = {
  SLOT_INTERVAL_MINUTES: 15,
  MIN_HOURS_BEFORE_PICKUP: 2,
  MAX_DAYS_ADVANCE: 7,
  ORDER_AUTO_DELETE_DAYS: 5,
} as const

// Default business hours
export const DEFAULT_BUSINESS_HOURS = {
  openTime: '10:00',
  closeTime: '18:00',
} as const

// Validation limits
export const VALIDATION = {
  MAX_SPECIAL_INSTRUCTIONS: 200,
  MAX_QUANTITY: 10,
  MIN_NAME_LENGTH: 2,
  MAX_DESCRIPTION_LENGTH: 150,
  MAX_IMAGE_SIZE_MB: 5,
} as const

// Payment usernames (defaults, can be changed in settings)
export const DEFAULT_PAYMENT_INFO = {
  venmoUsername: '@pielcanela',
  cashappUsername: '$pielcanela',
} as const
