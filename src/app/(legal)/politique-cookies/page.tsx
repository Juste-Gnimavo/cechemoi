import { Metadata } from 'next'
import { Cookie, Shield, BarChart3, Settings, Target, HelpCircle, ExternalLink } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Politique des Cookies | CÈCHÉMOI',
  description: 'Découvrez comment CÈCHÉMOI utilise les cookies sur son site web. Informations sur les types de cookies et comment les gérer.',
}

export default function PolitiqueCookiesPage() {
  return (
    <article className="prose prose-gray dark:prose-invert prose-lg max-w-none">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Politique des Cookies
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Dernière mise à jour : Février 2024
        </p>
      </div>

      {/* Introduction */}
      <section className="mb-10">
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          CÈCHÉMOI (« nous », « notre », ou « nos ») utilise des cookies sur le site web
          <a href="https://www.cechemoi.com" className="text-copper-500 hover:underline mx-1">
            https://www.cechemoi.com
          </a>
          (ci-après désigné par « Service »). En utilisant le Service, vous consentez à l&apos;utilisation
          des cookies.
        </p>
      </section>

      {/* Qu'est-ce qu'un cookie ? */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
          <Cookie className="h-6 w-6 text-copper-500" />
          Qu&apos;est-ce qu&apos;un cookie ?
        </h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          Un cookie est un petit fichier texte envoyé à votre navigateur par un site web que vous
          visitez. Il permet au site de se souvenir de vos informations de visite, comme votre
          langue préférée et d&apos;autres paramètres. Cela peut faciliter votre prochaine visite et
          rendre le site plus utile pour vous. Les cookies jouent un rôle important. Sans eux,
          l&apos;utilisation du Web pourrait s&apos;avérer beaucoup plus frustrante.
        </p>
      </section>

      {/* Comment utilisons-nous les cookies ? */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Comment utilisons-nous les cookies ?</h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          Nous utilisons des cookies pour plusieurs raisons détaillées ci-dessous. Malheureusement,
          dans la plupart des cas, il n&apos;existe pas d&apos;options standard de l&apos;industrie pour désactiver
          les cookies sans désactiver complètement les fonctionnalités et les caractéristiques qu&apos;ils
          ajoutent à ce site. Il est recommandé de laisser tous les cookies si vous n&apos;êtes pas sûr
          de savoir si vous en avez besoin ou non, au cas où ils seraient utilisés pour fournir un
          service que vous utilisez.
        </p>
      </section>

      {/* Types de cookies */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Types de cookies que nous utilisons</h2>

        <div className="space-y-4 not-prose">
          {/* Cookies essentiels */}
          <div className="bg-gray-100 dark:bg-dark-800 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Shield className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">Cookies essentiels</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                  Ces cookies sont essentiels pour vous permettre de naviguer sur le site et d&apos;utiliser
                  ses fonctionnalités, comme l&apos;accès à des zones sécurisées du site web. Sans ces cookies,
                  des services que vous avez demandés, comme les paniers d&apos;achat ou la facturation
                  électronique, ne peuvent pas être fournis.
                </p>
                <div className="mt-3">
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                    Toujours actifs
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Cookies de performance */}
          <div className="bg-gray-100 dark:bg-dark-800 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <BarChart3 className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">Cookies de performance</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                  Ces cookies collectent des informations sur la façon dont les visiteurs utilisent un
                  site web, par exemple, les pages les plus visitées et si des messages d&apos;erreur sont
                  émis par des pages web. Ces cookies ne collectent pas d&apos;informations identifiant un
                  visiteur. Toutes les informations que ces cookies collectent sont agrégées et donc anonymes.
                </p>
                <div className="mt-3">
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                    Analytiques
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Cookies de fonctionnalité */}
          <div className="bg-gray-100 dark:bg-dark-800 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Settings className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">Cookies de fonctionnalité</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                  Ces cookies permettent au site de se souvenir des choix que vous faites (comme votre
                  nom d&apos;utilisateur, langue ou la région où vous vous trouvez) et fournissent des
                  fonctionnalités améliorées et plus personnelles.
                </p>
                <div className="mt-3">
                  <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">
                    Préférences
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Cookies de ciblage */}
          <div className="bg-gray-100 dark:bg-dark-800 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-copper-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Target className="h-6 w-6 text-copper-500" />
              </div>
              <div>
                <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">Cookies de ciblage ou publicitaires</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                  Ces cookies sont utilisés pour diffuser des annonces plus pertinentes pour vous et vos
                  intérêts. Ils sont également utilisés pour limiter le nombre de fois où vous voyez une
                  annonce ainsi que pour aider à mesurer l&apos;efficacité des campagnes publicitaires.
                </p>
                <div className="mt-3">
                  <span className="text-xs bg-copper-500/20 text-copper-500 px-2 py-1 rounded-full">
                    Marketing
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comment gérer les cookies */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
          <Settings className="h-6 w-6 text-copper-500" />
          Comment gérer les cookies
        </h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
          Vous pouvez contrôler et/ou supprimer les cookies comme vous le souhaitez – pour plus de
          détails, voir
          <a
            href="https://aboutcookies.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-copper-500 hover:underline mx-1 inline-flex items-center gap-1"
          >
            aboutcookies.org
            <ExternalLink className="h-3 w-3" />
          </a>.
        </p>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
          Vous pouvez supprimer tous les cookies qui sont déjà sur votre ordinateur et vous pouvez
          configurer la plupart des navigateurs pour les empêcher d&apos;être placés.
        </p>

        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-4 not-prose">
          <div className="flex items-start gap-3">
            <HelpCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-amber-700 dark:text-amber-200 text-sm">
              <strong>Attention :</strong> Si vous désactivez les cookies, vous devrez peut-être ajuster
              manuellement certaines préférences chaque fois que vous visitez un site et certains services
              et fonctionnalités peuvent ne pas fonctionner.
            </p>
          </div>
        </div>
      </section>

      {/* Gestion par navigateur */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Gestion des cookies par navigateur</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose">
          {[
            { name: 'Google Chrome', url: 'https://support.google.com/chrome/answer/95647' },
            { name: 'Mozilla Firefox', url: 'https://support.mozilla.org/fr/kb/cookies-informations-sites-enregistrent' },
            { name: 'Safari', url: 'https://support.apple.com/fr-fr/guide/safari/sfri11471/mac' },
            { name: 'Microsoft Edge', url: 'https://support.microsoft.com/fr-fr/microsoft-edge/supprimer-les-cookies-dans-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09' },
          ].map((browser) => (
            <a
              key={browser.name}
              href={browser.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-100 dark:bg-dark-800 rounded-xl p-4 hover:bg-gray-200 dark:bg-dark-700 transition-colors flex items-center justify-between group"
            >
              <span className="text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:text-white transition-colors">
                {browser.name}
              </span>
              <ExternalLink className="h-4 w-4 text-gray-500 group-hover:text-copper-500 transition-colors" />
            </a>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="not-prose">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
          <HelpCircle className="h-6 w-6 text-copper-500" />
          Contact
        </h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
          Pour toute question concernant notre politique des cookies, n&apos;hésitez pas à contacter
          notre service client :
        </p>
        <div className="bg-gradient-to-br from-copper-500/10 dark:from-copper-500/20 to-transparent rounded-xl p-6 border border-copper-500/20 dark:border-copper-500/30">
          <div className="space-y-2">
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              <span className="text-gray-500">Par email :</span>{' '}
              <a href="mailto:cechemoicreations@gmail.com" className="text-copper-500 hover:underline">
                cechemoicreations@gmail.com
              </a>
            </p>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              <span className="text-gray-500">Par téléphone :</span>{' '}
              <a href="tel:+2250759545410" className="text-copper-500 hover:underline">
                +225 0759545410
              </a>
            </p>
          </div>
        </div>
      </section>
    </article>
  )
}
