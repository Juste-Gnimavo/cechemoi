import { prisma } from '@/lib/prisma'
import { notificationService } from '@/lib/notification-service'

export class OTPService {
  private readonly OTP_LENGTH = 4
  private readonly OTP_EXPIRY_MINUTES = 10
  private readonly MAX_ATTEMPTS = 5

  /**
   * Generate OTP code for a user (for 2FA purposes)
   */
  generateOTP(userId: string, purpose: '2fa' | 'verify' | 'reset'): { code: string } {
    // Generate random 6-digit code for 2FA
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    return { code }
  }

  /**
   * Generate and send OTP code
   */
  async generateAndSend(phone: string, purpose: 'login' | 'register' | 'verify' | 'reset'): Promise<{
    success: boolean
    message?: string
    error?: string
  }> {
    try {
      // Check rate limiting - max 10 OTPs per phone per hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      const recentOtps = await prisma.otpCode.count({
        where: {
          phone,
          createdAt: {
            gte: oneHourAgo,
          },
        },
      })

      if (recentOtps >= 10) {
        return {
          success: false,
          error: 'Trop de tentatives. Veuillez réessayer dans 1 heure.',
        }
      }

      // Generate random 4-digit code
      const code = this.generateCode()

      // Calculate expiry time
      const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000)

      // Save OTP to database
      await prisma.otpCode.create({
        data: {
          phone,
          code,
          purpose,
          expiresAt,
        },
      })

      // Send OTP via notification service (WhatsApp/SMS with failover)
      const result = await notificationService.sendOTP(phone, code)

      if (!result.success) {
        return {
          success: false,
          error: 'Échec de l\'envoi du code. Veuillez réessayer.',
        }
      }

      return {
        success: true,
        message: `Code de vérification envoyé au ${phone} via ${result.channel}`,
      }
    } catch (error: any) {
      console.error('Error generating OTP:', error)
      return {
        success: false,
        error: 'Une erreur est survenue. Veuillez réessayer.',
      }
    }
  }

  /**
   * Verify OTP code
   */
  async verify(phone: string, code: string, purpose: string): Promise<{
    success: boolean
    userId?: string
    error?: string
  }> {
    try {
      // Find valid OTP
      const otpRecord = await prisma.otpCode.findFirst({
        where: {
          phone,
          code,
          purpose,
          verified: false,
          expiresAt: {
            gte: new Date(),
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      if (!otpRecord) {
        return {
          success: false,
          error: 'Code invalide ou expiré.',
        }
      }

      // Mark as verified
      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { verified: true },
      })

      // If associated with a user, return user ID
      if (otpRecord.userId) {
        return {
          success: true,
          userId: otpRecord.userId,
        }
      }

      return {
        success: true,
      }
    } catch (error: any) {
      console.error('Error verifying OTP:', error)
      return {
        success: false,
        error: 'Une erreur est survenue lors de la vérification.',
      }
    }
  }

  /**
   * Verify phone number for user
   */
  async verifyPhoneNumber(phone: string, code: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const verification = await this.verify(phone, code, 'verify')

      if (!verification.success) {
        return verification
      }

      // Update user's phone verification status
      await prisma.user.updateMany({
        where: { phone },
        data: {
          phoneVerified: new Date(),
        },
      })

      return {
        success: true,
      }
    } catch (error: any) {
      console.error('Error verifying phone number:', error)
      return {
        success: false,
        error: 'Une erreur est survenue.',
      }
    }
  }

  /**
   * Clean up expired OTPs (run periodically)
   */
  async cleanupExpired(): Promise<number> {
    try {
      const result = await prisma.otpCode.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      })

      return result.count
    } catch (error) {
      console.error('Error cleaning up expired OTPs:', error)
      return 0
    }
  }

  /**
   * Generate random numeric code
   */
  private generateCode(): string {
    const code = Math.floor(1000 + Math.random() * 9000).toString()
    return code
  }

  /**
   * Format phone number for consistency
   */
  formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '')

    // If it starts with 225, add +
    if (cleaned.startsWith('225')) {
      return `+${cleaned}`
    }

    // If it's a local number (10 digits), add country code
    if (cleaned.length === 10) {
      return `+225${cleaned}`
    }

    // If it already has +, return as is
    if (phone.startsWith('+')) {
      return phone
    }

    // Default: assume it needs +225
    return `+225${cleaned}`
  }
}

export const otpService = new OTPService()
