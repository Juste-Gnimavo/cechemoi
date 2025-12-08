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

// Custom TikTok icon component
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
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
                <a href="tel:+2250759545410" className="hover:text-primary-500 dark:hover:text-primary-400 transition-colors">
                  +225 0759545410
                </a>
              </li>
              <li className="text-gray-700 dark:text-gray-300 text-sm">
                <span className="text-gray-500">Email:</span>{' '}
                <a href="mailto:cechemoicreations@gmail.com" className="hover:text-primary-500 dark:hover:text-primary-400 transition-colors">
                  cechemoicreations@gmail.com
                </a>
              </li>
              <li className="text-gray-700 dark:text-gray-300 text-sm">
                <span className="text-gray-500">Adresse:</span>
                <span className="block">Cocody Riviera Palmeraie</span>
                <span className="block">Abidjan Côte d&apos;Ivoire</span>
              </li>
            </ul>

            {/* Social Icons */}
            <div className="mt-6">
              <div className="flex items-center gap-3">
                <span className="text-gray-500 text-sm">Social:</span>
                <div className="flex items-center gap-2">
                  <a
                    href="https://web.facebook.com/cechemoi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 bg-gray-800 dark:bg-white rounded-full flex items-center justify-center hover:bg-primary-500 dark:hover:bg-primary-500 transition-colors group"
                    title="Facebook"
                  >
                    <Facebook className="h-4 w-4 text-white dark:text-gray-900 group-hover:text-white" />
                  </a>
                  <a
                    href="https://wa.me/2250759545410"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 bg-gray-800 dark:bg-white rounded-full flex items-center justify-center hover:bg-primary-500 dark:hover:bg-primary-500 transition-colors group"
                    title="WhatsApp"
                  >
                    <WhatsAppIcon className="h-4 w-4 text-white dark:text-gray-900 group-hover:text-white" />
                  </a>
                  <a
                    href="https://www.tiktok.com/@cechemoi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 bg-gray-800 dark:bg-white rounded-full flex items-center justify-center hover:bg-primary-500 dark:hover:bg-primary-500 transition-colors group"
                    title="TikTok"
                  >
                    <TikTokIcon className="h-4 w-4 text-white dark:text-gray-900 group-hover:text-white" />
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2 ml-[52px]">
                <a
                  href="https://www.instagram.com/cechemoi.ci"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-gray-800 dark:bg-white rounded-full flex items-center justify-center hover:bg-primary-500 dark:hover:bg-primary-500 transition-colors group"
                  title="Instagram"
                >
                  <Instagram className="h-4 w-4 text-white dark:text-gray-900 group-hover:text-white" />
                </a>
                <a
                  href="https://youtube.com/@cechemoi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-gray-800 dark:bg-white rounded-full flex items-center justify-center hover:bg-primary-500 dark:hover:bg-primary-500 transition-colors group"
                  title="YouTube"
                >
                  <Youtube className="h-4 w-4 text-white dark:text-gray-900 group-hover:text-white" />
                </a>
                <a
                  href="https://maps.google.com/?q=Faya+Cité+Genie+2000+Abidjan"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-gray-800 dark:bg-white rounded-full flex items-center justify-center hover:bg-primary-500 dark:hover:bg-primary-500 transition-colors group"
                  title="Localisation"
                >
                  <MapPin className="h-4 w-4 text-white dark:text-gray-900 group-hover:text-white" />
                </a>
              </div>
            </div>
          </div>

          {/* Menu Principal */}
          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-6">Collections</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-primary-600 dark:text-primary-400 hover:text-gray-900 dark:hover:text-white text-sm transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link href="/categorie/robes" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors">
                  Robes
                </Link>
              </li>
              <li>
                <Link href="/categorie/ensembles" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors">
                  Ensembles
                </Link>
              </li>
              <li>
                <Link href="/categorie/sur-mesure" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors">
                  Sur-Mesure
                </Link>
              </li>
              <li>
                <Link href="/categorie/pret-a-porter" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors">
                  Prêt-à-Porter
                </Link>
              </li>
              <li>
                <Link href="/categorie/accessoires" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors">
                  Accessoires
                </Link>
              </li>
              <li>
                <Link href="/catalogue" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors">
                  Tout le catalogue
                </Link>
              </li>
            </ul>
          </div>

          {/* Mentions Légales */}
          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-6">Mentions Légales</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/qui-sommes-nous" className="text-primary-600 dark:text-primary-400 hover:text-gray-900 dark:hover:text-white text-sm transition-colors">
                  Qui sommes-Nous?
                </Link>
              </li>
              <li>
                <Link href="/politique-confidentialite" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors">
                  Politique De Confidentialité
                </Link>
              </li>
              <li>
                <Link href="/conditions-generales" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors">
                  Conditions Générales De Vente
                </Link>
              </li>
              <li>
                <Link href="/politique-retour" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors">
                  Politique De Retour / Remboursement
                </Link>
              </li>
              <li>
                <Link href="/politique-livraison" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors">
                  Politique De Livraison
                </Link>
              </li>
              <li>
                <Link href="/politique-cookies" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors">
                  Politique Des Cookies
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors">
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
                href="https://play.google.com/store/apps/details?id=com.cechemoi"
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
                href="https://apps.apple.com/app/cechemoi"
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
                href="https://appgallery.huawei.com/app/cechemoi"
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

        {/* Bottom Copyright */}
        <div className="border-t border-gray-200 dark:border-dark-800 mt-10 pt-6">
          <p className="text-gray-500 text-xs leading-relaxed text-center">
            © {new Date().getFullYear()} CÈCHÉMOI - Originalité, Créativité et Beauté de Chez Moi. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  )
}
