import type { Metadata } from 'next'
import { Jost, Playfair_Display } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { Providers } from '@/components/providers'

const jost = Jost({
  subsets: ['latin'],
  variable: '--font-jost',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
})

export const metadata: Metadata = {
  title: 'CÈCHÉMOI - Originalité, Créativité et Beauté de Chez Moi',
  description: 'Découvrez notre collection exclusive de vêtements prêt-à-porter, créés par nos stylistes pour sublimer votre silhouette.',
  keywords: 'mode africaine, pagne, wax, couture, sur-mesure, prêt-à-porter, robes, abidjan, côte d\'ivoire, fashion, african fashion',
  authors: [{ name: 'CÈCHÉMOI' }],
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'CÈCHÉMOI - Originalité, Créativité et Beauté de Chez Moi',
    description: 'Découvrez notre collection exclusive de vêtements prêt-à-porter, créés par nos stylistes pour sublimer votre silhouette.',
    url: 'https://cechemoi.com',
    siteName: 'CÈCHÉMOI',
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: '/logo/web/icon-512.png',
        width: 512,
        height: 512,
        alt: 'CÈCHÉMOI Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CÈCHÉMOI - Originalité, Créativité et Beauté de Chez Moi',
    description: 'Découvrez notre collection exclusive de vêtements prêt-à-porter, créés par nos stylistes pour sublimer votre silhouette.',
    images: ['/logo/web/icon-512.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <head>
        {/* Script to prevent flash of incorrect theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('cechemoi-theme');
                  if (stored) {
                    var parsed = JSON.parse(stored);
                    var theme = parsed.state?.theme || 'dark';
                    document.documentElement.classList.remove('light', 'dark');
                    document.documentElement.classList.add(theme);
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${jost.variable} ${playfair.variable} font-sans`}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-primary)',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
