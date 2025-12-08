import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Scissors, Truck, Users, Award, Phone, Mail, MapPin, Sparkles, Heart, Palette } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Qui sommes-Nous? | CÈCHÉMOI',
  description: 'Découvrez CÈCHÉMOI, votre maison de couture ivoirienne. Mode africaine moderne, créations sur-mesure et prêt-à-porter inspirés du pagne traditionnel.',
}

export default function QuiSommesNousPage() {
  return (
    <article className="prose prose-gray dark:prose-invert prose-lg max-w-none">
      {/* Header with Image */}
      <div className="relative mb-12 -mx-4 sm:-mx-6 lg:-mx-8">
        <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden rounded-2xl">
          <Image
            src="/photos/11.jpg"
            alt="CÈCHÉMOI - Mode Africaine"
            fill
            className="object-cover object-top"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Qui sommes-Nous?
            </h1>
            <p className="text-primary-400 text-xl font-medium">
              Originalité, Créativité et Beauté de Chez Moi
            </p>
          </div>
        </div>
      </div>

      {/* Introduction */}
      <section className="mb-12">
        <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
          <strong className="text-gray-900 dark:text-white">CÈCHÉMOI</strong> est une maison de couture ivoirienne
          qui célèbre la richesse du patrimoine textile africain tout en l&apos;inscrivant dans la modernité.
          Notre nom, contraction de <em className="text-primary-500">&quot;C&apos;est de chez moi&quot;</em>,
          exprime notre fierté pour nos racines et notre engagement à sublimer la beauté africaine.
        </p>
        <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed mt-4">
          Fondée par une passionnée de mode et d&apos;art textile, notre maison transforme le pagne traditionnel
          ivoirien en créations contemporaines, alliant savoir-faire ancestral et tendances actuelles.
        </p>
      </section>

      {/* Mission */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
          <Sparkles className="h-7 w-7 text-primary-500" />
          Notre Mission
        </h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          Réinventer la mode africaine en créant des pièces uniques qui honorent nos traditions
          tout en répondant aux exigences de la femme moderne. Nous croyons que chaque femme mérite
          de porter des vêtements qui racontent une histoire — son histoire — avec élégance et originalité.
        </p>
        <div className="mt-6 p-6 bg-primary-500/10 dark:bg-primary-500/20 rounded-xl border border-primary-500/20 not-prose">
          <p className="text-primary-700 dark:text-primary-300 italic text-center text-lg">
            &quot;La mode africaine n&apos;est pas un retour en arrière, c&apos;est un pas vers l&apos;avant
            avec nos racines comme fondation.&quot;
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Nos Valeurs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose">
          <div className="bg-gray-100 dark:bg-dark-800 rounded-xl p-6">
            <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center mb-4">
              <Palette className="h-6 w-6 text-primary-500" />
            </div>
            <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">Créativité</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Chaque création est une œuvre unique, fruit de l&apos;imagination et du talent de nos stylistes.
            </p>
          </div>
          <div className="bg-gray-100 dark:bg-dark-800 rounded-xl p-6">
            <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center mb-4">
              <Heart className="h-6 w-6 text-primary-500" />
            </div>
            <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">Authenticité</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Nous utilisons des tissus authentiques — pagne wax, kita, bogolan — pour des créations véritablement africaines.
            </p>
          </div>
          <div className="bg-gray-100 dark:bg-dark-800 rounded-xl p-6">
            <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center mb-4">
              <Award className="h-6 w-6 text-primary-500" />
            </div>
            <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">Excellence</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Des finitions impeccables et une attention aux détails pour des vêtements qui durent.
            </p>
          </div>
          <div className="bg-gray-100 dark:bg-dark-800 rounded-xl p-6">
            <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-primary-500" />
            </div>
            <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">Proximité</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Un accompagnement personnalisé, de la consultation à la livraison de votre tenue.
            </p>
          </div>
        </div>
      </section>

      {/* Our Offer */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
          <Scissors className="h-7 w-7 text-primary-500" />
          Nos Créations
        </h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
          De la robe de soirée somptueuse à l&apos;ensemble casual chic, nous créons des pièces
          pour toutes les occasions :
        </p>
        <ul className="space-y-3 not-prose">
          <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
            <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
            <span><strong className="text-gray-900 dark:text-white">Robes de soirée</strong> — Élégance et raffinement pour vos événements</span>
          </li>
          <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
            <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
            <span><strong className="text-gray-900 dark:text-white">Ensembles wax</strong> — Le pagne réinventé avec modernité</span>
          </li>
          <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
            <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
            <span><strong className="text-gray-900 dark:text-white">Prêt-à-porter</strong> — Des pièces tendance pour le quotidien</span>
          </li>
          <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
            <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
            <span><strong className="text-gray-900 dark:text-white">Sur-mesure</strong> — Des créations uniques selon vos envies</span>
          </li>
          <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
            <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
            <span><strong className="text-gray-900 dark:text-white">Accessoires</strong> — Sacs, bijoux et accessoires assortis</span>
          </li>
        </ul>
      </section>

      {/* Services */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
          <Truck className="h-7 w-7 text-primary-500" />
          Nos Services
        </h2>
        <div className="bg-gray-100 dark:bg-dark-800 rounded-xl p-6 not-prose">
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">1</span>
              </span>
              <span className="text-gray-600 dark:text-gray-300">
                <strong className="text-gray-900 dark:text-white">Consultation personnalisée</strong> —
                Rencontrez notre styliste pour définir ensemble votre projet de création.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">2</span>
              </span>
              <span className="text-gray-600 dark:text-gray-300">
                <strong className="text-gray-900 dark:text-white">Prise de mesures</strong> —
                Des mesures précises pour un ajustement parfait à votre morphologie.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">3</span>
              </span>
              <span className="text-gray-600 dark:text-gray-300">
                <strong className="text-gray-900 dark:text-white">Livraison</strong> —
                Recevez vos créations partout en Côte d&apos;Ivoire et à l&apos;international.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">4</span>
              </span>
              <span className="text-gray-600 dark:text-gray-300">
                <strong className="text-gray-900 dark:text-white">Retouches</strong> —
                Service de retouches pour garantir votre satisfaction totale.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="mb-12 not-prose">
        <div className="bg-gradient-to-r from-primary-500/20 to-purple-500/20 rounded-xl p-8 text-center border border-primary-500/30">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Prête à sublimer votre style ?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Découvrez notre collection ou réservez une consultation pour une création sur-mesure.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/catalogue"
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors"
            >
              Voir la Collection
            </Link>
            <Link
              href="/sur-mesure"
              className="px-6 py-3 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 text-gray-900 dark:text-white font-semibold rounded-xl transition-colors border border-gray-200 dark:border-dark-600"
            >
              Sur-Mesure
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="not-prose">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Contactez-Nous</h2>
        <div className="bg-gradient-to-br from-primary-500/10 dark:from-primary-500/20 to-transparent rounded-xl p-6 border border-primary-500/20 dark:border-primary-500/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Phone className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Téléphone / WhatsApp</p>
                <a href="tel:+2250759545410" className="text-gray-900 dark:text-white font-medium hover:text-primary-500 transition-colors">
                  +225 07 59 54 54 10
                </a>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Email</p>
                <a href="mailto:cechemoicreations@gmail.com" className="text-gray-900 dark:text-white font-medium hover:text-primary-500 transition-colors">
                  cechemoicreations@gmail.com
                </a>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Showroom</p>
                <p className="text-gray-900 dark:text-white font-medium">
                  Cocody Riviera Palmeraie<br />
                  Abidjan, Côte d&apos;Ivoire
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </article>
  )
}
