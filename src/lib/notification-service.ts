import { prisma } from '@/lib/prisma'
import { smsingService } from '@/lib/smsing-service'
import { NotificationTrigger, NotificationChannel } from '@prisma/client'

/**
 * Format amount for notifications - no separator, just plain number
 * Example: 4500 → "4500 CFA"
 */
function formatAmount(amount: number): string {
  return `${Math.round(amount)} CFA`
}

interface SendNotificationParams {
  trigger: NotificationTrigger
  recipientType: 'customer' | 'admin'
  data: Record<string, any>
  sendBoth?: boolean // Send both SMS and WhatsApp simultaneously
}

interface NotificationResult {
  success: boolean
  channel?: NotificationChannel
  channels?: { sms?: boolean; whatsapp?: boolean } // For dual send
  messageId?: string
  error?: string
}

/**
 * Enhanced Notification Service with Template Rendering
 * Supports all 20 notification triggers with database templates
 */
export class NotificationService {
  /**
   * Main send notification function
   * Fetches templates, renders variables, sends via appropriate channel
   */
  async sendNotification(params: SendNotificationParams): Promise<NotificationResult> {
    const { trigger, recipientType, data } = params

    try {
      // Get notification settings
      const settings = await prisma.notificationSettings.findFirst()
      if (!settings) {
        throw new Error('Notification settings not found')
      }

      // For order-based triggers, fetch recipient phone from order if not provided
      let customerPhone = data.recipientPhone || data.billing_phone || data.customer_phone

      if (!customerPhone && data.orderId && recipientType === 'customer') {
        const order = await prisma.order.findUnique({
          where: { id: data.orderId },
          include: {
            user: { select: { phone: true, whatsappNumber: true } },
            shippingAddress: { select: { phone: true } }
          },
        })
        if (order) {
          customerPhone = order.user?.whatsappNumber || order.user?.phone || order.shippingAddress?.phone
        }
      }

      // For user-based triggers, fetch recipient phone from user if not provided
      if (!customerPhone && data.userId && recipientType === 'customer') {
        const user = await prisma.user.findUnique({
          where: { id: data.userId },
          select: { phone: true, whatsappNumber: true },
        })
        if (user) {
          customerPhone = user.whatsappNumber || user.phone
        }
      }

      // Check if test mode
      const recipient = settings.testMode && settings.testPhoneNumber
        ? settings.testPhoneNumber
        : recipientType === 'admin'
        ? settings.adminPhones[0] || settings.adminWhatsApp
        : customerPhone

      if (!recipient) {
        throw new Error('Recipient phone number not found')
      }

      // Extract template variables from data
      const variables = await this.extractVariables(trigger, data)

      // DUAL SEND MODE: Send both SMS and WhatsApp simultaneously
      if (params.sendBoth) {
        const channelsToSend: NotificationChannel[] = []
        if (settings.smsEnabled) channelsToSend.push('SMS')
        if (settings.whatsappEnabled) channelsToSend.push('WHATSAPP')

        const sendPromises = channelsToSend.map(async (channel) => {
          const template = await prisma.notificationTemplate.findUnique({
            where: { trigger_channel: { trigger, channel } },
          })

          if (!template || !template.enabled) {
            console.log(`Template not found or disabled for ${trigger} - ${channel}`)
            return { channel, success: false, error: 'Template not found' }
          }

          const content = this.renderTemplate(template.content, variables)

          // Note: Invoice URL is now included in the message template text
          // We keep the logo as the media file for branding (provider only supports one media)
          const result = await this.sendViaChannel(channel, recipient, content)

          // Log detailed result for debugging
          if (!result.success) {
            console.log(`❌ ${channel} failed for ${trigger}: recipient=${recipient}, contentLength=${content.length}`)
          }

          // Log notification
          await this.logNotification({
            trigger,
            channel,
            recipientPhone: recipient,
            recipientName: variables.customer_name || variables.billing_first_name || 'Admin',
            content,
            status: result.success ? 'sent' : 'failed',
            providerId: result.messageId,
            errorMessage: result.success ? undefined : 'Failed to send',
            orderId: data.orderId,
            userId: data.userId,
          })

          return { channel, ...result }
        })

        const results = await Promise.all(sendPromises)
        const smsResult = results.find(r => r.channel === 'SMS')
        const whatsappResult = results.find(r => r.channel === 'WHATSAPP')
        const anySuccess = results.some(r => r.success)

        console.log(`📱 Dual notification sent for ${trigger}: SMS=${smsResult?.success}, WhatsApp=${whatsappResult?.success}`)

        return {
          success: anySuccess,
          channels: {
            sms: smsResult?.success,
            whatsapp: whatsappResult?.success,
          },
        }
      }

      // FAILOVER MODE: Try channels in order until one succeeds
      const channels: NotificationChannel[] = settings.failoverEnabled
        ? (settings.failoverOrder.map(c => c as NotificationChannel))
        : ['WHATSAPP', 'SMS']

      // Try each channel in failover order
      for (const channel of channels) {
        // Skip disabled channels
        if (channel === 'SMS' && !settings.smsEnabled) continue
        if (channel === 'WHATSAPP' && !settings.whatsappEnabled) continue
        if (channel === 'EMAIL' && !settings.emailEnabled) continue

        // Fetch template for this trigger and channel
        const template = await prisma.notificationTemplate.findUnique({
          where: { trigger_channel: { trigger, channel } },
        })

        if (!template || !template.enabled) {
          console.log(`Template not found or disabled for ${trigger} - ${channel}`)
          continue
        }

        // Render template with variables
        const content = this.renderTemplate(template.content, variables)

        // Note: Invoice URL is now included in the message template text
        // We keep the logo as the media file for branding (provider only supports one media)

        // Send via appropriate channel
        const result = await this.sendViaChannel(channel, recipient, content)

        if (result.success) {
          // Log successful notification
          await this.logNotification({
            trigger,
            channel,
            recipientPhone: recipient,
            recipientName: variables.customer_name || variables.billing_first_name || 'Admin',
            content,
            status: 'sent',
            providerId: result.messageId,
            orderId: data.orderId,
            userId: data.userId,
          })

          return {
            success: true,
            channel,
            messageId: result.messageId,
          }
        }
      }

      // All channels failed
      await this.logNotification({
        trigger,
        channel: 'SMS',
        recipientPhone: recipient,
        content: 'Failed to send',
        status: 'failed',
        errorMessage: 'All channels failed',
        orderId: data.orderId,
        userId: data.userId,
      })

      return {
        success: false,
        error: 'All notification channels failed',
      }
    } catch (error: any) {
      console.error('Error sending notification:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Render template with variables
   */
  private renderTemplate(template: string, variables: Record<string, any>): string {
    let rendered = template

    // Replace all variables {variable_name} with actual values
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g')
      rendered = rendered.replace(regex, String(value || ''))
    }

    return rendered
  }

  /**
   * Extract variables from order/user/product data
   */
  private async extractVariables(
    trigger: NotificationTrigger,
    data: any
  ): Promise<Record<string, any>> {
    const vars: Record<string, any> = {}

    // Add store variables (always included)
    vars.store_name = 'Cave Express'
    vars.store_url = 'www.cave-express.ci'
    vars.store_phone = '+225 0556791431'
    vars.store_whatsapp = 'https://wa.me/2250556791431'
    vars.store_address = 'Faya Cité Genie 2000, Abidjan'

    // Order-related triggers (including invoice and review request)
    // Only query order if orderId is provided (standalone invoices don't have orderId)
    if (
      (trigger.includes('ORDER') ||
      trigger.includes('PAYMENT') ||
      trigger.includes('INVOICE') ||
      trigger === 'CUSTOMER_NOTE' ||
      trigger === 'REVIEW_REQUEST') &&
      data.orderId
    ) {
      const order = await prisma.order.findUnique({
        where: { id: data.orderId },
        include: {
          user: true,
          items: { include: { product: true } },
          shippingAddress: true,
          payment: true,
          invoice: true,
        },
      })

      if (order) {
        // Customer variables
        vars.customer_name = order.user.name || 'Client'
        vars.billing_first_name = order.user.name?.split(' ')[0] || 'Client'
        vars.billing_last_name = order.user.name?.split(' ').slice(1).join(' ') || ''
        vars.billing_phone = order.user.phone
        vars.billing_email = order.user.email || ''
        vars.billing_address = order.shippingAddress.addressLine1
        vars.billing_city = order.shippingAddress.city
        vars.billing_country = order.shippingAddress.country

        // Order variables
        vars.order_number = order.orderNumber
        vars.order_id = order.id
        vars.order_date = new Date(order.createdAt).toLocaleDateString('fr-FR')
        vars.order_status = order.status
        vars.order_total = formatAmount(order.total)
        vars.order_subtotal = formatAmount(order.subtotal)
        vars.order_tax = formatAmount(order.tax)
        vars.order_shipping = formatAmount(order.shippingCost)
        vars.order_discount = formatAmount(order.discount)

        // Product variables
        vars.order_product = order.items.map((i) => i.product.name).join(', ')
        vars.order_product_with_qty = order.items
          .map((i) => `${i.product.name} (${i.quantity}x)`)
          .join(', ')
        vars.order_items_count = order.items.length

        // Payment variables
        if (order.payment) {
          vars.payment_method = order.paymentMethod
          vars.payment_reference = order.payment.reference
          vars.payment_status = order.payment.status
        }

        // Shipping variables
        if (order.trackingNumber) {
          vars.tracking_number = order.trackingNumber
        }
        vars.delivery_date = 'Sous 24-48h'

        // For customer notes
        if (data.noteContent) {
          vars.note_content = data.noteContent
        }

        // Invoice variables
        if (order.invoice) {
          vars.invoice_number = order.invoice.invoiceNumber
        }
        if (data.invoice_number) {
          vars.invoice_number = data.invoice_number
        }
        if (data.invoice_url) {
          vars.invoice_url = data.invoice_url
        }

        // Set recipient phone from order user
        vars.recipientPhone = order.user.whatsappNumber || order.user.phone
      }
    }

    // Product-related triggers (stock alerts, back in stock)
    if (
      trigger === 'LOW_STOCK_ADMIN' ||
      trigger === 'OUT_OF_STOCK_ADMIN' ||
      trigger === 'BACK_IN_STOCK'
    ) {
      const product = await prisma.product.findUnique({
        where: { id: data.productId },
      })

      if (product) {
        vars.product_name = product.name
        vars.product_price = formatAmount(product.price)
        vars.product_stock = product.stock
        vars.low_stock_quantity = product.stock
        vars.low_stock_threshold = product.lowStockThreshold
        vars.product_quantity = product.stock
      }
    }

    // Customer-related triggers (new account, new customer admin)
    if (trigger === 'NEW_ACCOUNT' || trigger === 'NEW_CUSTOMER_ADMIN') {
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
      })

      if (user) {
        vars.customer_name = user.name || 'Client'
        vars.billing_first_name = user.name?.split(' ')[0] || 'Client'
        vars.billing_last_name = user.name?.split(' ').slice(1).join(' ') || ''
        vars.billing_phone = user.phone
        vars.billing_email = user.email || ''
        vars.billing_city = user.city || ''
        vars.billing_country = user.country || ''
        vars.registration_date = new Date(user.createdAt).toLocaleDateString('fr-FR')
        vars.recipientPhone = user.whatsappNumber || user.phone

        // Get total customers for admin notification
        if (trigger === 'NEW_CUSTOMER_ADMIN') {
          const totalCustomers = await prisma.user.count({
            where: { role: 'CUSTOMER' },
          })
          vars.total_customers = totalCustomers
        }
      }
    }

    // Review-related triggers
    if (trigger === 'NEW_REVIEW_ADMIN') {
      const review = await prisma.review.findUnique({
        where: { id: data.reviewId },
        include: {
          user: true,
          product: true,
        },
      })

      if (review) {
        vars.customer_name = review.user.name || 'Client'
        vars.product_name = review.product.name
        vars.rating = review.rating
        vars.review_comment = review.comment || ''
        vars.verified_purchase = review.verified ? 'Oui' : 'Non'
      }
    }

    // Loyalty points triggers
    if (trigger === 'LOYALTY_POINTS_EARNED') {
      vars.points_earned = data.pointsEarned || 0
      vars.points_balance = data.pointsBalance || 0
      vars.points_value = data.pointsValue || 0
      vars.order_number = data.orderNumber || ''
    }

    // Abandoned cart triggers
    if (trigger === 'ABANDONED_CART') {
      vars.cart_items_count = data.cartItemsCount || 0
      vars.cart_items_list = data.cartItemsList || ''
      vars.cart_total = data.cartTotal || ''
      vars.customer_name = data.customerName || 'Client'
      vars.recipientPhone = data.recipientPhone || ''
    }

    // Password reset
    if (trigger === 'PASSWORD_RESET') {
      vars.reset_code = data.resetCode || ''
      vars.customer_name = data.customerName || 'Client'
      vars.recipientPhone = data.recipientPhone || ''
    }

    // Daily report admin
    if (trigger === 'DAILY_REPORT_ADMIN') {
      vars.report_date = new Date().toLocaleDateString('fr-FR')
      vars.total_revenue = data.totalRevenue || '0'
      vars.orders_count = data.ordersCount || 0
      vars.pending_orders = data.pendingOrders || 0
      vars.processing_orders = data.processingOrders || 0
      vars.delivered_orders = data.deliveredOrders || 0
      vars.cancelled_orders = data.cancelledOrders || 0
      vars.new_customers = data.newCustomers || 0
      vars.total_customers = data.totalCustomers || 0
      vars.products_sold = data.productsSold || 0
      vars.low_stock_products = data.lowStockProducts || 0
    }

    // Direct data passthrough - allows callers to pass variables directly
    // This handles cases like admin-created invoices without orders
    if (data.customer_name && !vars.customer_name) vars.customer_name = data.customer_name
    if (data.order_number && !vars.order_number) vars.order_number = data.order_number
    if (data.invoice_number && !vars.invoice_number) vars.invoice_number = data.invoice_number
    if (data.order_total && !vars.order_total) vars.order_total = data.order_total
    if (data.order_date && !vars.order_date) vars.order_date = data.order_date
    if (data.invoice_url) vars.invoice_url = data.invoice_url
    if (data.billing_phone && !vars.billing_phone) vars.billing_phone = data.billing_phone
    if (data.recipientPhone && !vars.recipientPhone) vars.recipientPhone = data.recipientPhone

    return vars
  }

  /**
   * Send via specific channel
   * @param mediaUrl - Optional media URL for WhatsApp (replaces default logo)
   */
  private async sendViaChannel(
    channel: NotificationChannel,
    phone: string,
    content: string,
    mediaUrl?: string
  ): Promise<{ success: boolean; messageId?: string }> {
    try {
      if (channel === 'SMS') {
        const result = await smsingService.sendSMS({
          to: phone,
          message: content,
        })
        return result
      }

      if (channel === 'WHATSAPP') {
        const result = await smsingService.sendWhatsAppBusiness({
          to: phone,
          message: content,
          mediaUrl, // Pass custom media URL (e.g., invoice PDF) or undefined for default logo
        })
        return result
      }

      if (channel === 'WHATSAPP_CLOUD') {
        // WhatsApp Cloud only supports OTP templates
        const otpMatch = content.match(/(\d{6})/)
        const otpCode = otpMatch ? otpMatch[1] : '000000'
        const result = await smsingService.sendWhatsAppCloudOTP({
          to: phone,
          otpCode,
          language: 'fr',
        })
        return result
      }

      return { success: false }
    } catch (error) {
      console.error(`Error sending via ${channel}:`, error)
      return { success: false }
    }
  }

  /**
   * Log notification to NotificationLog
   */
  private async logNotification(data: {
    trigger: NotificationTrigger
    channel: NotificationChannel
    recipientPhone?: string
    recipientEmail?: string
    recipientName?: string
    content: string
    status: 'sent' | 'failed' | 'pending'
    errorMessage?: string
    providerId?: string
    providerResponse?: any
    orderId?: string
    userId?: string
    cost?: number
  }) {
    try {
      await prisma.notificationLog.create({
        data: {
          trigger: data.trigger,
          channel: data.channel,
          recipientPhone: data.recipientPhone,
          recipientEmail: data.recipientEmail,
          recipientName: data.recipientName,
          content: data.content,
          status: data.status,
          errorMessage: data.errorMessage,
          providerId: data.providerId,
          providerResponse: data.providerResponse,
          orderId: data.orderId,
          userId: data.userId,
          cost: data.cost,
          sentAt: data.status === 'sent' ? new Date() : null,
        },
      })
    } catch (error) {
      console.error('Error logging notification:', error)
    }
  }

  // =========================================================================
  // CONVENIENCE METHODS FOR EACH TRIGGER
  // =========================================================================

  /**
   * 1. ORDER_PLACED - When customer places an order
   * Sends BOTH SMS and WhatsApp simultaneously
   */
  async sendOrderPlaced(orderId: string, invoiceUrl?: string): Promise<void> {
    await this.sendNotification({
      trigger: 'ORDER_PLACED',
      recipientType: 'customer',
      data: { orderId, invoice_url: invoiceUrl },
      sendBoth: true, // SMS + WhatsApp
    })
  }

  /**
   * 2. PAYMENT_RECEIVED - When payment is confirmed
   * Sends BOTH SMS and WhatsApp simultaneously
   */
  async sendPaymentReceived(orderId: string, invoiceUrl?: string): Promise<void> {
    await this.sendNotification({
      trigger: 'PAYMENT_RECEIVED',
      recipientType: 'customer',
      data: { orderId, invoice_url: invoiceUrl },
      sendBoth: true, // SMS + WhatsApp
    })
  }

  /**
   * 3. ORDER_SHIPPED - When order is shipped
   * Sends BOTH SMS and WhatsApp simultaneously
   */
  async sendOrderShipped(orderId: string, trackingNumber?: string): Promise<void> {
    await this.sendNotification({
      trigger: 'ORDER_SHIPPED',
      recipientType: 'customer',
      data: { orderId, trackingNumber },
      sendBoth: true, // SMS + WhatsApp
    })
  }

  /**
   * 4. ORDER_DELIVERED - When order is delivered
   * Sends BOTH SMS and WhatsApp simultaneously
   */
  async sendOrderDelivered(orderId: string): Promise<void> {
    await this.sendNotification({
      trigger: 'ORDER_DELIVERED',
      recipientType: 'customer',
      data: { orderId },
      sendBoth: true, // SMS + WhatsApp
    })
  }

  /**
   * 5. ORDER_CANCELLED - When order is cancelled
   * Sends BOTH SMS and WhatsApp simultaneously
   */
  async sendOrderCancelled(orderId: string): Promise<void> {
    await this.sendNotification({
      trigger: 'ORDER_CANCELLED',
      recipientType: 'customer',
      data: { orderId },
      sendBoth: true, // SMS + WhatsApp
    })
  }

  /**
   * 6. ORDER_REFUNDED - When refund is processed
   * Sends BOTH SMS and WhatsApp simultaneously
   */
  async sendOrderRefunded(orderId: string): Promise<void> {
    await this.sendNotification({
      trigger: 'ORDER_REFUNDED',
      recipientType: 'customer',
      data: { orderId },
      sendBoth: true, // SMS + WhatsApp
    })
  }

  /**
   * 7. PAYMENT_FAILED - When payment fails
   * Sends BOTH SMS and WhatsApp simultaneously
   */
  async sendPaymentFailed(orderId: string): Promise<void> {
    await this.sendNotification({
      trigger: 'PAYMENT_FAILED',
      recipientType: 'customer',
      data: { orderId },
      sendBoth: true, // SMS + WhatsApp
    })
  }

  /**
   * 8. CUSTOMER_NOTE - When admin adds customer note
   * Sends BOTH SMS and WhatsApp simultaneously
   */
  async sendCustomerNote(orderId: string, noteContent: string): Promise<void> {
    await this.sendNotification({
      trigger: 'CUSTOMER_NOTE',
      recipientType: 'customer',
      data: { orderId, noteContent },
      sendBoth: true, // SMS + WhatsApp
    })
  }

  /**
   * 9. NEW_ACCOUNT - When customer registers
   * Sends BOTH SMS and WhatsApp simultaneously
   */
  async sendNewAccount(userId: string): Promise<void> {
    await this.sendNotification({
      trigger: 'NEW_ACCOUNT',
      recipientType: 'customer',
      data: { userId },
      sendBoth: true, // SMS + WhatsApp
    })
  }

  /**
   * 10. PASSWORD_RESET - When password reset is requested (admin only)
   * Sends BOTH SMS and WhatsApp simultaneously
   */
  async sendPasswordReset(
    recipientPhone: string,
    resetCode: string,
    customerName: string
  ): Promise<void> {
    await this.sendNotification({
      trigger: 'PASSWORD_RESET',
      recipientType: 'customer',
      data: { recipientPhone, resetCode, customerName },
      sendBoth: true, // SMS + WhatsApp
    })
  }

  /**
   * 11. LOYALTY_POINTS_EARNED - When customer earns points
   * Sends BOTH SMS and WhatsApp simultaneously
   */
  async sendLoyaltyPointsEarned(
    userId: string,
    pointsEarned: number,
    pointsBalance: number,
    orderNumber: string
  ): Promise<void> {
    await this.sendNotification({
      trigger: 'LOYALTY_POINTS_EARNED',
      recipientType: 'customer',
      data: {
        userId,
        pointsEarned,
        pointsBalance,
        pointsValue: pointsBalance * 10, // 1 point = 10 CFA
        orderNumber,
      },
      sendBoth: true, // SMS + WhatsApp
    })
  }

  /**
   * 12. ABANDONED_CART - Cart abandonment reminder
   * Sends BOTH SMS and WhatsApp simultaneously
   */
  async sendAbandonedCartReminder(
    recipientPhone: string,
    customerName: string,
    cartItemsCount: number,
    cartItemsList: string,
    cartTotal: string
  ): Promise<void> {
    await this.sendNotification({
      trigger: 'ABANDONED_CART',
      recipientType: 'customer',
      data: {
        recipientPhone,
        customerName,
        cartItemsCount,
        cartItemsList,
        cartTotal,
      },
      sendBoth: true, // SMS + WhatsApp
    })
  }

  /**
   * 13. BACK_IN_STOCK - Product back in stock
   * Sends BOTH SMS and WhatsApp simultaneously
   */
  async sendBackInStock(productId: string, userId: string): Promise<void> {
    await this.sendNotification({
      trigger: 'BACK_IN_STOCK',
      recipientType: 'customer',
      data: { productId, userId },
      sendBoth: true, // SMS + WhatsApp
    })
  }

  // =========================================================================
  // ADMIN NOTIFICATIONS
  // =========================================================================

  /**
   * 14. NEW_ORDER_ADMIN - New order alert for admin
   * Sends BOTH SMS and WhatsApp simultaneously
   */
  async sendNewOrderAdmin(orderId: string): Promise<void> {
    await this.sendNotification({
      trigger: 'NEW_ORDER_ADMIN',
      recipientType: 'admin',
      data: { orderId },
      sendBoth: true, // SMS + WhatsApp
    })
  }

  /**
   * 15. PAYMENT_RECEIVED_ADMIN - Payment confirmation for admin
   * Sends BOTH SMS and WhatsApp simultaneously
   */
  async sendPaymentReceivedAdmin(orderId: string): Promise<void> {
    await this.sendNotification({
      trigger: 'PAYMENT_RECEIVED_ADMIN',
      recipientType: 'admin',
      data: { orderId },
      sendBoth: true, // SMS + WhatsApp
    })
  }

  /**
   * 16. LOW_STOCK_ADMIN - Low stock alert
   * Sends BOTH SMS and WhatsApp simultaneously
   */
  async sendLowStockAlert(productId: string): Promise<void> {
    await this.sendNotification({
      trigger: 'LOW_STOCK_ADMIN',
      recipientType: 'admin',
      data: { productId },
      sendBoth: true, // SMS + WhatsApp
    })
  }

  /**
   * 17. OUT_OF_STOCK_ADMIN - Out of stock alert
   * Sends BOTH SMS and WhatsApp simultaneously
   */
  async sendOutOfStockAlert(productId: string): Promise<void> {
    await this.sendNotification({
      trigger: 'OUT_OF_STOCK_ADMIN',
      recipientType: 'admin',
      data: { productId },
      sendBoth: true, // SMS + WhatsApp
    })
  }

  /**
   * 18. NEW_CUSTOMER_ADMIN - New customer registration alert
   * Sends BOTH SMS and WhatsApp simultaneously
   */
  async sendNewCustomerAlert(userId: string): Promise<void> {
    await this.sendNotification({
      trigger: 'NEW_CUSTOMER_ADMIN',
      recipientType: 'admin',
      data: { userId },
      sendBoth: true, // SMS + WhatsApp
    })
  }

  /**
   * 19. NEW_REVIEW_ADMIN - New review submitted alert
   * Sends BOTH SMS and WhatsApp simultaneously
   */
  async sendNewReviewAlert(reviewId: string): Promise<void> {
    await this.sendNotification({
      trigger: 'NEW_REVIEW_ADMIN',
      recipientType: 'admin',
      data: { reviewId },
      sendBoth: true, // SMS + WhatsApp
    })
  }

  /**
   * 20. DAILY_REPORT_ADMIN - Daily sales report (run at 8 PM)
   * Sends BOTH SMS and WhatsApp simultaneously
   */
  async sendDailySalesReport(): Promise<void> {
    try {
      // Calculate today's stats
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const [
        orders,
        newCustomers,
        totalCustomers,
        lowStockProducts,
      ] = await Promise.all([
        prisma.order.findMany({
          where: { createdAt: { gte: today } },
          include: { items: true },
        }),
        prisma.user.count({
          where: { role: 'CUSTOMER', createdAt: { gte: today } },
        }),
        prisma.user.count({ where: { role: 'CUSTOMER' } }),
        prisma.product.count({
          where: {
            stock: { lte: prisma.product.fields.lowStockThreshold },
          },
        }),
      ])

      const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0)
      const productsSold = orders.reduce(
        (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
        0
      )

      await this.sendNotification({
        trigger: 'DAILY_REPORT_ADMIN',
        recipientType: 'admin',
        data: {
          totalRevenue: formatAmount(totalRevenue),
          ordersCount: orders.length,
          pendingOrders: orders.filter((o) => o.status === 'PENDING').length,
          processingOrders: orders.filter((o) => o.status === 'PROCESSING').length,
          deliveredOrders: orders.filter((o) => o.status === 'DELIVERED').length,
          cancelledOrders: orders.filter((o) => o.status === 'CANCELLED').length,
          newCustomers,
          totalCustomers,
          productsSold,
          lowStockProducts,
        },
        sendBoth: true, // SMS + WhatsApp
      })
    } catch (error) {
      console.error('Error sending daily sales report:', error)
    }
  }

  // =========================================================================
  // NEW NOTIFICATIONS (Invoice, Review Request, Payment Reminders)
  // =========================================================================

  /**
   * 21. INVOICE_CREATED - Send invoice link after order placement
   * Sends BOTH SMS and WhatsApp simultaneously
   */
  async sendInvoiceCreated(orderId: string, invoiceUrl: string): Promise<void> {
    // Get invoice details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { invoice: true },
    })

    await this.sendNotification({
      trigger: 'INVOICE_CREATED',
      recipientType: 'customer',
      data: {
        orderId,
        invoice_number: order?.invoice?.invoiceNumber || order?.orderNumber,
        invoice_url: invoiceUrl,
      },
      sendBoth: true,
    })
  }

  /**
   * 22. INVOICE_PAID - Send notification when invoice is marked as paid
   * Sends BOTH SMS and WhatsApp simultaneously
   */
  async sendInvoicePaid(orderId: string, invoiceUrl: string): Promise<void> {
    // Get invoice details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { invoice: true },
    })

    await this.sendNotification({
      trigger: 'INVOICE_PAID',
      recipientType: 'customer',
      data: {
        orderId,
        invoice_number: order?.invoice?.invoiceNumber || order?.orderNumber,
        invoice_url: invoiceUrl,
      },
      sendBoth: true,
    })
  }

  /**
   * INVOICE PDF ATTACHMENT - Send invoice PDF as WhatsApp media
   * This is an ADDITIONAL notification that sends the actual PDF file
   * Called after sendInvoiceCreated to send PDF attachment separately
   */
  async sendInvoicePdfCreated(orderId: string, invoiceUrl: string): Promise<void> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: { select: { phone: true, whatsappNumber: true, name: true } },
          invoice: true,
        },
      })

      if (!order) {
        console.error('[InvoicePDF] Order not found:', orderId)
        return
      }

      const customerPhone = order.user?.whatsappNumber || order.user?.phone
      if (!customerPhone) {
        console.error('[InvoicePDF] No customer phone for order:', orderId)
        return
      }

      const invoiceNumber = order.invoice?.invoiceNumber || order.orderNumber

      // Simple message - PDF is attached as media
      const message = `Facture #${invoiceNumber} - Cave Express`

      // Send WhatsApp with PDF as media attachment (not logo)
      const result = await smsingService.sendWhatsAppBusiness({
        to: customerPhone,
        message,
        mediaUrl: invoiceUrl, // This sends the PDF as attachment
      })

      console.log(`[InvoicePDF Created] WhatsApp=${result.success} for order ${order.orderNumber}`)

      await this.logNotification({
        trigger: 'INVOICE_CREATED',
        channel: 'WHATSAPP',
        recipientPhone: customerPhone,
        recipientName: order.user?.name || 'Client',
        content: `[PDF] ${message}`,
        status: result.success ? 'sent' : 'failed',
        providerId: result.messageId,
        orderId,
      })
    } catch (error) {
      console.error('[InvoicePDF Created] Error:', error)
    }
  }

  /**
   * INVOICE PDF ATTACHMENT - Send paid invoice PDF as WhatsApp media
   * This is an ADDITIONAL notification that sends the actual PDF file
   * Called after sendInvoicePaid to send PDF attachment separately
   */
  async sendInvoicePdfPaid(orderId: string, invoiceUrl: string): Promise<void> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: { select: { phone: true, whatsappNumber: true, name: true } },
          invoice: true,
        },
      })

      if (!order) {
        console.error('[InvoicePDF Paid] Order not found:', orderId)
        return
      }

      const customerPhone = order.user?.whatsappNumber || order.user?.phone
      if (!customerPhone) {
        console.error('[InvoicePDF Paid] No customer phone for order:', orderId)
        return
      }

      const invoiceNumber = order.invoice?.invoiceNumber || order.orderNumber

      // Simple message - PDF is attached as media
      const message = `Facture PAYEE #${invoiceNumber} - Cave Express`

      // Send WhatsApp with PDF as media attachment (not logo)
      const result = await smsingService.sendWhatsAppBusiness({
        to: customerPhone,
        message,
        mediaUrl: invoiceUrl, // This sends the PDF as attachment
      })

      console.log(`[InvoicePDF Paid] WhatsApp=${result.success} for order ${order.orderNumber}`)

      await this.logNotification({
        trigger: 'INVOICE_PAID',
        channel: 'WHATSAPP',
        recipientPhone: customerPhone,
        recipientName: order.user?.name || 'Client',
        content: `[PDF] ${message}`,
        status: result.success ? 'sent' : 'failed',
        providerId: result.messageId,
        orderId,
      })
    } catch (error) {
      console.error('[InvoicePDF Paid] Error:', error)
    }
  }

  /**
   * 23. REVIEW_REQUEST - Ask for Trustpilot review after delivery
   * Sends BOTH SMS and WhatsApp simultaneously
   * Should be scheduled 24 hours after delivery, not sent immediately
   */
  async sendReviewRequest(orderId: string): Promise<void> {
    await this.sendNotification({
      trigger: 'REVIEW_REQUEST',
      recipientType: 'customer',
      data: { orderId },
      sendBoth: true,
    })
  }

  /**
   * Schedule review request to be sent 24 hours after delivery
   * Called when order status changes to DELIVERED
   */
  async scheduleReviewRequest(orderId: string): Promise<void> {
    try {
      const now = new Date()
      // Schedule for 24 hours after delivery
      const delayHours = 24
      const scheduledTime = new Date(now.getTime() + delayHours * 60 * 60 * 1000)

      await prisma.scheduledNotification.create({
        data: {
          trigger: 'REVIEW_REQUEST',
          orderId,
          scheduledFor: scheduledTime,
          status: 'pending',
        },
      })

      console.log(`📅 Scheduled review request for order ${orderId} at ${scheduledTime.toISOString()}`)
    } catch (error) {
      console.error('Error scheduling review request:', error)
    }
  }

  /**
   * 24. PAYMENT_REMINDER_1 - 1 day after unpaid order
   * Sends BOTH SMS and WhatsApp simultaneously
   */
  async sendPaymentReminder1(orderId: string): Promise<void> {
    await this.sendNotification({
      trigger: 'PAYMENT_REMINDER_1',
      recipientType: 'customer',
      data: { orderId },
      sendBoth: true,
    })
  }

  /**
   * 25. PAYMENT_REMINDER_2 - 3 days after unpaid order
   * Sends BOTH SMS and WhatsApp simultaneously
   */
  async sendPaymentReminder2(orderId: string): Promise<void> {
    await this.sendNotification({
      trigger: 'PAYMENT_REMINDER_2',
      recipientType: 'customer',
      data: { orderId },
      sendBoth: true,
    })
  }

  /**
   * 26. PAYMENT_REMINDER_3 - 5 days after unpaid order (final reminder)
   * Sends BOTH SMS and WhatsApp simultaneously
   */
  async sendPaymentReminder3(orderId: string): Promise<void> {
    await this.sendNotification({
      trigger: 'PAYMENT_REMINDER_3',
      recipientType: 'customer',
      data: { orderId },
      sendBoth: true,
    })
  }

  // =========================================================================
  // PAYMENT REMINDER SCHEDULING
  // =========================================================================

  /**
   * Schedule payment reminders for a new unpaid order
   * Called when order is created with PENDING payment status
   */
  async schedulePaymentReminders(orderId: string): Promise<void> {
    try {
      // Get follow-up settings
      const settings = await prisma.paymentFollowUpSettings.findFirst()
      if (!settings || !settings.enabled) {
        console.log('Payment follow-up reminders are disabled')
        return
      }

      const now = new Date()
      const scheduledNotifications = []

      // Schedule reminder 1 (1 day later)
      if (settings.reminder1Enabled) {
        const reminder1Time = new Date(now.getTime() + settings.reminder1Delay * 60 * 60 * 1000)
        scheduledNotifications.push({
          trigger: 'PAYMENT_REMINDER_1' as const,
          orderId,
          scheduledFor: reminder1Time,
          reminderNumber: 1,
          status: 'pending',
        })
      }

      // Schedule reminder 2 (3 days later)
      if (settings.reminder2Enabled) {
        const reminder2Time = new Date(now.getTime() + settings.reminder2Delay * 60 * 60 * 1000)
        scheduledNotifications.push({
          trigger: 'PAYMENT_REMINDER_2' as const,
          orderId,
          scheduledFor: reminder2Time,
          reminderNumber: 2,
          status: 'pending',
        })
      }

      // Schedule reminder 3 (5 days later)
      if (settings.reminder3Enabled) {
        const reminder3Time = new Date(now.getTime() + settings.reminder3Delay * 60 * 60 * 1000)
        scheduledNotifications.push({
          trigger: 'PAYMENT_REMINDER_3' as const,
          orderId,
          scheduledFor: reminder3Time,
          reminderNumber: 3,
          status: 'pending',
        })
      }

      // Create all scheduled notifications
      if (scheduledNotifications.length > 0) {
        await prisma.scheduledNotification.createMany({
          data: scheduledNotifications,
        })
        console.log(`📅 Scheduled ${scheduledNotifications.length} payment reminders for order ${orderId}`)
      }
    } catch (error) {
      console.error('Error scheduling payment reminders:', error)
    }
  }

  /**
   * Cancel all pending payment reminders for an order
   * Called when payment is received or order is cancelled
   */
  async cancelPaymentReminders(orderId: string): Promise<void> {
    try {
      const result = await prisma.scheduledNotification.updateMany({
        where: {
          orderId,
          status: 'pending',
          trigger: {
            in: ['PAYMENT_REMINDER_1', 'PAYMENT_REMINDER_2', 'PAYMENT_REMINDER_3'],
          },
        },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
        },
      })

      if (result.count > 0) {
        console.log(`❌ Cancelled ${result.count} payment reminders for order ${orderId}`)
      }
    } catch (error) {
      console.error('Error cancelling payment reminders:', error)
    }
  }

  /**
   * Process due scheduled notifications
   * Should be called by a cron job every few minutes
   */
  async processScheduledNotifications(): Promise<void> {
    try {
      const now = new Date()

      // Find all pending notifications that are due
      const dueNotifications = await prisma.scheduledNotification.findMany({
        where: {
          status: 'pending',
          scheduledFor: { lte: now },
        },
        include: {
          order: {
            select: {
              id: true,
              paymentStatus: true,
              status: true,
            },
          },
        },
      })

      for (const notification of dueNotifications) {
        // Skip if order is already paid or cancelled
        if (
          notification.order.paymentStatus === 'COMPLETED' ||
          notification.order.status === 'CANCELLED'
        ) {
          await prisma.scheduledNotification.update({
            where: { id: notification.id },
            data: { status: 'cancelled', cancelledAt: new Date() },
          })
          continue
        }

        try {
          // Send the notification based on trigger type
          switch (notification.trigger) {
            case 'PAYMENT_REMINDER_1':
              await this.sendPaymentReminder1(notification.orderId)
              break
            case 'PAYMENT_REMINDER_2':
              await this.sendPaymentReminder2(notification.orderId)
              break
            case 'PAYMENT_REMINDER_3':
              await this.sendPaymentReminder3(notification.orderId)
              break
            case 'REVIEW_REQUEST':
              await this.sendReviewRequest(notification.orderId)
              break
          }

          // Mark as sent
          await prisma.scheduledNotification.update({
            where: { id: notification.id },
            data: { status: 'sent', sentAt: new Date() },
          })

          console.log(`✅ Sent scheduled ${notification.trigger} for order ${notification.orderId}`)
        } catch (error) {
          // Mark as failed and increment attempts
          await prisma.scheduledNotification.update({
            where: { id: notification.id },
            data: {
              status: notification.attempts >= 2 ? 'failed' : 'pending',
              attempts: notification.attempts + 1,
              errorMessage: String(error),
            },
          })
          console.error(`Failed to send ${notification.trigger}:`, error)
        }
      }
    } catch (error) {
      console.error('Error processing scheduled notifications:', error)
    }
  }

  /**
   * Send OTP code (existing functionality)
   */
  async sendOTP(phone: string, code: string): Promise<NotificationResult> {
    const message = `Votre code de vérification Cave Express est: ${code}\n\nCe code expire dans 10 minutes.\n\nNe partagez jamais ce code.`

    try {
      // Try dual send (SMS + WhatsApp)
      const dualResult = await smsingService.sendDual({
        to: phone,
        message,
      })

      if (dualResult.success) {
        return {
          success: true,
          channel: dualResult.channels.sms.success ? 'SMS' : 'WHATSAPP',
          messageId: dualResult.channels.sms.success
            ? dualResult.channels.sms.messageId
            : dualResult.channels.whatsapp.messageId,
        }
      }

      // Fallback to WhatsApp Cloud OTP
      const cloudResult = await smsingService.sendWhatsAppCloudOTP({
        to: phone,
        otpCode: code,
        language: 'fr',
      })

      if (cloudResult.success) {
        return {
          success: true,
          channel: 'WHATSAPP_CLOUD',
          messageId: cloudResult.messageId,
        }
      }

      return { success: false, error: 'All channels failed' }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}

export const notificationService = new NotificationService()
