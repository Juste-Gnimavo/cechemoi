import { Metadata } from 'next'
import Image from 'next/image'
import { Wine, Truck, Users, Award, Phone, Mail, MapPin } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Qui sommes-Nous? | Cave Express',
  description: 'Découvrez Cave Express, votre cave en ligne et service de livraison de vins haut de gamme à Abidjan, Côte d\'Ivoire. Plus de 700 références de vins, champagnes et spiritueux.',
}

export default function QuiSommesNousPage() {
  return (
    <article className="prose prose-gray dark:prose-invert prose-lg max-w-none">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Qui sommes-Nous?
        </h1>
        <p className="text-copper-500 text-xl font-medium">
          Bienvenue chez Cave Express
        </p>
      </div>

      {/* Introduction */}
      <section className="mb-12">
        <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
          <strong className="text-gray-900 dark:text-white">Cave Express</strong> est une cave en ligne et un service de livraison
          de vins haut de gamme à Abidjan, Côte d&apos;Ivoire. Notre slogan,
          <em className="text-copper-500"> &quot;La QUALITÉ du vin, livrée à votre porte&quot;</em>,
          reflète notre engagement envers l&apos;excellence et la satisfaction de nos clients.
        </p>
      </section>

      {/* Mission */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
          <Award className="h-7 w-7 text-copper-500" />
          Notre Mission
        </h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          Proposer une sélection d&apos;excellents vins importés et locaux, accessibles et variés,
          pour tous les amateurs — de l&apos;apéritif tranquille au grand dîner. Cave Express vise à
          démocratiser l&apos;accès au vin de qualité, en combinant sélection experte et service de
          livraison performant.
        </p>
      </section>

      {/* Values */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Nos Valeurs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose">
          <div className="bg-gray-100 dark:bg-dark-800 rounded-xl p-6">
            <div className="w-12 h-12 bg-copper-500/20 rounded-full flex items-center justify-center mb-4">
              <Wine className="h-6 w-6 text-copper-500" />
            </div>
            <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">Qualité</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Une sélection rigoureuse de plus de 700 références de vins, champagnes et spiritueux.
            </p>
          </div>
          <div className="bg-gray-100 dark:bg-dark-800 rounded-xl p-6">
            <div className="w-12 h-12 bg-copper-500/20 rounded-full flex items-center justify-center mb-4">
              <Award className="h-6 w-6 text-copper-500" />
            </div>
            <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">Authenticité</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Des produits authentiques et de confiance, directement des meilleurs producteurs.
            </p>
          </div>
          <div className="bg-gray-100 dark:bg-dark-800 rounded-xl p-6">
            <div className="w-12 h-12 bg-copper-500/20 rounded-full flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-copper-500" />
            </div>
            <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">Service Client</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Une équipe dédiée, disponible 7j/7, pour répondre à toutes vos questions.
            </p>
          </div>
          <div className="bg-gray-100 dark:bg-dark-800 rounded-xl p-6">
            <div className="w-12 h-12 bg-copper-500/20 rounded-full flex items-center justify-center mb-4">
              <Truck className="h-6 w-6 text-copper-500" />
            </div>
            <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">Accessibilité</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Livraison rapide partout à Abidjan, du lundi au dimanche.
            </p>
          </div>
        </div>
      </section>

      {/* Our Offer */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
          <Wine className="h-7 w-7 text-copper-500" />
          Notre Offre
        </h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
          Grâce à notre catalogue, nous proposons plus de <strong className="text-gray-900 dark:text-white">700 références</strong> de
          vins, champagnes et spiritueux soigneusement sélectionnés :
        </p>
        <ul className="space-y-3 not-prose">
          <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
            <span className="w-2 h-2 bg-copper-500 rounded-full"></span>
            <span><strong className="text-gray-900 dark:text-white">Vin blanc</strong> (sec, moelleux)</span>
          </li>
          <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
            <span className="w-2 h-2 bg-copper-500 rounded-full"></span>
            <span><strong className="text-gray-900 dark:text-white">Vin rouge</strong></span>
          </li>
          <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
            <span className="w-2 h-2 bg-copper-500 rounded-full"></span>
            <span><strong className="text-gray-900 dark:text-white">Vin rosé</strong></span>
          </li>
          <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
            <span className="w-2 h-2 bg-copper-500 rounded-full"></span>
            <span><strong className="text-gray-900 dark:text-white">Vins mousseux / effervescents</strong></span>
          </li>
          <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
            <span className="w-2 h-2 bg-copper-500 rounded-full"></span>
            <span><strong className="text-gray-900 dark:text-white">Champagnes</strong></span>
          </li>
          <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
            <span className="w-2 h-2 bg-copper-500 rounded-full"></span>
            <span><strong className="text-gray-900 dark:text-white">Spiritueux</strong></span>
          </li>
        </ul>
      </section>

      {/* Delivery */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
          <Truck className="h-7 w-7 text-copper-500" />
          Livraison & Service Client
        </h2>
        <div className="bg-gray-100 dark:bg-dark-800 rounded-xl p-6 not-prose">
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-copper-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-gray-900 dark:text-white text-xs font-bold">✓</span>
              </span>
              <span className="text-gray-600 dark:text-gray-300">
                <strong className="text-gray-900 dark:text-white">Livraison rapide</strong> partout à Abidjan,
                de 06H à 23H, le jour même de votre commande.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-copper-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-gray-900 dark:text-white text-xs font-bold">✓</span>
              </span>
              <span className="text-gray-600 dark:text-gray-300">
                <strong className="text-gray-900 dark:text-white">Commande facile</strong> via notre site web,
                application mobile ou WhatsApp.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-copper-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-gray-900 dark:text-white text-xs font-bold">✓</span>
              </span>
              <span className="text-gray-600 dark:text-gray-300">
                <strong className="text-gray-900 dark:text-white">Support 7j/7</strong> : notre service client
                est disponible tous les jours pour vous accompagner.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-copper-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-gray-900 dark:text-white text-xs font-bold">✓</span>
              </span>
              <span className="text-gray-600 dark:text-gray-300">
                <strong className="text-gray-900 dark:text-white">Livraison gratuite</strong> pour les commandes
                de plus de 100 000 FCFA.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Contact Info */}
      <section className="not-prose">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Contactez-Nous</h2>
        <div className="bg-gradient-to-br from-copper-500/10 dark:from-copper-500/20 to-transparent rounded-xl p-6 border border-copper-500/20 dark:border-copper-500/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-copper-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Phone className="h-5 w-5 text-gray-900 dark:text-white" />
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Téléphone</p>
                <a href="tel:+2250556791431" className="text-gray-900 dark:text-white font-medium hover:text-copper-500 transition-colors">
                  +225 0556791431
                </a>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-copper-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Mail className="h-5 w-5 text-gray-900 dark:text-white" />
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Email</p>
                <a href="mailto:contact@cave-express.ci" className="text-gray-900 dark:text-white font-medium hover:text-copper-500 transition-colors">
                  contact@cave-express.ci
                </a>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-copper-500 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin className="h-5 w-5 text-gray-900 dark:text-white" />
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Adresse</p>
                <p className="text-gray-900 dark:text-white font-medium">
                  Faya Cité Genie 2000<br />
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
