import { Metadata } from 'next'
import { Truck, Clock, MapPin, Package, Bell, Zap, Phone, Mail, HelpCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Politique de Livraison | Cave Express',
  description: 'Découvrez notre politique de livraison. Livraison le jour même à Abidjan de 06H à 23H. Livraison gratuite pour les commandes de plus de 100 000 FCFA.',
}

export default function PolitiqueLivraisonPage() {
  return (
    <article className="prose prose-gray dark:prose-invert prose-lg max-w-none">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Politique de Livraison
        </h1>
        <p className="text-copper-500 text-lg font-medium">
          Livraison rapide partout à Abidjan
        </p>
      </div>

      {/* Délais de Livraison */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
          <Clock className="h-6 w-6 text-copper-500" />
          Délais de Livraison
        </h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
          Votre commande sera expédiée via notre coursier ou un coursier tiers YANGO, en fonction
          de l&apos;option de livraison que vous sélectionnez lors du paiement.
        </p>

        <div className="bg-gradient-to-br from-copper-500/10 dark:from-copper-500/20 to-transparent rounded-xl p-6 border border-copper-500/20 dark:border-copper-500/30 not-prose mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-copper-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Zap className="h-8 w-8 text-gray-900 dark:text-white" />
            </div>
            <div>
              <h3 className="text-gray-900 dark:text-white font-bold text-xl mb-1">Expédition le jour même</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Pour les commandes passées de <strong className="text-gray-900 dark:text-white">06H à 23H</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Zone de livraison */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
          <MapPin className="h-6 w-6 text-copper-500" />
          Zone de Livraison
        </h2>

        <div className="bg-gray-100 dark:bg-dark-800 rounded-xl p-6 not-prose space-y-4">
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-gray-900 dark:text-white text-xs font-bold">✓</span>
            </span>
            <span className="text-gray-600 dark:text-gray-300">
              Nous livrons uniquement dans la ville d&apos;<strong className="text-gray-900 dark:text-white">Abidjan</strong>.
            </span>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-gray-900 dark:text-white text-xs font-bold">✗</span>
            </span>
            <span className="text-gray-600 dark:text-gray-300">
              Nous n&apos;expédions actuellement pas aux boîtes postales, APO, FPO ou à l&apos;international.
            </span>
          </div>
        </div>
      </section>

      {/* Livraison gratuite */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
          <Package className="h-6 w-6 text-copper-500" />
          Livraison Gratuite
        </h2>

        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 not-prose">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Truck className="h-7 w-7 text-green-500" />
            </div>
            <div>
              <h3 className="text-gray-900 dark:text-white font-bold text-lg mb-1">Livraison offerte</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Toutes les commandes avec une livraison à tarif fixe de plus de
                <strong className="text-green-400"> 100 000 FCFA</strong> seront expédiées gratuitement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tarifs */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Livraison à Tarif Fixe</h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
          Pour les commandes de plus de 100 000 FCFA, les prix varient en fonction du poids.
        </p>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          Les produits de la même commande sont souvent expédiés depuis différentes localisations.
          Cela n&apos;affecte pas le coût de votre livraison, mais peut nécessiter que la commande soit
          livrée en plusieurs colis et que les délais de livraison puissent varier.
        </p>
      </section>

      {/* Suivi des commandes */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
          <Bell className="h-6 w-6 text-copper-500" />
          Suivi des Commandes
        </h2>

        <div className="space-y-4 not-prose">
          <div className="flex items-start gap-4 bg-gray-100 dark:bg-dark-800 rounded-xl p-4">
            <div className="w-10 h-10 bg-copper-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-copper-500 font-bold">1</span>
            </div>
            <div>
              <h3 className="text-gray-900 dark:text-white font-semibold mb-1">Email de confirmation</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Une fois votre commande passée, vous recevrez d&apos;abord un email de confirmation de commande.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-gray-100 dark:bg-dark-800 rounded-xl p-4">
            <div className="w-10 h-10 bg-copper-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-copper-500 font-bold">2</span>
            </div>
            <div>
              <h3 className="text-gray-900 dark:text-white font-semibold mb-1">Notification d&apos;expédition</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Un email de notification d&apos;expédition avec les informations de suivi suivra.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-gray-100 dark:bg-dark-800 rounded-xl p-4">
            <div className="w-10 h-10 bg-copper-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-copper-500 font-bold">3</span>
            </div>
            <div>
              <h3 className="text-gray-900 dark:text-white font-semibold mb-1">Suivi en ligne</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Vous pouvez également vérifier le statut de votre commande en vous connectant à votre compte.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-gray-100 dark:bg-dark-800 rounded-xl p-4">
            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Bell className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h3 className="text-gray-900 dark:text-white font-semibold mb-1">Alertes proactives</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Ce service gratuit vous enverra proactivement des alertes de livraison vous informant
                du jour et de l&apos;heure de votre livraison.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Informations supplémentaires */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
          <HelpCircle className="h-6 w-6 text-copper-500" />
          Informations Supplémentaires
        </h2>

        <div className="bg-gray-100 dark:bg-dark-800 rounded-xl p-6 not-prose">
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-copper-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Zap className="h-3 w-3 text-gray-900 dark:text-white" />
              </span>
              <span className="text-gray-600 dark:text-gray-300">
                <strong className="text-gray-900 dark:text-white">Commandes urgentes :</strong> veuillez sélectionner
                l&apos;option de livraison express lors du paiement pour garantir une expédition prioritaire.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-copper-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Clock className="h-3 w-3 text-gray-900 dark:text-white" />
              </span>
              <span className="text-gray-600 dark:text-gray-300">
                <strong className="text-gray-900 dark:text-white">Retards imprévus :</strong> en cas de retard, nous vous
                contacterons via les coordonnées fournies lors de la commande pour vous informer et
                discuter des solutions possibles.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-copper-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Phone className="h-3 w-3 text-gray-900 dark:text-white" />
              </span>
              <span className="text-gray-600 dark:text-gray-300">
                <strong className="text-gray-900 dark:text-white">Service client disponible :</strong> notre service client
                est disponible pour répondre à toutes vos questions concernant la livraison de votre commande.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Contact */}
      <section className="not-prose">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Contact</h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
          Nous nous engageons à assurer la satisfaction de nos clients et à résoudre tout problème
          de livraison dans les plus brefs délais.
        </p>
        <div className="bg-gradient-to-br from-copper-500/10 dark:from-copper-500/20 to-transparent rounded-xl p-6 border border-copper-500/20 dark:border-copper-500/30">
          <div className="space-y-2">
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              <span className="text-gray-500">Par téléphone :</span>{' '}
              <a href="tel:+2250556791431" className="text-copper-500 hover:underline">+225 0556791431</a>
            </p>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              <span className="text-gray-500">Par email :</span>{' '}
              <a href="mailto:serviceclient@cave-express.ci" className="text-copper-500 hover:underline">serviceclient@cave-express.ci</a>
            </p>
          </div>
        </div>
      </section>
    </article>
  )
}
