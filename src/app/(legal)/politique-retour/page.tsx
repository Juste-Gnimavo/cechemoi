import { Metadata } from 'next'
import { RotateCcw, CheckCircle, XCircle, Clock, Phone, Mail, MessageCircle, CreditCard, HelpCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Politique de Retour | CÈCHÉMOI',
  description: 'Découvrez notre politique de retour d\'articles. Retours acceptés sous 24h pour les produits non ouverts. Remboursement sous 72h après inspection.',
}

export default function PolitiqueRetourPage() {
  return (
    <article className="prose prose-gray dark:prose-invert prose-lg max-w-none">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Politique de Retour d&apos;Articles
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Date de dernière mise à jour : 20 Février 2024
        </p>
      </div>

      {/* Conditions de retour */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
          <RotateCcw className="h-6 w-6 text-copper-500" />
          Conditions de retour
        </h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
          À CÈCHÉMOI, nous nous engageons à offrir à nos clients des produits de qualité.
          Si, pour une raison quelconque, vous n&apos;êtes pas entièrement satisfait de votre achat,
          nous vous offrons la possibilité de nous retourner les articles sous certaines conditions.
        </p>

        <div className="space-y-4 not-prose">
          <div className="flex items-start gap-4 bg-gray-100 dark:bg-dark-800 rounded-xl p-4">
            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Clock className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h3 className="text-gray-900 dark:text-white font-semibold mb-1">Délai de 24 heures</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Les retours sont acceptés dans un délai de 24 heures suivant la réception de votre commande.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-gray-100 dark:bg-dark-800 rounded-xl p-4">
            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h3 className="text-gray-900 dark:text-white font-semibold mb-1">Produits non ouverts</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Les produits doivent être non ouverts et dans leur état original.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-gray-100 dark:bg-dark-800 rounded-xl p-4">
            <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-gray-900 dark:text-white font-semibold mb-1">Produits ouverts non éligibles</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Les produits ouverts ne sont pas éligibles pour un retour ou un remboursement.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-gray-100 dark:bg-dark-800 rounded-xl p-4">
            <div className="w-10 h-10 bg-copper-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-copper-500" />
            </div>
            <div>
              <h3 className="text-gray-900 dark:text-white font-semibold mb-1">Zone de livraison</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Les retours concernent uniquement les commandes livrées à Abidjan, Côte d&apos;Ivoire.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Processus de retour */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Processus de retour</h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
          Pour initier un retour, veuillez suivre les étapes ci-dessous :
        </p>

        <div className="space-y-6 not-prose">
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-copper-500 rounded-full flex items-center justify-center text-gray-900 dark:text-white font-bold">
                1
              </div>
              <div className="w-0.5 h-full bg-gray-200 dark:bg-dark-700 mt-2"></div>
            </div>
            <div className="flex-1 pb-6">
              <h3 className="text-gray-900 dark:text-white font-semibold mb-2">Contactez notre service client</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
                Dans les 24 heures suivant la réception de l&apos;article par :
              </p>
              <div className="bg-gray-100 dark:bg-dark-800 rounded-lg p-4 space-y-2">
                <p className="text-gray-600 dark:text-gray-300 text-sm flex items-center gap-2">
                  <Phone className="h-4 w-4 text-copper-500" />
                  <span>Téléphone : </span>
                  <a href="tel:+2250759545410" className="text-copper-500 hover:underline">+225 0759545410</a>
                </p>
                <p className="text-gray-600 dark:text-gray-300 text-sm flex items-center gap-2">
                  <Mail className="h-4 w-4 text-copper-500" />
                  <span>Email : </span>
                  <a href="mailto:cechemoicreations@gmail.com" className="text-copper-500 hover:underline">cechemoicreations@gmail.com</a>
                </p>
                <p className="text-gray-600 dark:text-gray-300 text-sm flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-copper-500" />
                  <span>WhatsApp : </span>
                  <a href="https://wa.me/2250759545410" className="text-copper-500 hover:underline">wa.me/2250759545410</a>
                </p>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-copper-500 rounded-full flex items-center justify-center text-gray-900 dark:text-white font-bold">
                2
              </div>
              <div className="w-0.5 h-full bg-gray-200 dark:bg-dark-700 mt-2"></div>
            </div>
            <div className="flex-1 pb-6">
              <h3 className="text-gray-900 dark:text-white font-semibold mb-2">Fournissez les informations</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Précisez votre numéro de commande, les articles à retourner, et le motif du retour.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-copper-500 rounded-full flex items-center justify-center text-gray-900 dark:text-white font-bold">
                3
              </div>
              <div className="w-0.5 h-full bg-gray-200 dark:bg-dark-700 mt-2"></div>
            </div>
            <div className="flex-1 pb-6">
              <h3 className="text-gray-900 dark:text-white font-semibold mb-2">Attendez les instructions</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Attendez les instructions de retour de notre service client, y compris l&apos;adresse de
                retour et les éventuelles étiquettes nécessaires.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-copper-500 rounded-full flex items-center justify-center text-gray-900 dark:text-white font-bold">
                4
              </div>
              <div className="w-0.5 h-full bg-gray-200 dark:bg-dark-700 mt-2"></div>
            </div>
            <div className="flex-1 pb-6">
              <h3 className="text-gray-900 dark:text-white font-semibold mb-2">Retournez les articles</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Retournez les articles selon les instructions fournies.
                <strong className="text-gray-900 dark:text-white"> Les frais de retour sont à la charge du client.</strong>
              </p>
            </div>
          </div>

          {/* Step 5 */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-gray-900 dark:text-white font-bold">
                5
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-gray-900 dark:text-white font-semibold mb-2">Remboursement sous 72h</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Une fois les articles reçus et inspectés par nos équipes, un remboursement sera
                traité dans un délai de 72 heures si les conditions de retour sont remplies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Remboursements */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
          <CreditCard className="h-6 w-6 text-copper-500" />
          Remboursements
        </h2>
        <div className="bg-gray-100 dark:bg-dark-800 rounded-xl p-6 not-prose">
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-copper-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-gray-900 dark:text-white text-xs font-bold">✓</span>
              </span>
              <span className="text-gray-600 dark:text-gray-300">
                Les remboursements sont effectués selon le <strong className="text-gray-900 dark:text-white">mode de paiement
                original</strong> utilisé lors de l&apos;achat.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-copper-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-gray-900 dark:text-white text-xs font-bold">✓</span>
              </span>
              <span className="text-gray-600 dark:text-gray-300">
                Les <strong className="text-gray-900 dark:text-white">frais de retour ne sont pas remboursables</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-copper-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-gray-900 dark:text-white text-xs font-bold">✓</span>
              </span>
              <span className="text-gray-600 dark:text-gray-300">
                Les remboursements peuvent prendre jusqu&apos;à <strong className="text-gray-900 dark:text-white">72 heures</strong> pour
                être traités après la réception et l&apos;inspection des articles retournés.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Contact */}
      <section className="not-prose">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
          <HelpCircle className="h-6 w-6 text-copper-500" />
          Contact
        </h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
          Pour toute question ou préoccupation concernant notre politique de retour, n&apos;hésitez pas
          à contacter notre service client :
        </p>
        <div className="bg-gradient-to-br from-copper-500/10 dark:from-copper-500/20 to-transparent rounded-xl p-6 border border-copper-500/20 dark:border-copper-500/30">
          <div className="space-y-2">
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              <span className="text-gray-500">Par téléphone :</span>{' '}
              <a href="tel:+2250759545410" className="text-copper-500 hover:underline">+225 0759545410</a>
            </p>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              <span className="text-gray-500">Par email :</span>{' '}
              <a href="mailto:cechemoicreations@gmail.com" className="text-copper-500 hover:underline">cechemoicreations@gmail.com</a>
            </p>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              <span className="text-gray-500">Via WhatsApp :</span>{' '}
              <a href="https://wa.me/2250759545410" className="text-copper-500 hover:underline">wa.me/2250759545410</a>
            </p>
          </div>
        </div>
      </section>
    </article>
  )
}
