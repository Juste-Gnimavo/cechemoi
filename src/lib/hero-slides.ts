import { prisma } from '@/lib/prisma'

// Bandeau de l'accueil du site. Les images par défaut sont celles livrées
// avec le site ; dès qu'au moins une image active existe en base, elles ne
// sont plus utilisées. L'écran /admin/storefront permet de les reprendre.

export interface HeroSlideData {
  id: string
  image: string
  alt: string
  link: string | null
}

export const DEFAULT_HERO_SLIDES: HeroSlideData[] = [
  {
    id: 'default-1',
    image: '/slides/slide1.jpg?v=2',
    alt: 'Bienvenue sur la plateforme CÈCHÉMOI — L’excellence au service de votre style',
    link: null,
  },
  {
    id: 'default-2',
    image: '/slides/slide2.jpg?v=2',
    alt: 'Nouvelle Collection 2026 — Élégance, Style Africain, Prêt-à-Porter, Sur-Mesure',
    link: null,
  },
  {
    id: 'default-3',
    image: '/slides/slide3.jpg?v=2',
    alt: 'CÈCHÉMOI — Mode Africaine, Élégance et Tradition',
    link: null,
  },
]

/** Slides actives, ordonnées. Retombe sur les images par défaut si la base
 *  est vide ou injoignable (par exemple pendant le build). */
export async function getActiveHeroSlides(): Promise<HeroSlideData[]> {
  try {
    const slides = await prisma.heroSlide.findMany({
      where: { active: true },
      orderBy: { position: 'asc' },
      select: { id: true, image: true, alt: true, link: true },
    })
    return slides.length > 0 ? slides : DEFAULT_HERO_SLIDES
  } catch (error) {
    console.error('Error loading hero slides, using defaults:', error)
    return DEFAULT_HERO_SLIDES
  }
}

/** Lien interne (/catalogue) ou URL https ; tout le reste est refusé. */
export function isValidSlideLink(link: unknown): link is string {
  if (typeof link !== 'string') return false
  const value = link.trim()
  return value.startsWith('/') || /^https?:\/\//i.test(value)
}
