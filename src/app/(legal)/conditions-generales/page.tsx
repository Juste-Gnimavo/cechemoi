import { Metadata } from 'next'
import { FileText, ShoppingCart, Package, CreditCard, Truck, RotateCcw, Shield, Scale, AlertTriangle, RefreshCw, Gavel, HelpCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Conditions Générales de Vente | Cave Express',
  description: 'Consultez les conditions générales de vente de Cave Express. Informations sur les commandes, paiements, livraisons et retours pour vos achats de vins à Abidjan.',
}

export default function ConditionsGeneralesPage() {
  return (
    <article className="prose prose-gray dark:prose-invert prose-lg max-w-none">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Conditions Générales de Vente (CGV)
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Date de dernière mise à jour : 24 Février 2024
        </p>
      </div>

      {/* Préambule */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Préambule</h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          Ces conditions générales de vente (ci-après &quot;CGV&quot;) s&apos;appliquent sans restriction ni réserve
          à l&apos;ensemble des ventes conclues par Cave Express (&quot;le Vendeur&quot;) auprès d&apos;acheteurs non
          professionnels (&quot;les Clients ou le Client&quot;), désirant acquérir les produits proposés à la
          vente (&quot;les Produits&quot;) par le Vendeur sur le site
          <a href="https://www.cave-express.ci" className="text-[#C27B43] hover:underline mx-1">
            https://www.cave-express.ci
          </a>
          ainsi que sur ses applications mobiles disponibles sur diverses plateformes (Apple App Store,
          Google Play Store, Huawei AppGallery, etc.). Ces CGV sont accessibles à tout moment sur le
          site et prévaudront, le cas échéant, sur toute autre version ou tout autre document contradictoire.
        </p>
      </section>

      {/* Article 1 */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
          <FileText className="h-6 w-6 text-copper-500" />
          Article 1 : Objet
        </h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          Les présentes CGV ont pour objet de définir les droits et obligations des parties dans le
          cadre de la vente en ligne des Produits proposés par le Vendeur au Client, de la commande
          à la livraison, en passant par le paiement et l&apos;utilisation des services mis à disposition
          par le Vendeur.
        </p>
      </section>

      {/* Article 2 */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
          <ShoppingCart className="h-6 w-6 text-copper-500" />
          Article 2 : Commandes
        </h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          Il est précisé que les ventes sont réservées aux acheteurs ayant confirmé être âgés d&apos;au
          moins <strong className="text-gray-900 dark:text-white">21 ans</strong> et disposant de la pleine capacité juridique.
          Les commandes peuvent être passées directement sur le site ou via l&apos;application mobile du Vendeur.
          Le processus de commande comprend plusieurs étapes : sélection des produits, confirmation du panier,
          saisie des informations de livraison et de facturation, choix du mode de paiement, et validation
          finale de la commande après acceptation des présentes CGV.
        </p>
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-4 mt-4 not-prose">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-amber-700 dark:text-amber-200 text-sm">
              <strong>Important :</strong> L&apos;achat de boissons alcoolisées est strictement réservé
              aux personnes de 21 ans et plus.
            </p>
          </div>
        </div>
      </section>

      {/* Article 3 */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
          <Package className="h-6 w-6 text-copper-500" />
          Article 3 : Produits et disponibilité
        </h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          Les produits proposés à la vente sont ceux décrits sur le site et l&apos;application du Vendeur
          le jour de la consultation par le Client, dans la limite des stocks disponibles. En cas
          d&apos;indisponibilité d&apos;un produit après passation de commande, le Client sera informé par
          email ou par téléphone de la livraison partielle de sa commande ou de son annulation.
          Les photographies et descriptions des produits ne sont pas contractuelles.
        </p>
      </section>

      {/* Article 4 */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
          <Scale className="h-6 w-6 text-copper-500" />
          Article 4 : Prix
        </h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          Les prix sont indiqués en <strong className="text-gray-900 dark:text-white">Francs CFA</strong> et sont valables
          tel qu&apos;affichés au moment de la commande. Ils ne comprennent pas les frais de livraison,
          facturés en supplément, et indiqués avant la validation finale de la commande. Le Vendeur
          se réserve le droit de modifier les prix à tout moment, tout en garantissant l&apos;application
          du tarif en vigueur au moment de la commande.
        </p>
      </section>

      {/* Article 5 */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
          <CreditCard className="h-6 w-6 text-copper-500" />
          Article 5 : Paiement
        </h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          Le paiement est sécurisé et peut être réalisé par carte bancaire ou tout autre moyen proposé
          sur le site et l&apos;application. Le débit de la carte est effectué au moment de la commande.
          En cas de paiement par chèque ou virement, la commande ne sera traitée qu&apos;à réception du paiement.
        </p>
        <div className="bg-gray-100 dark:bg-dark-800 rounded-xl p-4 mt-4 not-prose">
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">Moyens de paiement acceptés :</p>
          <div className="flex flex-wrap gap-2">
            {['Carte Bancaire', 'Orange Money', 'MTN Mobile Money', 'Wave'].map((method) => (
              <span key={method} className="text-gray-700 dark:text-gray-300 text-sm bg-gray-200 dark:bg-dark-700 px-3 py-1.5 rounded-lg">
                {method}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Article 6 */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
          <Truck className="h-6 w-6 text-copper-500" />
          Article 6 : Livraison et réception
        </h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          La livraison est effectuée à l&apos;adresse indiquée par le Client, uniquement à
          <strong className="text-gray-900 dark:text-white"> Abidjan</strong>. En cas de retard, dommage lors du transport,
          ou colis incomplet ou contestable, il est de la responsabilité du Client de formuler toutes
          les réserves nécessaires auprès du transporteur au moment de la livraison. Ces incidents ne
          sauraient engager la responsabilité du Vendeur.
        </p>
      </section>

      {/* Article 7 */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
          <RotateCcw className="h-6 w-6 text-copper-500" />
          Article 7 : Droit de rétractation et retours
        </h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          Conformément à la législation en vigueur, le Client dispose d&apos;un droit de rétractation de
          <strong className="text-gray-900 dark:text-white"> 24 heures</strong> à compter de la livraison des produits pour
          les retourner au Vendeur pour échange ou remboursement, à condition que les produits soient
          retournés dans leur emballage d&apos;origine, non ouverts, et en parfait état. Les frais de retour
          sont à la charge du Client.
        </p>
      </section>

      {/* Article 8 */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
          <Shield className="h-6 w-6 text-copper-500" />
          Article 8 : Protection des données personnelles
        </h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          Le Vendeur s&apos;engage à protéger les données personnelles des Clients. Toutes les données
          recueillies dans le cadre de la commande sont utilisées exclusivement pour le traitement
          des commandes, la livraison des produits, et la communication avec le Client. Le Client
          dispose d&apos;un droit d&apos;accès, de rectification, et de suppression des données le concernant.
        </p>
      </section>

      {/* Article 9 */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Article 9 : Propriété intellectuelle
        </h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          Tous les éléments du site et de l&apos;application du Vendeur sont et restent la propriété
          intellectuelle et exclusive du Vendeur. Personne n&apos;est autorisé à reproduire, exploiter,
          rediffuser, ou utiliser à quelque titre que ce soit, même partiellement, des éléments du
          site qu&apos;ils soient logiciels, visuels ou sonores.
        </p>
      </section>

      {/* Article 10 */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-copper-500" />
          Article 10 : Force majeure
        </h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          L&apos;exécution des obligations du Vendeur au terme des présentes est suspendue en cas de
          survenance d&apos;un événement de force majeure qui en empêcherait l&apos;exécution. Le Vendeur
          avisera le Client de la survenance d&apos;un tel événement dès que possible.
        </p>
      </section>

      {/* Article 11 */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
          <RefreshCw className="h-6 w-6 text-copper-500" />
          Article 11 : Modification des CGV
        </h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          Le Vendeur se réserve le droit de modifier les présentes CGV à tout moment. La version
          applicable à l&apos;achat du Client est celle en vigueur sur le site au moment de la passation
          de la commande.
        </p>
      </section>

      {/* Article 12 */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
          <Gavel className="h-6 w-6 text-copper-500" />
          Article 12 : Droit applicable et juridiction compétente
        </h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          Les présentes CGV sont soumises à la <strong className="text-gray-900 dark:text-white">loi ivoirienne</strong>.
          En cas de litige, une solution amiable sera recherchée avant toute action judiciaire.
          À défaut de résolution amiable, les tribunaux ivoiriens seront seuls compétents pour juger
          tout litige.
        </p>
      </section>

      {/* Contact */}
      <section className="not-prose">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
          <HelpCircle className="h-6 w-6 text-copper-500" />
          Contact
        </h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
          Pour toute question relative à ces CGV, merci de contacter le service client :
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
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              <span className="text-gray-500">Via WhatsApp :</span>{' '}
              <a href="https://wa.me/2250556791431" className="text-copper-500 hover:underline">wa.me/2250556791431</a>
            </p>
          </div>
        </div>
      </section>
    </article>
  )
}
