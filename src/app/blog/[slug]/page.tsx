import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import BlogPostClient from './BlogPostClient'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  const post = await prisma.blogPost.findUnique({
    where: { slug, published: true },
    select: {
      title: true,
      excerpt: true,
      metaTitle: true,
      metaDescription: true,
      image: true
    }
  })

  if (!post) {
    return {
      title: 'Article non trouvé - Cave Express'
    }
  }

  return {
    title: post.metaTitle || `${post.title} - Cave Express`,
    description: post.metaDescription || post.excerpt || '',
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt || '',
      images: post.image ? [{ url: post.image }] : []
    }
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params

  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          color: true
        }
      },
      author: {
        select: {
          id: true,
          name: true,
          image: true
        }
      },
      tags: {
        include: {
          tag: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true
            }
          }
        }
      }
    }
  })

  if (!post || !post.published) {
    notFound()
  }

  // Increment view count
  await prisma.blogPost.update({
    where: { id: post.id },
    data: { viewCount: { increment: 1 } }
  })

  // Get related posts
  const relatedPosts = await prisma.blogPost.findMany({
    where: {
      published: true,
      categoryId: post.categoryId,
      id: { not: post.id }
    },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      image: true,
      publishedAt: true,
      readTime: true,
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          color: true
        }
      }
    },
    orderBy: { publishedAt: 'desc' },
    take: 3
  })

  // Format post for client
  const formattedPost = {
    ...post,
    tags: post.tags.map(t => t.tag)
  }

  return <BlogPostClient post={formattedPost} relatedPosts={relatedPosts} />
}
