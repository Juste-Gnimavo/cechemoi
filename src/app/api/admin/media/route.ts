import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { readdir, stat, unlink } from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

interface MediaFile {
  id: string
  name: string
  url: string
  fullUrl: string
  category: string
  type: string
  size: number
  createdAt: Date
}

// GET - List all media files
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const category = searchParams.get('category') // Filter by category
    const type = searchParams.get('type') // Filter by type (image, pdf)
    const search = searchParams.get('search') // Search by filename
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    const files: MediaFile[] = []

    // Get all subdirectories (categories)
    let categories: string[] = []
    try {
      const entries = await readdir(uploadsDir, { withFileTypes: true })
      categories = entries.filter(e => e.isDirectory()).map(e => e.name)
    } catch (err) {
      // If uploads directory doesn't exist, return empty
      return NextResponse.json({
        success: true,
        files: [],
        categories: [],
        pagination: { page, limit, total: 0, totalPages: 0 }
      })
    }

    // Filter categories if specified
    const categoriesToScan = category ? [category] : categories

    // Scan each category directory
    for (const cat of categoriesToScan) {
      const catDir = path.join(uploadsDir, cat)

      try {
        const catFiles = await readdir(catDir)

        for (const filename of catFiles) {
          const filePath = path.join(catDir, filename)
          const fileStat = await stat(filePath)

          if (!fileStat.isFile()) continue

          const ext = path.extname(filename).toLowerCase()
          const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)
          const isPdf = ext === '.pdf'
          const isDoc = ['.doc', '.docx'].includes(ext)

          // Apply type filter
          if (type === 'image' && !isImage) continue
          if (type === 'pdf' && !isPdf) continue
          if (type === 'document' && !isDoc) continue

          // Apply search filter
          if (search && !filename.toLowerCase().includes(search.toLowerCase())) continue

          const fileType = isImage ? 'image' : isPdf ? 'pdf' : isDoc ? 'document' : 'other'

          files.push({
            id: `${cat}/${filename}`,
            name: filename,
            url: `/uploads/${cat}/${filename}`,
            fullUrl: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/uploads/${cat}/${filename}`,
            category: cat,
            type: fileType,
            size: fileStat.size,
            createdAt: fileStat.birthtime,
          })
        }
      } catch (err) {
        // Skip if category directory doesn't exist or can't be read
        continue
      }
    }

    // Sort by creation date (newest first)
    files.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Pagination
    const total = files.length
    const totalPages = Math.ceil(total / limit)
    const startIndex = (page - 1) * limit
    const paginatedFiles = files.slice(startIndex, startIndex + limit)

    return NextResponse.json({
      success: true,
      files: paginatedFiles,
      categories,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    })
  } catch (error) {
    console.error('Error listing media:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des médias' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a media file
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { fileId } = await req.json()

    if (!fileId) {
      return NextResponse.json({ error: 'ID du fichier requis' }, { status: 400 })
    }

    // Security: validate fileId format (category/filename)
    const parts = fileId.split('/')
    if (parts.length !== 2) {
      return NextResponse.json({ error: 'Format de fichier invalide' }, { status: 400 })
    }

    const [category, filename] = parts

    // Prevent path traversal attacks
    if (category.includes('..') || filename.includes('..')) {
      return NextResponse.json({ error: 'Chemin invalide' }, { status: 400 })
    }

    const filePath = path.join(process.cwd(), 'public', 'uploads', category, filename)

    // Check if file exists and delete
    try {
      await unlink(filePath)
      return NextResponse.json({
        success: true,
        message: 'Fichier supprimé avec succès'
      })
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return NextResponse.json({ error: 'Fichier non trouvé' }, { status: 404 })
      }
      throw err
    }
  } catch (error) {
    console.error('Error deleting media:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du fichier' },
      { status: 500 }
    )
  }
}
