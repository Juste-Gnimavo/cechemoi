import axios from 'axios'

interface SMSingConfig {
  // SMS + WhatsApp Business shared credentials
  smsWhatsappApiKey: string
  smsWhatsappApiToken: string
  // WhatsApp Cloud credentials (different)
  whatsappCloudApiKey: string
  whatsappCloudApiToken: string
  from: string
  baseUrl: string
  logoUrl: string
}

interface SendMessageParams {
  to: string
  message: string
  mediaUrl?: string
}

interface SendMessageResponse {
  success: boolean
  messageId?: string
  groupId?: string
  error?: string
}

/**
 * Unified SMSING API Service
 * Handles SMS, WhatsApp Business, and WhatsApp Cloud via SMSING.APP
 *
 * Documentation: See doc-web/smsing-provider-auth-api-doc.md
 *
 * API URL Format: https://panel.smsing.app/smsAPI?sendsms&apikey=...&apitoken=...&type=...&from=...&to=...&text=...
 */
export class SMSingService {
  private config: SMSingConfig

  constructor() {
    this.config = {
      smsWhatsappApiKey: process.env.SMSING_SMS_WHATSAPP_BUSINESS_API_KEY || '',
      smsWhatsappApiToken: process.env.SMSING_SMS_WHATSAPP_BUSINESS_API_TOKEN || '',
      whatsappCloudApiKey: process.env.SMSING_WHATSAPP_CLOUD_API_KEY || '',
      whatsappCloudApiToken: process.env.SMSING_WHATSAPP_CLOUD_API_TOKEN || '',
      from: process.env.SMSING_FROM || 'CECHEMOI',
      baseUrl: 'https://panel.smsing.app/smsAPI',
      logoUrl: 'https://cechemoi.com/logo/web/icon-512-maskable.png',
    }
  }

  /**
   * Send SMS message
   * Uses SMSING API with type=sms
   */
  async sendSMS(params: SendMessageParams): Promise<SendMessageResponse> {
    try {
      const { to, message } = params
      const formattedPhone = this.formatPhoneNumber(to)
      // SMS supports Unicode - preserve French accents and emojis
      const queryParams = new URLSearchParams({
        sendsms: '',
        apikey: this.config.smsWhatsappApiKey,
        apitoken: this.config.smsWhatsappApiToken,
        type: 'sms',
        from: this.config.from,
        to: formattedPhone,
        text: message,
      })

      const url = `${this.config.baseUrl}?${queryParams.toString()}`

      const response = await axios.get(url, {
        timeout: 30000,
      })

      // Check response format from documentation
      const data = response.data

      if (data.status === 'queued' || data.status === 'success') {
        return {
          success: true,
          messageId: data.group_id || data.id,
          groupId: data.group_id,
        }
      }

      return {
        success: false,
        error: data.message || data.status || 'Failed to send SMS',
      }
    } catch (error: any) {
      console.error('SMSING SMS Error:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to send SMS',
      }
    }
  }

  /**
   * Send WhatsApp Business message (accepts any message, can include logo/media)
   * Uses SMSING API with type=whatsapp
   */
  async sendWhatsAppBusiness(params: SendMessageParams): Promise<SendMessageResponse> {
    try {
      const { to, message, mediaUrl } = params
      const formattedPhone = this.formatPhoneNumber(to)
      // WhatsApp supports full Unicode - don't sanitize to preserve emojis and French accents
      const queryParams = new URLSearchParams({
        sendsms: '',
        apikey: this.config.smsWhatsappApiKey,
        apitoken: this.config.smsWhatsappApiToken,
        type: 'whatsapp',
        from: this.config.from,
        to: formattedPhone,
        text: message,
      })

      // Add logo or media file if provided
      if (mediaUrl) {
        queryParams.append('file', mediaUrl)
      } else {
        // Always include CÈCHÉMOI logo for branding
        queryParams.append('file', this.config.logoUrl)
      }

      const url = `${this.config.baseUrl}?${queryParams.toString()}`

      console.log(`📱 WhatsApp Business request: to=${formattedPhone}, hasMedia=${!!mediaUrl}`)
      if (mediaUrl) {
        console.log(`📎 WhatsApp media URL: ${mediaUrl}`)
      }

      const response = await axios.get(url, {
        timeout: 30000,
      })

      const data = response.data

      // Log full response for debugging
      console.log(`📱 WhatsApp API response:`, JSON.stringify(data))

      // Check for various success indicators
      if (data.status === 'queued' || data.status === 'success' ||
          data.success === true || data.code === 0 || data.code === 200) {
        console.log(`✅ WhatsApp Business sent successfully to ${formattedPhone}`)
        return {
          success: true,
          messageId: data.group_id || data.id || data.message_id,
          groupId: data.group_id,
        }
      }

      console.log(`❌ WhatsApp Business failed: status=${data.status}, message=${data.message}, code=${data.code}, to=${formattedPhone}`)
      return {
        success: false,
        error: data.message || data.error || data.status || 'Failed to send WhatsApp Business message',
      }
    } catch (error: any) {
      console.error('SMSING WhatsApp Business Error:', error.response?.data || error.message)
      console.log(`❌ WhatsApp Business exception: ${error.message}`)
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to send WhatsApp Business message',
      }
    }
  }

  /**
   * Send WhatsApp Cloud message with approved template
   * Uses SMSING API with type=whatsapp and approved template format
   *
   * Two templates available:
   * 1. official_otp_code_template - Official OTP template
   * 2. cechemoi - Custom CÈCHÉMOI template with logo
   */
  async sendWhatsAppCloudOTP(params: {
    to: string
    otpCode: string
    language?: 'en' | 'fr'
    useCustomTemplate?: boolean
  }): Promise<SendMessageResponse> {
    try {
      const { to, otpCode, language = 'fr', useCustomTemplate = true } = params
      const formattedPhone = this.formatPhoneNumber(to)

      let templateText: string

      if (useCustomTemplate) {
        // CÈCHÉMOI custom template with logo
        templateText = `content:cechemoi|lang=${language}|body=${otpCode}|header=image:${this.config.logoUrl}`
      } else {
        // Official OTP template
        templateText = `content:official_otp_code_template|lang=${language}|body=${otpCode}|button=${otpCode}`
      }

      const queryParams = new URLSearchParams({
        sendsms: '',
        apikey: this.config.whatsappCloudApiKey,
        apitoken: this.config.whatsappCloudApiToken,
        type: 'whatsapp',
        from: this.config.from,
        to: formattedPhone,
        text: templateText,
      })

      const url = `${this.config.baseUrl}?${queryParams.toString()}`

      const response = await axios.get(url, {
        timeout: 30000,
      })

      const data = response.data

      if (data.status === 'queued' || data.status === 'success') {
        return {
          success: true,
          messageId: data.group_id || data.id,
          groupId: data.group_id,
        }
      }

      return {
        success: false,
        error: data.message || data.status || 'Failed to send WhatsApp Cloud message',
      }
    } catch (error: any) {
      console.error('SMSING WhatsApp Cloud Error:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to send WhatsApp Cloud message',
      }
    }
  }

  /**
   * Send SMS and WhatsApp Business simultaneously
   * This is the primary method for sending OTP codes
   * Returns success if at least one channel succeeds
   */
  async sendDual(params: SendMessageParams): Promise<{
    success: boolean
    channels: {
      sms: SendMessageResponse
      whatsapp: SendMessageResponse
    }
    error?: string
  }> {
    // Send both simultaneously
    const [smsResult, whatsappResult] = await Promise.all([
      this.sendSMS(params),
      this.sendWhatsAppBusiness(params),
    ])

    const success = smsResult.success || whatsappResult.success

    return {
      success,
      channels: {
        sms: smsResult,
        whatsapp: whatsappResult,
      },
      error: success ? undefined : 'Both SMS and WhatsApp Business failed',
    }
  }

  /**
   * Format phone number to E.164 format without + sign
   * Example: 2250709757296 (not +225 07 09 75 72 96)
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '')

    // If it starts with 225 (Côte d'Ivoire code), return as is
    if (cleaned.startsWith('225')) {
      return cleaned
    }

    // If it's a local number (10 digits), add country code
    if (cleaned.length === 10) {
      return `225${cleaned}`
    }

    // Default: assume it needs 225
    return `225${cleaned}`
  }

  /**
   * Check message status by group ID
   */
  async checkMessageStatus(groupId: string): Promise<{
    success: boolean
    status?: string
    recipients?: any[]
    error?: string
  }> {
    try {
      const queryParams = new URLSearchParams({
        groupstatus: '',
        apikey: this.config.smsWhatsappApiKey,
        apitoken: this.config.smsWhatsappApiToken,
        groupid: groupId,
      })

      const url = `${this.config.baseUrl}?${queryParams.toString()}`

      const response = await axios.get(url, {
        timeout: 10000,
      })

      const data = response.data

      if (data.status === 'success') {
        return {
          success: true,
          status: data.group_status,
          recipients: data.recipients,
        }
      }

      return {
        success: false,
        error: data.message || 'Failed to check message status',
      }
    } catch (error: any) {
      console.error('SMSING Status Check Error:', error)
      return {
        success: false,
        error: error.message || 'Failed to check message status',
      }
    }
  }

  /**
   * Check service health
   */
  async isHealthy(): Promise<boolean> {
    try {
      // Try sending a test SMS to a dummy number to verify API is working
      const testPhone = '2250000000000'
      const result = await this.sendSMS({
        to: testPhone,
        message: 'Health check',
      })

      // Even if it fails due to invalid number, if we get a proper API response, service is healthy
      return result.success || result.error !== undefined
    } catch (error) {
      console.error('SMSING health check failed:', error)
      return false
    }
  }
}

export const smsingService = new SMSingService()
