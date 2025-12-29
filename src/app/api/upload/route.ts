import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { uploadToS3 } from '@/lib/s3-client'

// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Require authentication for uploads
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const category = (formData.get('category') as string) || 'temp'
    const useS3 = formData.get('useS3') === 'true' // Use S3 if specified

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      )
    }

    // Validate file type
    const validTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]

    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Type de fichier invalide. Utilisez JPG, PNG, GIF, WEBP ou PDF' },
        { status: 400 }
      )
    }

    // Validate file size (5MB for images, 50MB for documents)
    const maxSize = file.type.startsWith('image/') ? 5 * 1024 * 1024 : 50 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `Fichier trop volumineux. Maximum ${file.type.startsWith('image/') ? '5' : '50'}MB` },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 9)
    const ext = path.extname(file.name) || `.${file.type.split('/')[1]}`
    const filename = `${timestamp}-${randomString}${ext}`

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    let publicUrl: string

    if (useS3) {
      // Upload to S3
      const s3Key = `${category}/${filename}`
      publicUrl = await uploadToS3(s3Key, buffer, file.type)
    } else {
      // Save to local filesystem (legacy behavior)
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', category)
      await mkdir(uploadDir, { recursive: true })
      const filepath = path.join(uploadDir, filename)
      await writeFile(filepath, buffer)
      publicUrl = `/uploads/${category}/${filename}`
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
      size: file.size,
      type: file.type,
      storage: useS3 ? 's3' : 'local',
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du téléchargement' },
      { status: 500 }
    )
  }
}

// Optional: GET endpoint to list uploaded files
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const searchParams = req.nextUrl.searchParams
    const category = searchParams.get('category') || 'temp'

    // Note: For listing files, you'd need to use fs.readdir
    // This is a placeholder response
    return NextResponse.json({
      success: true,
      message: 'Endpoint de listage non implémenté',
      category,
    })
  } catch (error) {
    console.error('List files error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des fichiers' },
      { status: 500 }
    )
  }
}
