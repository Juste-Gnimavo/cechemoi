import nodemailer from 'nodemailer'

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null

  constructor() {
    this.initializeTransporter()
  }

  private initializeTransporter() {
    try {
      // Check if SMTP credentials are configured
      if (!process.env.SMTPHOST || !process.env.SMTPUSERNAME || !process.env.SMTPPASSWORD) {
        console.warn('SMTP credentials not configured. Email service disabled.')
        return
      }

      const port = parseInt(process.env.SMTPPORT || '465')

      this.transporter = nodemailer.createTransport({
        host: process.env.SMTPHOST,
        port: port,
        secure: port === 465, // true for 465, false for other ports
        auth: {
          user: process.env.SMTPUSERNAME,
          pass: process.env.SMTPPASSWORD,
        },
      })

      console.log('Email service initialized with', process.env.SMTPHOST)
    } catch (error) {
      console.error('Failed to initialize email service:', error)
      this.transporter = null
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email service not configured')
      return false
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"CAVE EXPRESS" <${process.env.SMTPREPLYTO || process.env.SMTPUSERNAME}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        replyTo: process.env.SMTPREPLYTO,
      })

      console.log('Email sent:', info.messageId)
      return true
    } catch (error) {
      console.error('Failed to send email:', error)
      return false
    }
  }

  async sendPasswordResetEmail(to: string, name: string, resetUrl: string): Promise<boolean> {
    const subject = 'Réinitialisation de mot de passe - CAVE EXPRESS'

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background: white;
            padding: 30px;
            border: 1px solid #e0e0e0;
            border-top: none;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: #667eea;
            color: white !important;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            background: #f5f5f5;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-radius: 0 0 8px 8px;
            border: 1px solid #e0e0e0;
            border-top: none;
          }
          .warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 12px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🍷 CAVE EXPRESS</h1>
            <p>Réinitialisation de mot de passe</p>
          </div>
          <div class="content">
            <p>Bonjour <strong>${name}</strong>,</p>

            <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte administrateur CAVE EXPRESS.</p>

            <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>

            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
            </div>

            <p style="font-size: 12px; color: #666;">
              Ou copiez ce lien dans votre navigateur :<br>
              <a href="${resetUrl}">${resetUrl}</a>
            </p>

            <div class="warning">
              <strong>⚠️ Important :</strong>
              <ul style="margin: 10px 0;">
                <li>Ce lien expire dans <strong>1 heure</strong></li>
                <li>Il ne peut être utilisé qu'une seule fois</li>
                <li>Si vous n'avez pas fait cette demande, ignorez cet email</li>
              </ul>
            </div>

            <p>Pour votre sécurité, votre mot de passe actuel reste valide jusqu'à ce que vous en créiez un nouveau.</p>

            <p>
              Cordialement,<br>
              <strong>L'équipe CAVE EXPRESS</strong>
            </p>
          </div>
          <div class="footer">
            <p>CAVE EXPRESS - Votre cave à vin en ligne</p>
            <p>📞 +225 05 56 79 14 31 | 🌐 https://cave-express.ci</p>
            <p style="margin-top: 10px;">
              Cet email a été envoyé automatiquement, merci de ne pas y répondre.
            </p>
          </div>
        </div>
      </body>
      </html>
    `

    const text = `
Bonjour ${name},

Vous avez demandé la réinitialisation de votre mot de passe pour votre compte administrateur CAVE EXPRESS.

Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :
${resetUrl}

⚠️ Important :
- Ce lien expire dans 1 heure
- Il ne peut être utilisé qu'une seule fois
- Si vous n'avez pas fait cette demande, ignorez cet email

Cordialement,
L'équipe CAVE EXPRESS

---
CAVE EXPRESS - Votre cave à vin en ligne
📞 +225 05 56 79 14 31 | 🌐 https://cave-express.ci
    `

    return this.sendEmail({ to, subject, html, text })
  }

  async sendPasswordChangedEmail(to: string, name: string): Promise<boolean> {
    const subject = 'Mot de passe modifié - CAVE EXPRESS'

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background: white;
            padding: 30px;
            border: 1px solid #e0e0e0;
            border-top: none;
          }
          .footer {
            background: #f5f5f5;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-radius: 0 0 8px 8px;
            border: 1px solid #e0e0e0;
            border-top: none;
          }
          .alert {
            background: #fee2e2;
            border-left: 4px solid #ef4444;
            padding: 12px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ CAVE EXPRESS</h1>
            <p>Confirmation de changement de mot de passe</p>
          </div>
          <div class="content">
            <p>Bonjour <strong>${name}</strong>,</p>

            <p>Votre mot de passe a été réinitialisé avec succès.</p>

            <p>Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>

            <div class="alert">
              <strong>🔒 Sécurité :</strong><br>
              Si vous n'êtes pas à l'origine de ce changement, contactez-nous immédiatement au +225 05 56 79 14 31
            </div>

            <p>
              Cordialement,<br>
              <strong>L'équipe CAVE EXPRESS</strong>
            </p>
          </div>
          <div class="footer">
            <p>CAVE EXPRESS - Votre cave à vin en ligne</p>
            <p>📞 +225 05 56 79 14 31 | 🌐 https://cave-express.ci</p>
          </div>
        </div>
      </body>
      </html>
    `

    const text = `
Bonjour ${name},

Votre mot de passe a été réinitialisé avec succès.

Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.

🔒 Sécurité :
Si vous n'êtes pas à l'origine de ce changement, contactez-nous immédiatement au +225 05 56 79 14 31

Cordialement,
L'équipe CAVE EXPRESS

---
CAVE EXPRESS - Votre cave à vin en ligne
📞 +225 05 56 79 14 31 | 🌐 https://cave-express.ci
    `

    return this.sendEmail({ to, subject, html, text })
  }

  async isHealthy(): Promise<boolean> {
    if (!this.transporter) {
      return false
    }

    try {
      await this.transporter.verify()
      return true
    } catch (error) {
      console.error('Email service health check failed:', error)
      return false
    }
  }
}

export const emailService = new EmailService()
