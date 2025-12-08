import { Metadata } from 'next'
import { Shield, Database, Share2, Lock, UserCheck, RefreshCw, HelpCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Politique de Confidentialité | Cave Express',
  description: 'Découvrez comment Cave Express protège vos données personnelles. Notre politique de confidentialité détaille la collecte, l\'utilisation et la protection de vos informations.',
}

export default function PolitiqueConfidentialitePage() {
  return (
    <article className="prose prose-gray dark:prose-invert prose-lg max-w-none">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Politique de Confidentialité
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Dernière mise à jour : 20 Février 2024
        </p>
      </div>

      {/* Introduction */}
      <section className="mb-10">
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          Cave Express, située à Faya Cité Genie 2000, Abidjan, Côte d&apos;Ivoire (ci-après « nous »,
          « notre », ou « nos »), s&apos;engage à protéger la vie privée et les données personnelles de
          ses visiteurs et clients (ci-après « vous » ou « votre ») accédant à notre site web
          <a href="https://www.cave-express.ci" className="text-copper-500 hover:underline mx-1">
            https://www.cave-express.ci
          </a>
          et nos applications mobiles disponibles sur l&apos;Apple App Store, Google Play Store,
          Huawei AppGallery, etc.
        </p>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mt-4">
          Cette Politique de Confidentialité explique comment nous collectons, utilisons, partageons,
          et protégeons vos informations personnelles, ainsi que vos droits relatifs à ces informations.
        </p>
      </section>

      {/* Section 1 */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
          <Database className="h-6 w-6 text-copper-500" />
          1. Collecte d&apos;Informations
        </h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
          Nous collectons des informations vous concernant lorsque vous :
        </p>
        <ul className="space-y-2 not-prose mb-6">
          <li className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
            <span className="w-2 h-2 bg-copper-500 rounded-full mt-2 flex-shrink-0"></span>
            <span>Visitez notre site web et nos applications mobiles</span>
          </li>
          <li className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
            <span className="w-2 h-2 bg-copper-500 rounded-full mt-2 flex-shrink-0"></span>
            <span>Effectuez des achats ou créez un compte sur notre plateforme</span>
          </li>
          <li className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
            <span className="w-2 h-2 bg-copper-500 rounded-full mt-2 flex-shrink-0"></span>
            <span>Contactez notre service client par téléphone, email, WhatsApp, ou via nos réseaux sociaux</span>
          </li>
        </ul>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
          Les types d&apos;informations collectées incluent :
        </p>
        <ul className="space-y-2 not-prose">
          <li className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
            <span className="w-2 h-2 bg-copper-500 rounded-full mt-2 flex-shrink-0"></span>
            <span>Informations d&apos;identification personnelle (nom, adresse email, numéro de téléphone, etc.)</span>
          </li>
          <li className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
            <span className="w-2 h-2 bg-copper-500 rounded-full mt-2 flex-shrink-0"></span>
            <span>Informations de paiement pour le traitement des transactions</span>
          </li>
          <li className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
            <span className="w-2 h-2 bg-copper-500 rounded-full mt-2 flex-shrink-0"></span>
            <span>Informations de navigation et préférences sur notre site et applications</span>
          </li>
          <li className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
            <span className="w-2 h-2 bg-copper-500 rounded-full mt-2 flex-shrink-0"></span>
            <span>Communications avec le service client</span>
          </li>
        </ul>
      </section>

      {/* Section 2 */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
          <Shield className="h-6 w-6 text-copper-500" />
          2. Utilisation des Informations
        </h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
          Vos informations sont utilisées pour :
        </p>
        <ul className="space-y-2 not-prose">
          <li className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
            <span className="w-2 h-2 bg-copper-500 rounded-full mt-2 flex-shrink-0"></span>
            <span>Traiter vos commandes et fournir les services demandés</span>
          </li>
          <li className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
            <span className="w-2 h-2 bg-copper-500 rounded-full mt-2 flex-shrink-0"></span>
            <span>Améliorer la qualité de nos services et personnaliser votre expérience</span>
          </li>
          <li className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
            <span className="w-2 h-2 bg-copper-500 rounded-full mt-2 flex-shrink-0"></span>
            <span>Communiquer avec vous, y compris pour le service client et l&apos;envoi d&apos;informations promotionnelles, avec votre consentement</span>
          </li>
          <li className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
            <span className="w-2 h-2 bg-copper-500 rounded-full mt-2 flex-shrink-0"></span>
            <span>Assurer la sécurité de notre plateforme et prévenir la fraude</span>
          </li>
        </ul>
      </section>

      {/* Section 3 */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
          <Share2 className="h-6 w-6 text-copper-500" />
          3. Partage des Informations
        </h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
          Nous ne partageons vos informations personnelles avec des tiers que dans les cas suivants :
        </p>
        <ul className="space-y-2 not-prose">
          <li className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
            <span className="w-2 h-2 bg-copper-500 rounded-full mt-2 flex-shrink-0"></span>
            <span>Prestataires de services agissant en notre nom pour le traitement des paiements, la livraison, etc.</span>
          </li>
          <li className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
            <span className="w-2 h-2 bg-copper-500 rounded-full mt-2 flex-shrink-0"></span>
            <span>Conformité avec les exigences légales ou pour protéger nos droits et ceux d&apos;autrui</span>
          </li>
          <li className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
            <span className="w-2 h-2 bg-copper-500 rounded-full mt-2 flex-shrink-0"></span>
            <span>Dans le cadre d&apos;une fusion, acquisition, ou vente de tous ou une partie de nos actifs</span>
          </li>
        </ul>
      </section>

      {/* Section 4 */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
          <Lock className="h-6 w-6 text-copper-500" />
          4. Sécurité des Données
        </h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
          Nous prenons des mesures de sécurité techniques et organisationnelles pour protéger vos
          données contre l&apos;accès non autorisé, la modification, la divulgation ou la destruction.
        </p>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
          L&apos;application utilise des services tiers qui peuvent collecter des informations permettant
          de vous identifier. Lien vers la politique de confidentialité des fournisseurs de services
          tiers utilisés par l&apos;application :
        </p>
        <div className="bg-gray-100 dark:bg-dark-800 rounded-xl p-4 not-prose">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {['Google Play Services', 'Firebase Analytics', 'Facebook', 'AdMob', 'Crashlytics', 'YouTube'].map((service) => (
              <span key={service} className="text-gray-500 dark:text-gray-400 text-sm bg-gray-200 dark:bg-dark-700 px-3 py-2 rounded-lg text-center">
                {service}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5 */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
          <UserCheck className="h-6 w-6 text-copper-500" />
          5. Vos Droits
        </h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
          Vous avez le droit de :
        </p>
        <ul className="space-y-2 not-prose mb-6">
          <li className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
            <span className="w-2 h-2 bg-copper-500 rounded-full mt-2 flex-shrink-0"></span>
            <span>Accéder à vos informations personnelles et les corriger</span>
          </li>
          <li className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
            <span className="w-2 h-2 bg-copper-500 rounded-full mt-2 flex-shrink-0"></span>
            <span>Demander la suppression de vos données</span>
          </li>
          <li className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
            <span className="w-2 h-2 bg-copper-500 rounded-full mt-2 flex-shrink-0"></span>
            <span>Retirer votre consentement à tout moment pour l&apos;utilisation future de vos données</span>
          </li>
          <li className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
            <span className="w-2 h-2 bg-copper-500 rounded-full mt-2 flex-shrink-0"></span>
            <span>Déposer une plainte auprès d&apos;une autorité de contrôle</span>
          </li>
        </ul>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          Pour exercer ces droits, veuillez nous contacter via :
        </p>
        <div className="bg-gray-100 dark:bg-dark-800 rounded-xl p-4 mt-4 not-prose space-y-2">
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            <span className="text-gray-500">Email :</span>{' '}
            <a href="mailto:serviceclient@cave-express.ci" className="text-copper-500 hover:underline">
              serviceclient@cave-express.ci
            </a>
          </p>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            <span className="text-gray-500">Téléphone :</span>{' '}
            <a href="tel:+2250556791431" className="text-copper-500 hover:underline">
              +225 0556791431
            </a>
          </p>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            <span className="text-gray-500">WhatsApp :</span>{' '}
            <a href="https://wa.me/2250556791431" className="text-copper-500 hover:underline">
              wa.me/2250556791431
            </a>
          </p>
        </div>
      </section>

      {/* Section 6 */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
          <RefreshCw className="h-6 w-6 text-copper-500" />
          6. Modifications de la Politique de Confidentialité
        </h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          Nous pouvons mettre à jour cette politique de confidentialité pour refléter les changements
          dans nos pratiques d&apos;information. Nous vous notifierons de toute modification significative
          par email ou via notre site web.
        </p>
      </section>

      {/* Section 7 */}
      <section className="not-prose">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
          <HelpCircle className="h-6 w-6 text-copper-500" />
          7. Contactez-Nous
        </h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
          Pour toute question ou préoccupation concernant cette politique de confidentialité,
          veuillez nous contacter à l&apos;adresse suivante :
        </p>
        <div className="bg-gradient-to-br from-copper-500/10 dark:from-copper-500/20 to-transparent rounded-xl p-6 border border-copper-500/20 dark:border-copper-500/30">
          <p className="text-gray-900 dark:text-white font-semibold text-lg mb-2">Cave Express</p>
          <p className="text-gray-600 dark:text-gray-300 text-sm">Faya Cité Genie 2000, Abidjan, Côte d&apos;Ivoire</p>
          <p className="text-gray-600 dark:text-gray-300 text-sm mt-2">
            Email : <a href="mailto:serviceclient@cave-express.ci" className="text-copper-500 hover:underline">serviceclient@cave-express.ci</a>
          </p>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Téléphone : <a href="tel:+2250556791431" className="text-copper-500 hover:underline">+225 0556791431</a>
          </p>
        </div>
      </section>
    </article>
  )
}
