import { Header } from '@/components/header-legacy'
import { Footer } from '@/components/footer'
import Image from 'next/image'
import Link from 'next/link'
import {
  Sparkles,
  Ruler,
  Scissors,
  Heart,
  ArrowRight,
  CheckCircle2,
  Calendar,
  MessageCircle
} from 'lucide-react'

const FEATURES = [
  {
    icon: Ruler,
    title: 'Prise de mensurations',
    description: 'Vos mesures exactes pour un ajustement parfait'
  },
  {
    icon: Sparkles,
    title: 'Création unique',
    description: 'Un modèle créé spécialement pour vous'
  },
  {
    icon: Scissors,
    title: 'Confection artisanale',
    description: 'Savoir-faire et finitions soignées'
  },
  {
    icon: Heart,
    title: 'Accompagnement',
    description: 'Conseils personnalisés à chaque étape'
  }
]

const STEPS = [
  {
    number: '01',
    title: 'Consultation',
    description: 'Rencontrez notre styliste pour discuter de votre projet, vos envies et votre budget.'
  },
  {
    number: '02',
    title: 'Création du modèle',
    description: 'Nous créons un design unique adapté à votre morphologie et votre style.'
  },
  {
    number: '03',
    title: 'Confection',
    description: 'Nos artisans confectionnent votre pièce avec soin et attention aux détails.'
  },
  {
    number: '04',
    title: 'Essayage & Livraison',
    description: 'Essayez votre création, ajustements si nécessaire, puis récupérez votre tenue.'
  }
]

export default function SurMesurePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[70vh] min-h-[500px] bg-gray-900 overflow-hidden">
          <Image
            src="/photos/11.jpg"
            alt="Sur-mesure CÈCHÉMOI"
            fill
            priority
            className="object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />

          <div className="relative z-10 h-full flex items-center">
            <div className="container mx-auto px-4">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/20 backdrop-blur-sm rounded-full mb-6">
                  <Sparkles className="w-4 h-4 text-primary-400" />
                  <span className="text-primary-300 text-sm font-medium">Service exclusif</span>
                </span>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                  Créations<br />
                  <span className="text-primary-400">Sur-Mesure</span>
                </h1>

                <p className="text-xl text-white/80 mb-8 max-w-lg">
                  Une pièce unique, créée pour vous, selon vos envies et votre morphologie.
                  L'excellence de la haute couture accessible.
                </p>

                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/consultation"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-full transition-colors duration-200"
                  >
                    <Calendar className="w-5 h-5" />
                    Prendre rendez-vous
                  </Link>
                  <a
                    href="https://wa.me/2250759545410?text=Bonjour, je suis intéressé(e) par une création sur-mesure"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full backdrop-blur-sm transition-colors duration-200 border border-white/20"
                  >
                    <MessageCircle className="w-5 h-5" />
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {FEATURES.map((feature, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-primary-100 dark:bg-primary-900/30 rounded-full">
                    <feature.icon className="w-8 h-8 text-primary-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Process Steps */}
        <section className="py-16 bg-gray-50 dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="text-primary-500 font-medium uppercase tracking-wider text-sm">
                Le processus
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2">
                Comment ça marche ?
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {STEPS.map((step, index) => (
                <div key={index} className="relative">
                  <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 h-full border border-gray-200 dark:border-gray-700">
                    <span className="text-5xl font-bold text-primary-500/20">
                      {step.number}
                    </span>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-4 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {step.description}
                    </p>
                  </div>
                  {index < STEPS.length - 1 && (
                    <ArrowRight className="hidden lg:block absolute top-1/2 -right-4 w-8 h-8 text-primary-300 transform -translate-y-1/2" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="relative h-[500px] rounded-2xl overflow-hidden">
                <Image
                  src="/photos/1.jpg"
                  alt="Création sur-mesure"
                  fill
                  className="object-cover object-top"
                />
              </div>
              <div>
                <span className="text-primary-500 font-medium uppercase tracking-wider text-sm">
                  Pourquoi nous choisir
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2 mb-6">
                  L'expertise au service de votre style
                </h2>

                <ul className="space-y-4">
                  {[
                    'Consultation personnalisée gratuite',
                    'Choix de tissus de qualité premium',
                    'Délais de confection respectés',
                    'Ajustements inclus jusqu\'à satisfaction',
                    'Accompagnement de A à Z',
                    'Prix transparent, sans surprise'
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary-500 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  <Link
                    href="/consultation"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-full transition-colors duration-200"
                  >
                    Réserver ma consultation
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary-500">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Prêt(e) pour votre création unique ?
            </h2>
            <p className="text-primary-100 text-lg mb-8 max-w-2xl mx-auto">
              Réservez votre consultation dès maintenant. La première consultation est sans engagement.
            </p>
            <Link
              href="/consultation"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-600 font-semibold rounded-full hover:bg-gray-100 transition-colors duration-200"
            >
              <Calendar className="w-5 h-5" />
              Prendre rendez-vous
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
