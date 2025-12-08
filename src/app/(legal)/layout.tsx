import Link from 'next/link'
import { Header } from '@/components/header-legacy'
import { Footer } from '@/components/footer'

const legalLinks = [
  { href: '/qui-sommes-nous', label: 'Qui sommes-Nous?' },
  { href: '/politique-confidentialite', label: 'Politique de Confidentialité' },
  { href: '/conditions-generales', label: 'Conditions Générales de Vente' },
  { href: '/politique-retour', label: 'Politique de Retour' },
  { href: '/politique-livraison', label: 'Politique de Livraison' },
  { href: '/politique-cookies', label: 'Politique des Cookies' },
  { href: '/contact', label: 'Nous Contacter' },
]

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1115] flex flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-1">
              <div className="bg-white dark:bg-[#1a1d24] rounded-xl p-6 sticky top-24 shadow-lg shadow-black/5 dark:shadow-black/20">
                <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-4">Mentions Légales</h3>
                <nav className="space-y-2">
                  {legalLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block text-gray-500 dark:text-gray-400 hover:text-copper-500 text-sm py-2 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-[#1a1d24] rounded-xl p-8 shadow-lg shadow-black/5 dark:shadow-black/20">
                {children}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
