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

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <Header />
      <main className="flex-1">
        <FashionHero />
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
