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

    // Validate file type - support design files
    const validTypes = [
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/tiff',
      'image/bmp',
      // Design files - Adobe
      'image/vnd.adobe.photoshop',      // PSD
      'application/x-photoshop',         // PSD alternative
      'application/photoshop',           // PSD alternative
      'application/psd',                 // PSD alternative
      'application/illustrator',         // AI
      'application/postscript',          // AI/EPS
      'application/eps',                 // EPS
      'application/x-eps',               // EPS alternative
      'image/x-eps',                     // EPS alternative
      'application/x-indesign',          // INDD
      'application/pdf',                 // PDF
      // Design files - Other
      'application/x-sketch',            // Sketch
      'application/sketch',              // Sketch alternative
      'application/figma',               // Figma
      'application/x-figma',             // Figma alternative
      // Documents
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      // RAW image formats
      'image/x-canon-cr2',               // Canon RAW
      'image/x-nikon-nef',               // Nikon RAW
      'image/x-sony-arw',                // Sony RAW
      'image/x-adobe-dng',               // Adobe DNG
    ]

    // Also check by file extension for design files (browsers may not detect MIME correctly)
    const ext = path.extname(file.name).toLowerCase()
    const validExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.tiff', '.tif', '.bmp',
      '.psd', '.ai', '.eps', '.indd', '.pdf',
      '.sketch', '.fig', '.xd',
      '.cr2', '.nef', '.arw', '.dng', '.raw',
      '.doc', '.docx'
    ]

    if (!validTypes.includes(file.type) && !validExtensions.includes(ext)) {
      return NextResponse.json(
        { error: 'Type de fichier invalide. Formats acceptés: Images (JPG, PNG, GIF, WEBP, SVG, TIFF), Design (PSD, AI, EPS, PDF, INDD, Sketch, Figma, XD), RAW (CR2, NEF, ARW, DNG)' },
        { status: 400 }
      )
    }

    // Validate file size - 500MB max for design files
    const maxSize = 500 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux. Maximum 500MB' },
        { status: 400 }
      )
    }

    // Generate unique filename (reuse ext from validation, fallback to MIME type)
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 9)
    const fileExt = ext || `.${file.type.split('/')[1]}`
    const filename = `${timestamp}-${randomString}${fileExt}`

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
