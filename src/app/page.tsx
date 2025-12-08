import { Header } from '@/components/header-legacy'
import { Footer } from '@/components/footer'
import { WineCategories } from '@/components/home/wine-categories-legacy'
import { FeaturedProducts } from '@/components/home/featured-products'
import { SpiritsSection } from '@/components/home/spirits-section'
import { BlogSection } from '@/components/home/blog-section'
import { WineTypesSections } from '@/components/home/wine-types-sections'
import { AppComingSoonModal } from '@/components/app-coming-soon-modal'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#1a1d24]">
      <Header />
      <main className="flex-1 bg-gray-50 dark:bg-[#1a1d24]">
        <WineCategories />
        <FeaturedProducts />
        <WineTypesSections/>
        <BlogSection />
      </main>
      <Footer />

      {/* App Coming Soon Modal */}
      <AppComingSoonModal />
    </div>
  )
}
