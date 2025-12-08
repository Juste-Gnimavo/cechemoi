'use client'

import { useState } from 'react'
import { Metadata } from 'next'
import { Phone, Mail, MapPin, Clock, Send, MessageCircle, Facebook, Instagram } from 'lucide-react'

// Custom WhatsApp icon component
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

// Custom TikTok icon component
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
    </svg>
  )
}

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500))

    setIsSubmitting(false)
    setSubmitted(true)
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <article className="max-w-none">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Nous Contacter
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          Notre équipe est à votre disposition pour répondre à toutes vos questions.
          N&apos;hésitez pas à nous contacter !
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contact Info */}
        <div className="space-y-6">
          {/* Company Info */}
          <div className="bg-gray-100 dark:bg-dark-800 rounded-xl p-6">
            <h2 className="text-gray-900 dark:text-white font-semibold text-xl mb-6">CÈCHÉMOI</h2>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-copper-500/10 dark:bg-copper-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="h-5 w-5 text-copper-500" />
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Téléphone</p>
                  <a href="tel:+2250759545410" className="text-gray-900 dark:text-white font-medium hover:text-copper-500 transition-colors">
                    +225 0759545410
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-copper-500/10 dark:bg-copper-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-copper-500" />
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Email</p>
                  <a href="mailto:cechemoicreations@gmail.com" className="text-gray-900 dark:text-white font-medium hover:text-copper-500 transition-colors">
                    cechemoicreations@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-copper-500/10 dark:bg-copper-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-5 w-5 text-copper-500" />
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Adresse</p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    Cocody Riviera Palmeraie<br />
                    Abidjan, Côte d&apos;Ivoire
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-copper-500/10 dark:bg-copper-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 text-copper-500" />
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Horaires de livraison</p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    Tous les jours de 06H à 23H
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Contact */}
          <div className="bg-gradient-to-br from-copper-500/10 dark:from-copper-500/20 to-transparent rounded-xl p-6 border border-copper-500/20 dark:border-copper-500/30">
            <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-4">Contact rapide</h3>
            <div className="space-y-3">
              <a
                href="https://wa.me/2250759545410"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-3 transition-colors"
              >
                <WhatsAppIcon className="h-5 w-5" />
                <span className="font-medium">Contactez-nous sur WhatsApp</span>
              </a>
              <a
                href="tel:+2250759545410"
                className="flex items-center gap-3 bg-gray-200 dark:bg-dark-700 hover:bg-gray-300 dark:hover:bg-dark-600 text-gray-900 dark:text-white rounded-lg px-4 py-3 transition-colors"
              >
                <Phone className="h-5 w-5 text-copper-500" />
                <span className="font-medium">Appelez-nous maintenant</span>
              </a>
            </div>
          </div>

          {/* Social Media */}
          <div className="bg-gray-100 dark:bg-dark-800 rounded-xl p-6">
            <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-4">Suivez-nous</h3>
            <div className="flex gap-3">
              <a
                href="https://web.facebook.com/cechemoi"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-gray-200 dark:bg-dark-700 hover:bg-[#1877F2] rounded-full flex items-center justify-center transition-colors group"
              >
                <Facebook className="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-white" />
              </a>
              <a
                href="https://www.instagram.com/cechemoi.ci"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-gray-200 dark:bg-dark-700 hover:bg-gradient-to-br hover:from-[#833AB4] hover:via-[#FD1D1D] hover:to-[#F77737] rounded-full flex items-center justify-center transition-all group"
              >
                <Instagram className="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-white" />
              </a>
              <a
                href="https://wa.me/2250759545410"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-gray-200 dark:bg-dark-700 hover:bg-[#25D366] rounded-full flex items-center justify-center transition-colors group"
              >
                <WhatsAppIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-white" />
              </a>
              <a
                href="https://www.tiktok.com/@cechemoi"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-gray-200 dark:bg-dark-700 hover:bg-black rounded-full flex items-center justify-center transition-colors group"
              >
                <TikTokIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-white" />
              </a>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-gray-100 dark:bg-dark-800 rounded-xl p-6">
          <h2 className="text-gray-900 dark:text-white font-semibold text-xl mb-6 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-copper-500" />
            Envoyez-nous un message
          </h2>

          {submitted ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-gray-900 dark:text-white font-semibold text-xl mb-2">Message envoyé !</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Merci de nous avoir contacté. Nous vous répondrons dans les plus brefs délais.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="text-copper-500 hover:underline"
              >
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-copper-500 transition-colors"
                    placeholder="Votre nom"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-copper-500 transition-colors"
                    placeholder="+225 XX XX XX XX XX"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-copper-500 transition-colors"
                  placeholder="votre@email.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sujet *
                </label>
                <select
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-copper-500 transition-colors"
                >
                  <option value="">Sélectionnez un sujet</option>
                  <option value="commande">Question sur une commande</option>
                  <option value="produit">Information sur un produit</option>
                  <option value="livraison">Livraison</option>
                  <option value="retour">Retour / Remboursement</option>
                  <option value="partenariat">Partenariat</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-copper-500 transition-colors resize-none"
                  placeholder="Écrivez votre message ici..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-copper-500 hover:bg-copper-600 disabled:bg-copper-500/50 text-white font-semibold rounded-lg px-6 py-3 transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Envoyer le message
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Map Section */}
      <div className="mt-8">
        <div className="bg-gray-100 dark:bg-dark-800 rounded-xl p-6">
          <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-copper-500" />
            Notre Localisation
          </h3>
          <div className="aspect-video bg-gray-200 dark:bg-dark-700 rounded-lg overflow-hidden">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3972.0!2d-3.9!3d5.3!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNcKwMTgnMDAuMCJOIDPCsDU0JzAwLjAiVw!5e0!3m2!1sfr!2sci!4v1234567890"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
            />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-4 text-center">
            Cocody Riviera Palmeraie, Abidjan, Côte d&apos;Ivoire
          </p>
        </div>
      </div>
    </article>
  )
}
