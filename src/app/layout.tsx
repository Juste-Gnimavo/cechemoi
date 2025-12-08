import type { Metadata } from 'next'
import { Jost, Playfair_Display } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { Providers } from '@/components/providers'
import { WhatsAppWidget } from '@/components/whatsapp-widget'

const jost = Jost({
  subsets: ['latin'],
  variable: '--font-jost',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
})

export const metadata: Metadata = {
  title: 'Cave Express - Vins de Qualité à Abidjan',
  description: 'Cave Express est une cave en ligne et un service de livraison de vins haut de gamme à Abidjan, Côte d\'Ivoire. Plus de 700 références de vins, champagnes et spiritueux.',
  keywords: 'cave, vin, abidjan, côte d\'ivoire, livraison, champagne, spiritueux, vin rouge, vin blanc, vin rosé',
  authors: [{ name: 'Cave Express' }],
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'Cave Express - Vins de Qualité à Abidjan',
    description: 'La QUALITÉ du vin, livrée à votre porte',
    url: 'https://cave-express.ci',
    siteName: 'Cave Express',
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: '/logo/web/icon-512.png',
        width: 512,
        height: 512,
        alt: 'Cave Express Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cave Express - Vins de Qualité à Abidjan',
    description: 'La QUALITÉ du vin, livrée à votre porte',
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
                  var stored = localStorage.getItem('cave-express-theme');
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
          <WhatsAppWidget />
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
