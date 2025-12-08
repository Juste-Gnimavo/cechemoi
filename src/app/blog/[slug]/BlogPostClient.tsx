'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  BookOpen,
  Clock,
  Eye,
  Calendar,
  Tag,
  ArrowLeft,
  ArrowRight,
  Share2,
  Facebook,
  Twitter,
  Linkedin
} from 'lucide-react'
import { Header } from '@/components/header-legacy'
import { Footer } from '@/components/footer'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  image: string | null
  publishedAt: Date | null
  readTime: number | null
  viewCount: number
  authorName: string | null
  author: {
    id: string
    name: string | null
    image: string | null
  }
  category: {
    id: string
    name: string
    slug: string
    color: string | null
  } | null
  tags: {
    id: string
    name: string
    slug: string
    color: string | null
  }[]
}

interface RelatedPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  image: string | null
  publishedAt: Date | null
  readTime: number | null
  category: {
    id: string
    name: string
    slug: string
    color: string | null
  } | null
}

interface Props {
  post: BlogPost
  relatedPosts: RelatedPost[]
}

export default function BlogPostClient({ post, relatedPosts }: Props) {
  const formatDate = (date: Date | null) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#1a1d24]">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative">
          {/* Featured Image */}
          {post.image && (
            <div className="relative h-[50vh] md:h-[60vh]">
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-50 dark:from-[#1a1d24] via-gray-50/50 dark:via-[#1a1d24]/50 to-transparent" />
            </div>
          )}

          {/* Content Overlay */}
          <div className={`${post.image ? 'absolute bottom-0 left-0 right-0' : 'pt-20 bg-gray-50 dark:bg-[#1a1d24]'}`}>
            <div className="container mx-auto px-4 pb-8">
              {/* Back Link */}
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour au blog
              </Link>

              {/* Category */}
              {post.category && (
                <Link
                  href={`/blog?category=${post.category.slug}`}
                  className="inline-block mb-4"
                >
                  <span
                    className="text-white text-sm font-semibold px-4 py-2 rounded-full"
                    style={{ backgroundColor: post.category.color || '#8b5cf6' }}
                  >
                    {post.category.name}
                  </span>
                </Link>
              )}

              {/* Title */}
              <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 max-w-4xl">
                {post.title}
              </h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 text-gray-600 dark:text-gray-400">
                {/* Author */}
                <div className="flex items-center gap-2">
                  {post.author?.image ? (
                    <Image
                      src={post.author.image}
                      alt={post.author.name || 'Author'}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 dark:bg-dark-700 rounded-full flex items-center justify-center">
                      <span className="text-gray-900 dark:text-white font-bold">
                        {(post.authorName || post.author?.name || 'A').charAt(0)}
                      </span>
                    </div>
                  )}
                  <span>{post.authorName || post.author?.name || 'Admin'}</span>
                </div>

                <span className="w-1 h-1 bg-gray-400 dark:bg-gray-600 rounded-full" />

                {/* Date */}
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(post.publishedAt)}
                </span>

                <span className="w-1 h-1 bg-gray-400 dark:bg-gray-600 rounded-full" />

                {/* Read Time */}
                {post.readTime && (
                  <>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {post.readTime} min de lecture
                    </span>
                    <span className="w-1 h-1 bg-gray-400 dark:bg-gray-600 rounded-full" />
                  </>
                )}

                {/* Views */}
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {post.viewCount} vues
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Main Content */}
              <article className="lg:col-span-8">
                {/* Excerpt */}
                {post.excerpt && (
                  <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                    {post.excerpt}
                  </p>
                )}

                {/* Content */}
                <div
                  className="prose prose-gray dark:prose-invert prose-lg max-w-none
                    prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-white
                    prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-p:leading-relaxed
                    prose-a:text-primary-500 prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-gray-900 dark:prose-strong:text-white
                    prose-ul:text-gray-600 dark:prose-ul:text-gray-300 prose-ol:text-gray-600 dark:prose-ol:text-gray-300
                    prose-blockquote:border-primary-500 prose-blockquote:text-gray-500 dark:prose-blockquote:text-gray-400
                    prose-code:text-primary-500 dark:prose-code:text-primary-400 prose-code:bg-gray-100 dark:prose-code:bg-dark-800 prose-code:px-2 prose-code:py-1 prose-code:rounded
                    prose-pre:bg-gray-100 dark:prose-pre:bg-dark-800 prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-dark-700
                    prose-img:rounded-xl"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />

                {/* Tags */}
                {post.tags.length > 0 && (
                  <div className="mt-12 pt-8 border-t border-gray-200 dark:border-dark-700">
                    <h3 className="text-gray-900 dark:text-white font-semibold mb-4 flex items-center gap-2">
                      <Tag className="h-5 w-5" />
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map(tag => (
                        <Link
                          key={tag.id}
                          href={`/blog?tag=${tag.slug}`}
                          className="px-4 py-2 rounded-full text-sm transition-colors hover:opacity-80"
                          style={{
                            backgroundColor: (tag.color || '#22c55e') + '20',
                            color: tag.color || '#22c55e'
                          }}
                        >
                          {tag.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Share */}
                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-dark-700">
                  <h3 className="text-gray-900 dark:text-white font-semibold mb-4 flex items-center gap-2">
                    <Share2 className="h-5 w-5" />
                    Partager cet article
                  </h3>
                  <div className="flex gap-3">
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-gray-100 dark:bg-dark-800 hover:bg-blue-600 text-gray-700 hover:text-white dark:text-white rounded-lg transition-colors"
                    >
                      <Facebook className="h-5 w-5" />
                    </a>
                    <a
                      href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-gray-100 dark:bg-dark-800 hover:bg-sky-500 text-gray-700 hover:text-white dark:text-white rounded-lg transition-colors"
                    >
                      <Twitter className="h-5 w-5" />
                    </a>
                    <a
                      href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(post.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-gray-100 dark:bg-dark-800 hover:bg-blue-700 text-gray-700 hover:text-white dark:text-white rounded-lg transition-colors"
                    >
                      <Linkedin className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              </article>

              {/* Sidebar */}
              <aside className="lg:col-span-4">
                <div className="sticky top-24 space-y-8">
                  {/* Related Posts */}
                  {relatedPosts.length > 0 && (
                    <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-sm dark:shadow-none">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                        Articles similaires
                      </h3>
                      <div className="space-y-4">
                        {relatedPosts.map(related => (
                          <Link
                            key={related.id}
                            href={`/blog/${related.slug}`}
                            className="group flex gap-4"
                          >
                            {related.image ? (
                              <Image
                                src={related.image}
                                alt={related.title}
                                width={80}
                                height={80}
                                className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-20 h-20 bg-gray-200 dark:bg-dark-700 rounded-lg flex items-center justify-center flex-shrink-0">
                                <BookOpen className="h-6 w-6 text-gray-400 dark:text-gray-600" />
                              </div>
                            )}
                            <div>
                              <h4 className="text-gray-900 dark:text-white font-medium group-hover:text-primary-400 transition-colors line-clamp-2">
                                {related.title}
                              </h4>
                              <p className="text-gray-500 text-sm mt-1">
                                {formatDate(related.publishedAt)}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Newsletter CTA */}
                  <div className="bg-gradient-to-br from-primary-500/20 to-primary-600/10 border border-primary-500/30 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Restez informé
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Recevez nos derniers articles et conseils directement dans votre boîte mail.
                    </p>
                    <Link
                      href="/contact"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors w-full justify-center"
                    >
                      S'abonner
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
