import { Metadata } from 'next'
import { Truck, Clock, MapPin, Package, Bell, Plane, Phone, Globe, HelpCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Politique de Livraison | CÈCHÉMOI',
  description: 'Découvrez notre politique de livraison. Livraison en Côte d\'Ivoire et à l\'international. Livraison gratuite pour les commandes de plus de 150 000 FCFA.',
}

export default function PolitiqueLivraisonPage() {
  return (
    <article className="prose prose-gray dark:prose-invert prose-lg max-w-none">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Politique de Livraison
        </h1>
        <p className="text-primary-500 text-lg font-medium">
          Livraison en Côte d&apos;Ivoire et à l&apos;International
        </p>
      </div>

      {/* Zones de livraison */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
          <Globe className="h-6 w-6 text-primary-500" />
          Zones de Livraison
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose mb-6">
          {/* Côte d'Ivoire */}
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <MapPin className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h3 className="text-gray-900 dark:text-white font-bold text-lg">Côte d&apos;Ivoire</h3>
                <p className="text-green-500 text-sm font-medium">Livraison nationale</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                Abidjan : 2-3 jours ouvrés
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                Autres villes : 3-5 jours ouvrés
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                Livraison à domicile ou point relais
              </li>
            </ul>
          </div>

          {/* International */}
          <div className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center">
                <Plane className="h-6 w-6 text-primary-500" />
              </div>
              <div>
                <h3 className="text-gray-900 dark:text-white font-bold text-lg">International</h3>
                <p className="text-primary-500 text-sm font-medium">Monde entier</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary-500 rounded-full"></span>
                Afrique : 5-10 jours ouvrés
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary-500 rounded-full"></span>
                Europe : 7-14 jours ouvrés
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary-500 rounded-full"></span>
                Amérique / Asie : 10-21 jours ouvrés
              </li>
            </ul>
          </div>
        </div>

        <p className="text-gray-600 dark:text-gray-300 text-sm">
          <strong className="text-gray-900 dark:text-white">Note :</strong> Les délais indiqués sont pour les articles
          prêt-à-porter en stock. Les créations sur-mesure nécessitent un délai de confection supplémentaire
          (généralement 2-3 semaines).
        </p>
      </section>

      {/* Tarifs */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
          <Package className="h-6 w-6 text-primary-500" />
          Tarifs de Livraison
        </h2>

        <div className="overflow-x-auto not-prose mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-dark-700">
                <th className="text-left py-3 px-4 text-gray-900 dark:text-white font-semibold">Zone</th>
                <th className="text-left py-3 px-4 text-gray-900 dark:text-white font-semibold">Tarif standard</th>
                <th className="text-left py-3 px-4 text-gray-900 dark:text-white font-semibold">Tarif express</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 dark:text-gray-300">
              <tr className="border-b border-gray-100 dark:border-dark-800">
                <td className="py-3 px-4">Abidjan</td>
                <td className="py-3 px-4">2 000 FCFA</td>
                <td className="py-3 px-4">5 000 FCFA</td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-dark-800">
                <td className="py-3 px-4">Côte d&apos;Ivoire (hors Abidjan)</td>
                <td className="py-3 px-4">5 000 FCFA</td>
                <td className="py-3 px-4">10 000 FCFA</td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-dark-800">
                <td className="py-3 px-4">Afrique de l&apos;Ouest (CEDEAO)</td>
                <td className="py-3 px-4">15 000 FCFA</td>
                <td className="py-3 px-4">25 000 FCFA</td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-dark-800">
                <td className="py-3 px-4">Afrique (autres pays)</td>
                <td className="py-3 px-4">20 000 FCFA</td>
                <td className="py-3 px-4">35 000 FCFA</td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-dark-800">
                <td className="py-3 px-4">Europe</td>
                <td className="py-3 px-4">25 000 FCFA</td>
                <td className="py-3 px-4">45 000 FCFA</td>
              </tr>
              <tr>
                <td className="py-3 px-4">Amérique / Asie / Océanie</td>
                <td className="py-3 px-4">35 000 FCFA</td>
                <td className="py-3 px-4">60 000 FCFA</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Livraison gratuite */}
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 not-prose">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Truck className="h-7 w-7 text-green-500" />
            </div>
            <div>
              <h3 className="text-gray-900 dark:text-white font-bold text-lg mb-1">Livraison offerte</h3>
              <p className="text-gray-600 dark:text-gray-300">
                <strong className="text-green-400">Gratuite en Côte d&apos;Ivoire</strong> pour les commandes de plus de
                <strong className="text-green-400"> 150 000 FCFA</strong>.
                <br />
                <strong className="text-green-400">-50% sur l&apos;international</strong> pour les commandes de plus de
                <strong className="text-green-400"> 300 000 FCFA</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Délais pour Sur-mesure */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
          <Clock className="h-6 w-6 text-primary-500" />
          Délais pour les Créations Sur-Mesure
        </h2>

        <div className="bg-gray-100 dark:bg-dark-800 rounded-xl p-6 not-prose">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Les créations sur-mesure nécessitent un temps de confection avant expédition :
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">1</span>
              </span>
              <span className="text-gray-600 dark:text-gray-300">
                <strong className="text-gray-900 dark:text-white">Robes simples / Ensembles :</strong> 2-3 semaines de confection
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">2</span>
              </span>
              <span className="text-gray-600 dark:text-gray-300">
                <strong className="text-gray-900 dark:text-white">Robes de soirée / Créations complexes :</strong> 3-4 semaines de confection
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">3</span>
              </span>
              <span className="text-gray-600 dark:text-gray-300">
                <strong className="text-gray-900 dark:text-white">Option Express (+30%) :</strong> Délai réduit de moitié pour les commandes urgentes
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Suivi des commandes */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
          <Bell className="h-6 w-6 text-primary-500" />
          Suivi de Commande
        </h2>

        <div className="space-y-4 not-prose">
          <div className="flex items-start gap-4 bg-gray-100 dark:bg-dark-800 rounded-xl p-4">
            <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-primary-500 font-bold">1</span>
            </div>
            <div>
              <h3 className="text-gray-900 dark:text-white font-semibold mb-1">Confirmation de commande</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Vous recevez un email/SMS de confirmation avec les détails de votre commande.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-gray-100 dark:bg-dark-800 rounded-xl p-4">
            <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-primary-500 font-bold">2</span>
            </div>
            <div>
              <h3 className="text-gray-900 dark:text-white font-semibold mb-1">Mise en production (sur-mesure)</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Pour les créations sur-mesure, vous êtes informé du début et de l&apos;avancement de la confection.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-gray-100 dark:bg-dark-800 rounded-xl p-4">
            <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-primary-500 font-bold">3</span>
            </div>
            <div>
              <h3 className="text-gray-900 dark:text-white font-semibold mb-1">Expédition</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Un email avec le numéro de suivi vous est envoyé dès l&apos;expédition de votre colis.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-gray-100 dark:bg-dark-800 rounded-xl p-4">
            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Bell className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h3 className="text-gray-900 dark:text-white font-semibold mb-1">Livraison</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Notification WhatsApp/SMS le jour de la livraison avec l&apos;heure estimée d&apos;arrivée.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Informations supplémentaires */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
          <HelpCircle className="h-6 w-6 text-primary-500" />
          Informations Importantes
        </h2>

        <div className="bg-gray-100 dark:bg-dark-800 rounded-xl p-6 not-prose">
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Globe className="h-3 w-3 text-white" />
              </span>
              <span className="text-gray-600 dark:text-gray-300">
                <strong className="text-gray-900 dark:text-white">Droits de douane :</strong> Pour les livraisons internationales,
                les droits de douane et taxes d&apos;importation sont à la charge du destinataire.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Package className="h-3 w-3 text-white" />
              </span>
              <span className="text-gray-600 dark:text-gray-300">
                <strong className="text-gray-900 dark:text-white">Emballage soigné :</strong> Chaque création est emballée
                avec soin dans une housse de protection et un packaging premium CÈCHÉMOI.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Clock className="h-3 w-3 text-white" />
              </span>
              <span className="text-gray-600 dark:text-gray-300">
                <strong className="text-gray-900 dark:text-white">Retards imprévus :</strong> En cas de retard, nous vous
                contactons immédiatement pour vous informer et trouver une solution.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Phone className="h-3 w-3 text-white" />
              </span>
              <span className="text-gray-600 dark:text-gray-300">
                <strong className="text-gray-900 dark:text-white">Adresse de livraison :</strong> Veuillez vous assurer que
                l&apos;adresse de livraison est correcte et complète pour éviter tout retard.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Contact */}
      <section className="not-prose">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Questions sur la Livraison ?</h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
          Notre équipe est disponible pour répondre à toutes vos questions concernant la livraison de vos créations.
        </p>
        <div className="bg-gradient-to-br from-primary-500/10 dark:from-primary-500/20 to-transparent rounded-xl p-6 border border-primary-500/20 dark:border-primary-500/30">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Téléphone / WhatsApp</p>
              <a href="tel:+2250759545410" className="text-primary-500 hover:underline font-medium">
                +225 07 59 54 54 10
              </a>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Email</p>
              <a href="mailto:cechemoicreations@gmail.com" className="text-primary-500 hover:underline font-medium">
                cechemoicreations@gmail.com
              </a>
            </div>
          </div>
        </div>
      </section>
    </article>
  )
}
