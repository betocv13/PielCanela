import { OrderItem } from '@/types'
import { formatPrice } from './utils'

interface OrderEmailData {
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  items: OrderItem[]
  subtotal: number
  tax: number
  total: number
  paymentMethod: 'cash' | 'venmo' | 'cashapp'
  pickupDate: string
  pickupTime: string
  specialNotes?: string
}

const BRAND_BROWN = '#805437'
const BRAND_CREAM = '#efeae3'
const BRAND_PINK = '#e47079'

// Email template wrapper with branding
const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Piel Canela Order</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: ${BRAND_CREAM};">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(128, 84, 55, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: ${BRAND_BROWN}; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Piel Canela</h1>
              <p style="margin: 5px 0 0 0; color: ${BRAND_CREAM}; font-size: 14px; font-style: italic;">Handcrafted Drinks</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: ${BRAND_CREAM}; padding: 20px 30px; text-align: center;">
              <p style="margin: 0; color: ${BRAND_BROWN}; font-size: 12px;">
                Thank you for supporting our small business! ☕<br>
                <a href="https://piel-canela.vercel.app" style="color: ${BRAND_PINK}; text-decoration: none;">Visit our website</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

// Format date for display
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

// Format time for display (e.g., "14:30" -> "2:30 PM")
const formatTime = (time: string): string => {
  const [hourStr, minuteStr] = time.split(':')
  let hour = parseInt(hourStr, 10)
  const minute = minuteStr || '00'
  const ampm = hour >= 12 ? 'PM' : 'AM'
  hour = hour % 12 || 12
  return `${hour}:${minute} ${ampm}`
}

// Customer order confirmation email
export const generateCustomerOrderEmail = (data: OrderEmailData): string => {
  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid ${BRAND_CREAM};">
        <strong>${item.quantity}x ${item.productName}</strong>
        ${item.size ? `<br><span style="color: #666; font-size: 14px;">${item.size}</span>` : ''}
        ${item.temperature ? `<br><span style="color: #666; font-size: 14px;">${item.temperature.charAt(0).toUpperCase() + item.temperature.slice(1)}</span>` : ''}
        ${item.milk ? `<br><span style="color: #666; font-size: 14px;">${item.milk}</span>` : ''}
        ${item.addons.length > 0 ? `<br><span style="color: #666; font-size: 14px;">${item.addons.join(', ')}</span>` : ''}
        ${item.specialInstructions ? `<br><span style="color: #999; font-size: 13px; font-style: italic;">${item.specialInstructions}</span>` : ''}
      </td>
      <td style="padding: 8px 0; text-align: right; border-bottom: 1px solid ${BRAND_CREAM};">
        <strong>${formatPrice(item.itemTotal)}</strong>
      </td>
    </tr>
  `).join('')

  const paymentMethodLabel = {
    cash: 'Cash at Pickup',
    venmo: 'Venmo',
    cashapp: 'Cash App'
  }[data.paymentMethod]

  const content = `
    <h2 style="margin: 0 0 20px 0; color: ${BRAND_BROWN}; font-size: 24px;">Order Confirmed! 🎉</h2>

    <p style="margin: 0 0 20px 0; color: #333; font-size: 16px;">
      Hi ${data.customerName},<br><br>
      Thank you for your order! We're excited to prepare your delicious drinks.
    </p>

    <div style="background-color: ${BRAND_CREAM}; padding: 15px; border-radius: 8px; margin-bottom: 30px;">
      <p style="margin: 0 0 5px 0; color: ${BRAND_BROWN}; font-size: 14px; font-weight: bold;">ORDER NUMBER</p>
      <p style="margin: 0; color: ${BRAND_BROWN}; font-size: 28px; font-weight: bold;">#${data.orderNumber}</p>
    </div>

    <h3 style="margin: 0 0 15px 0; color: ${BRAND_BROWN}; font-size: 18px;">📦 Your Order</h3>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      ${itemsHtml}
      <tr>
        <td style="padding: 12px 0 8px 0;"><strong>Subtotal</strong></td>
        <td style="padding: 12px 0 8px 0; text-align: right;"><strong>${formatPrice(data.subtotal)}</strong></td>
      </tr>
      <tr>
        <td style="padding: 8px 0;">Tax</td>
        <td style="padding: 8px 0; text-align: right;">${formatPrice(data.tax)}</td>
      </tr>
      <tr style="border-top: 2px solid ${BRAND_BROWN};">
        <td style="padding: 12px 0 0 0;"><strong style="font-size: 18px; color: ${BRAND_BROWN};">Total</strong></td>
        <td style="padding: 12px 0 0 0; text-align: right;"><strong style="font-size: 18px; color: ${BRAND_BROWN};">${formatPrice(data.total)}</strong></td>
      </tr>
    </table>

    <h3 style="margin: 30px 0 15px 0; color: ${BRAND_BROWN}; font-size: 18px;">📍 Pickup Details</h3>
    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
      <p style="margin: 0 0 8px 0; color: #333;"><strong>Date:</strong> ${formatDate(data.pickupDate)}</p>
      <p style="margin: 0 0 8px 0; color: #333;"><strong>Time:</strong> ${formatTime(data.pickupTime)}</p>
      <p style="margin: 0; color: #333;"><strong>Payment:</strong> ${paymentMethodLabel}</p>
    </div>

    ${data.specialNotes ? `
      <h3 style="margin: 30px 0 15px 0; color: ${BRAND_BROWN}; font-size: 18px;">📝 Special Notes</h3>
      <p style="margin: 0 0 20px 0; color: #666; font-style: italic;">${data.specialNotes}</p>
    ` : ''}

    <div style="background-color: ${BRAND_PINK}20; border-left: 4px solid ${BRAND_PINK}; padding: 15px; margin-top: 30px;">
      <p style="margin: 0; color: #333; font-size: 14px;">
        <strong>Important:</strong> Please arrive at your scheduled pickup time. If you need to make any changes, please contact us as soon as possible.
      </p>
    </div>

    <p style="margin: 30px 0 0 0; color: #333; font-size: 16px;">
      See you soon!<br>
      <strong style="color: ${BRAND_BROWN};">The Piel Canela Team</strong>
    </p>
  `

  return emailWrapper(content)
}

// Admin new order notification email
export const generateAdminOrderEmail = (data: OrderEmailData): string => {
  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid ${BRAND_CREAM};">
        <strong>${item.quantity}x ${item.productName}</strong>
        ${item.size ? `<br><span style="color: #666; font-size: 14px;">${item.size}</span>` : ''}
        ${item.temperature ? `<br><span style="color: #666; font-size: 14px;">${item.temperature.charAt(0).toUpperCase() + item.temperature.slice(1)}</span>` : ''}
        ${item.milk ? `<br><span style="color: #666; font-size: 14px;">${item.milk}</span>` : ''}
        ${item.addons.length > 0 ? `<br><span style="color: #666; font-size: 14px;">${item.addons.join(', ')}</span>` : ''}
        ${item.specialInstructions ? `<br><span style="color: #999; font-size: 13px; font-style: italic;">${item.specialInstructions}</span>` : ''}
      </td>
      <td style="padding: 8px 0; text-align: right; border-bottom: 1px solid ${BRAND_CREAM};">
        <strong>${formatPrice(item.itemTotal)}</strong>
      </td>
    </tr>
  `).join('')

  const paymentMethodLabel = {
    cash: 'Cash at Pickup',
    venmo: 'Venmo',
    cashapp: 'Cash App'
  }[data.paymentMethod]

  const content = `
    <h2 style="margin: 0 0 20px 0; color: ${BRAND_BROWN}; font-size: 24px;">🔔 New Order Received</h2>

    <div style="background-color: ${BRAND_CREAM}; padding: 15px; border-radius: 8px; margin-bottom: 30px;">
      <p style="margin: 0 0 5px 0; color: ${BRAND_BROWN}; font-size: 14px; font-weight: bold;">ORDER #${data.orderNumber}</p>
      <p style="margin: 0; color: ${BRAND_BROWN}; font-size: 18px;">${formatDate(data.pickupDate)} at ${formatTime(data.pickupTime)}</p>
    </div>

    <h3 style="margin: 0 0 15px 0; color: ${BRAND_BROWN}; font-size: 18px;">👤 Customer Info</h3>
    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
      <p style="margin: 0 0 8px 0; color: #333;"><strong>Name:</strong> ${data.customerName}</p>
      <p style="margin: 0 0 8px 0; color: #333;"><strong>Phone:</strong> ${data.customerPhone}</p>
      <p style="margin: 0; color: #333;"><strong>Email:</strong> ${data.customerEmail}</p>
    </div>

    <h3 style="margin: 30px 0 15px 0; color: ${BRAND_BROWN}; font-size: 18px;">📦 Order Items</h3>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      ${itemsHtml}
      <tr>
        <td style="padding: 12px 0 8px 0;"><strong>Subtotal</strong></td>
        <td style="padding: 12px 0 8px 0; text-align: right;"><strong>${formatPrice(data.subtotal)}</strong></td>
      </tr>
      <tr>
        <td style="padding: 8px 0;">Tax</td>
        <td style="padding: 8px 0; text-align: right;">${formatPrice(data.tax)}</td>
      </tr>
      <tr style="border-top: 2px solid ${BRAND_BROWN};">
        <td style="padding: 12px 0 0 0;"><strong style="font-size: 18px; color: ${BRAND_BROWN};">Total</strong></td>
        <td style="padding: 12px 0 0 0; text-align: right;"><strong style="font-size: 18px; color: ${BRAND_BROWN};">${formatPrice(data.total)}</strong></td>
      </tr>
    </table>

    <h3 style="margin: 30px 0 15px 0; color: ${BRAND_BROWN}; font-size: 18px;">💳 Payment</h3>
    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
      <p style="margin: 0; color: #333;"><strong>Method:</strong> ${paymentMethodLabel}</p>
    </div>

    ${data.specialNotes ? `
      <h3 style="margin: 30px 0 15px 0; color: ${BRAND_BROWN}; font-size: 18px;">📝 Special Notes</h3>
      <div style="background-color: ${BRAND_PINK}20; border-left: 4px solid ${BRAND_PINK}; padding: 15px;">
        <p style="margin: 0; color: #333;">${data.specialNotes}</p>
      </div>
    ` : ''}

    <p style="margin: 30px 0 0 0; color: #666; font-size: 14px; text-align: center;">
      View all orders in your <a href="https://piel-canela.vercel.app/dashboard" style="color: ${BRAND_PINK}; text-decoration: none;">admin dashboard</a>
    </p>
  `

  return emailWrapper(content)
}
