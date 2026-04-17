import { Header } from '@/components/header-legacy'
import { Footer } from '@/components/footer'
import { CategorySidebar, CategorySidebarMobile } from '@/components/category-sidebar'

export default function CategoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-950">
      <Header />
      <main className="flex-1">
        {/* Mobile category pills — persists across navigations */}
        <CategorySidebarMobile />

        {/* Content with persistent sidebar */}
        <div className="container mx-auto px-4 py-8 lg:py-12">
          <div className="flex gap-8">
            {/* Desktop Sidebar — persists across navigations */}
            <CategorySidebar />

            {/* Page content changes here */}
            <div className="flex-1 min-w-0">
              {children}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
