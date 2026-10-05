import { Header } from '@/components/header-legacy'
import { Footer } from '@/components/footer'
import { FashionHero } from '@/components/home/fashion-hero'
import { FashionCategories } from '@/components/home/fashion-categories'
import { FashionFeatured } from '@/components/home/fashion-featured'
import { FashionCategoryTabs } from '@/components/home/fashion-category-tabs'
import { FashionCategorySections } from '@/components/home/fashion-category-sections'
import { FashionWhyUs } from '@/components/home/fashion-why-us'
import { FashionGallery } from '@/components/home/fashion-gallery'
import { FashionSubcategories } from '@/components/home/fashion-subcategories'
import { getActiveHeroSlides } from '@/lib/hero-slides'

// Le bandeau est rendu côté serveur (pas de flash d'image par défaut) et mis
// en cache 2 minutes ; les écrans d'admin appellent revalidatePath('/') à
// chaque modification, le délai ne joue donc qu'en cas d'édition directe en base.
export const revalidate = 120

export default async function HomePage() {
  const heroSlides = await getActiveHeroSlides()

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <Header />
      <main className="flex-1">
        <FashionHero slides={heroSlides} />
        <FashionCategories />
        <FashionFeatured />
        <FashionCategoryTabs />
        <FashionCategorySections />
        <FashionWhyUs />
        <FashionSubcategories />
        <FashionGallery />
      </main>
      <Footer />
    </div>
  )
}
