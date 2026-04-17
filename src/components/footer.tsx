import Link from 'next/link'
import Image from 'next/image'
import { Facebook, Instagram, Youtube, MapPin, Twitter } from 'lucide-react'

// Custom SVG icon components
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
    </svg>
  )
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  )
}

function SnapchatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12.917-.217l.076-.028c.167-.06.347-.127.538-.127.236 0 .449.076.609.217.18.153.27.372.27.646 0 .49-.45.873-1.34 1.128-.3.084-.675.168-.96.252-.12.036-.226.072-.3.108-.13.08-.223.182-.275.314-.028.07-.046.15-.046.24.015.3.09.57.18.81a.48.48 0 00.12.15c.63.69 1.44 1.25 2.25 1.56.27.104.57.18.78.21.383.06.53.27.563.36.063.18-.015.39-.135.585-.24.39-.735.69-1.38.87-.21.06-.465.12-.69.168l-.075.015c-.12.03-.21.06-.315.105-.21.09-.39.27-.39.57 0 .12.03.24.075.36.12.3.3.585.45.81.135.21.24.39.27.525.06.255-.06.51-.39.69a2.64 2.64 0 01-.72.24 4.769 4.769 0 01-.84.12c-.21.015-.42.03-.585.06-.165.045-.36.12-.57.21-.39.18-.81.39-1.47.585-.21.06-.45.105-.69.105-.24 0-.48-.045-.72-.135-1.47-.57-2.94-1.71-5.22-1.71s-3.75 1.14-5.22 1.71c-.24.09-.48.135-.72.135-.24 0-.48-.045-.69-.105-.66-.195-1.08-.405-1.47-.585-.21-.09-.405-.165-.57-.21-.165-.03-.375-.045-.585-.06a4.769 4.769 0 01-.84-.12 2.64 2.64 0 01-.72-.24c-.33-.18-.45-.435-.39-.69.03-.135.135-.315.27-.525.15-.225.33-.51.45-.81.045-.12.075-.24.075-.36 0-.3-.18-.48-.39-.57-.105-.045-.195-.075-.315-.105l-.075-.015c-.225-.048-.48-.108-.69-.168-.645-.18-1.14-.48-1.38-.87-.12-.195-.198-.405-.135-.585.033-.09.18-.3.563-.36.21-.03.51-.106.78-.21.81-.31 1.62-.87 2.25-1.56a.48.48 0 00.12-.15c.09-.24.165-.51.18-.81 0-.09-.018-.17-.046-.24a.604.604 0 00-.275-.314c-.074-.036-.18-.072-.3-.108-.285-.084-.66-.168-.96-.252-.89-.255-1.34-.638-1.34-1.128 0-.274.09-.493.27-.646.16-.141.373-.217.609-.217.191 0 .371.067.538.127l.076.028c.258.097.617.201.917.217.198 0 .326-.045.401-.09a11.66 11.66 0 01-.03-.51l-.003-.06c-.104-1.628-.23-3.654.299-4.847C7.859 1.069 11.216.793 12.206.793z"/>
    </svg>
  )
}

const SOCIAL_LINKS = [
  { href: 'https://web.facebook.com/cechemoi', icon: Facebook, label: 'Facebook', color: 'hover:bg-[#1877F2]' },
  { href: 'https://www.instagram.com/cechemoi.ci', icon: Instagram, label: 'Instagram', color: 'hover:bg-[#E4405F]' },
  { href: '#', icon: TikTokIcon, label: 'TikTok', color: 'hover:bg-[#000000]' },
  { href: 'https://youtube.com/@cechemoi', icon: Youtube, label: 'YouTube', color: 'hover:bg-[#FF0000]' },
  { href: '#', icon: Twitter, label: 'X (Twitter)', color: 'hover:bg-[#000000]' },
  { href: 'https://wa.me/2250759545410', icon: WhatsAppIcon, label: 'WhatsApp', color: 'hover:bg-[#25D366]' },
  { href: '#', icon: LinkedInIcon, label: 'LinkedIn', color: 'hover:bg-[#0A66C2]' },
  { href: '#', icon: SnapchatIcon, label: 'Snapchat', color: 'hover:bg-[#FFFC00] hover:!text-black' },
]

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
              <span className="text-gray-500 text-sm block mb-3">Suivez-nous :</span>
              <div className="flex flex-wrap items-center gap-2">
                {SOCIAL_LINKS.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-9 h-9 bg-gray-800 dark:bg-white/10 rounded-full flex items-center justify-center ${social.color} transition-colors group`}
                    title={social.label}
                  >
                    <social.icon className="h-4 w-4 text-white group-hover:text-white" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Menu Principal */}
          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-6">Boutique</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-primary-600 dark:text-primary-400 hover:text-gray-900 dark:hover:text-white text-sm transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link href="/catalogue" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors">
                  Catalogue
                </Link>
              </li>
              <li>
                <Link href="/sur-mesure" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors">
                  Sur-Mesure
                </Link>
              </li>
              <li>
                <Link href="/showroom" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors">
                  Showroom
                </Link>
              </li>
              <li>
                <Link href="/consultation" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors">
                  Rendez-vous
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
              Passez plus rapidement vos commandes et soyez au courant de nos derniers arrivages
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
