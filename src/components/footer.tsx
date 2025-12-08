import Link from 'next/link'
import Image from 'next/image'
import { Facebook, Instagram, Youtube, MapPin } from 'lucide-react'

// Custom WhatsApp icon component
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

// Custom Pinterest icon component
function PinterestIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
    </svg>
  )
}

export function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-[#1a1d24] border-t border-gray-200 dark:border-dark-800 mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">

          {/* Contact Section */}
          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-6">Contact</h3>
            <ul className="space-y-4">
              <li className="text-gray-700 dark:text-gray-300 text-sm">
                <span className="text-gray-500">Tél:</span>{' '}
                <a href="tel:+2250556791431" className="hover:text-copper-500 dark:hover:text-copper-400 transition-colors">
                  +225 0556791431
                </a>
              </li>
              <li className="text-gray-700 dark:text-gray-300 text-sm">
                <span className="text-gray-500">Email:</span>{' '}
                <a href="mailto:contact@cave-express.ci" className="hover:text-copper-500 dark:hover:text-copper-400 transition-colors">
                  contact@cave-express.ci
                </a>
              </li>
              <li className="text-gray-700 dark:text-gray-300 text-sm">
                <span className="text-gray-500">Adresse:</span>
                <span className="block">Faya Cité Genie 2000</span>
                <span className="block">Abidjan Côte d&apos;Ivoire</span>
              </li>
            </ul>

            {/* Social Icons */}
            <div className="mt-6">
              <div className="flex items-center gap-3">
                <span className="text-gray-500 text-sm">Social:</span>
                <div className="flex items-center gap-2">
                  <a
                    href="https://web.facebook.com/Cave.Express.Abidjan.Vin.Blanc.Rouge"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 bg-gray-800 dark:bg-white rounded-full flex items-center justify-center hover:bg-copper-500 dark:hover:bg-copper-500 transition-colors group"
                    title="Facebook"
                  >
                    <Facebook className="h-4 w-4 text-white dark:text-gray-900 group-hover:text-white" />
                  </a>
                  <a
                    href="https://wa.me/2250556791431"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 bg-gray-800 dark:bg-white rounded-full flex items-center justify-center hover:bg-copper-500 dark:hover:bg-copper-500 transition-colors group"
                    title="WhatsApp"
                  >
                    <WhatsAppIcon className="h-4 w-4 text-white dark:text-gray-900 group-hover:text-white" />
                  </a>
                  <a
                    href="https://pinterest.com/caveexpress"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 bg-gray-800 dark:bg-white rounded-full flex items-center justify-center hover:bg-copper-500 dark:hover:bg-copper-500 transition-colors group"
                    title="Pinterest"
                  >
                    <PinterestIcon className="h-4 w-4 text-white dark:text-gray-900 group-hover:text-white" />
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2 ml-[52px]">
                <a
                  href="https://instagram.com/caveexpress"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-gray-800 dark:bg-white rounded-full flex items-center justify-center hover:bg-copper-500 dark:hover:bg-copper-500 transition-colors group"
                  title="Instagram"
                >
                  <Instagram className="h-4 w-4 text-white dark:text-gray-900 group-hover:text-white" />
                </a>
                <a
                  href="https://youtube.com/@caveexpress"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-gray-800 dark:bg-white rounded-full flex items-center justify-center hover:bg-copper-500 dark:hover:bg-copper-500 transition-colors group"
                  title="YouTube"
                >
                  <Youtube className="h-4 w-4 text-white dark:text-gray-900 group-hover:text-white" />
                </a>
                <a
                  href="https://maps.google.com/?q=Faya+Cité+Genie+2000+Abidjan"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-gray-800 dark:bg-white rounded-full flex items-center justify-center hover:bg-copper-500 dark:hover:bg-copper-500 transition-colors group"
                  title="Localisation"
                >
                  <MapPin className="h-4 w-4 text-white dark:text-gray-900 group-hover:text-white" />
                </a>
              </div>
            </div>
          </div>

          {/* Menu Principal */}
          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-6">Menu Principal</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-copper-600 dark:text-copper-400 hover:text-gray-900 dark:hover:text-white text-sm transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link href="/vins" className="text-gray-700 dark:text-gray-300 hover:text-copper-600 dark:hover:text-copper-400 text-sm transition-colors">
                  Grands Vins
                </Link>
              </li>
              <li>
                <Link href="/vins/rouge" className="text-gray-700 dark:text-gray-300 hover:text-copper-600 dark:hover:text-copper-400 text-sm transition-colors">
                  Vin rouge
                </Link>
              </li>
              <li>
                <Link href="/vins/blanc" className="text-gray-700 dark:text-gray-300 hover:text-copper-600 dark:hover:text-copper-400 text-sm transition-colors">
                  Vin blanc
                </Link>
              </li>
              <li>
                <Link href="/vins/rose" className="text-gray-700 dark:text-gray-300 hover:text-copper-600 dark:hover:text-copper-400 text-sm transition-colors">
                  Vin rosé
                </Link>
              </li>
              <li>
                <Link href="/vins/effervescent" className="text-gray-700 dark:text-gray-300 hover:text-copper-600 dark:hover:text-copper-400 text-sm transition-colors">
                  Vin effervescent
                </Link>
              </li>
              <li>
                <Link href="/vins/champagne" className="text-gray-700 dark:text-gray-300 hover:text-copper-600 dark:hover:text-copper-400 text-sm transition-colors">
                  Champagne
                </Link>
              </li>
            </ul>
          </div>

          {/* Mentions Légales */}
          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-6">Mentions Légales</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/qui-sommes-nous" className="text-copper-600 dark:text-copper-400 hover:text-gray-900 dark:hover:text-white text-sm transition-colors">
                  Qui sommes-Nous?
                </Link>
              </li>
              <li>
                <Link href="/politique-confidentialite" className="text-gray-700 dark:text-gray-300 hover:text-copper-600 dark:hover:text-copper-400 text-sm transition-colors">
                  Politique De Confidentialité
                </Link>
              </li>
              <li>
                <Link href="/conditions-generales" className="text-gray-700 dark:text-gray-300 hover:text-copper-600 dark:hover:text-copper-400 text-sm transition-colors">
                  Conditions Générales De Vente
                </Link>
              </li>
              <li>
                <Link href="/politique-retour" className="text-gray-700 dark:text-gray-300 hover:text-copper-600 dark:hover:text-copper-400 text-sm transition-colors">
                  Politique De Retour / Remboursement
                </Link>
              </li>
              <li>
                <Link href="/politique-livraison" className="text-gray-700 dark:text-gray-300 hover:text-copper-600 dark:hover:text-copper-400 text-sm transition-colors">
                  Politique De Livraison
                </Link>
              </li>
              <li>
                <Link href="/politique-cookies" className="text-gray-700 dark:text-gray-300 hover:text-copper-600 dark:hover:text-copper-400 text-sm transition-colors">
                  Politique Des Cookies
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-700 dark:text-gray-300 hover:text-copper-600 dark:hover:text-copper-400 text-sm transition-colors">
                  Nous Contacter
                </Link>
              </li>
            </ul>
          </div>

          {/* Téléchargez Nos Apps */}
          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-4">Téléchargez Nos Apps</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">
              Passez plus rapidement vos commandes et être au courant de nos derniers arrivages
            </p>
            <div className="space-y-3">
              <a
                href="https://play.google.com/store/apps/details?id=com.caveexpress"
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:opacity-80 transition-opacity"
              >
                <Image
                  src="/images/play-store-180x60.png"
                  alt="Télécharger sur Google Play"
                  width={180}
                  height={60}
                  className="h-[50px] w-auto"
                />
              </a>
              <a
                href="https://apps.apple.com/app/cave-express"
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:opacity-80 transition-opacity"
              >
                <Image
                  src="/images/app-store-180x60.png"
                  alt="Télécharger sur App Store"
                  width={180}
                  height={60}
                  className="h-[50px] w-auto"
                />
              </a>
              <a
                href="https://appgallery.huawei.com/app/cave-express"
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:opacity-80 transition-opacity"
              >
                <Image
                  src="/images/huawei-app-gallery-180x60.png"
                  alt="Télécharger sur AppGallery"
                  width={180}
                  height={60}
                  className="h-[50px] w-auto"
                />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Disclaimer */}
        <div className="border-t border-gray-200 dark:border-dark-800 mt-10 pt-6">
          <p className="text-gray-500 text-xs leading-relaxed">
            Consommez de façon responsable : Les produits alcoolisés ne sont pas destinés aux personnes de moins de 21 ans et aux femmes enceintes.
          </p>
        </div>
      </div>
    </footer>
  )
}
