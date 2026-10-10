import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { uploadToS3 } from '@/lib/s3-client'
import { isTeamRole } from '@/lib/role-permissions'

// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// La `category` sert à construire le chemin de stockage (disque ou clé S3) :
// elle est validée avant tout usage. Équipe : un dossier en minuscules,
// chiffres et tirets, ou `custom-orders/<id>` (pièces jointes d'une commande).
// Aucun `..`, aucun autre `/`.
const TEAM_CATEGORY = /^(?:[a-z0-9][a-z0-9-]{0,49}|custom-orders\/[a-z0-9]{1,40})$/

// Toute autre session (cliente) : la photo de profil, rien d'autre.
const CUSTOMER_CATEGORIES = ['avatars']
const CUSTOMER_MAX_SIZE = 5 * 1024 * 1024

// Type réel d'une image d'après ses premiers octets, jamais d'après le
// `Content-Type` ou l'extension déclarés par le client.
function sniffImage(buffer: Buffer): { mime: string; ext: string } | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: 'image/jpeg', ext: '.jpg' }
  }
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return { mime: 'image/png', ext: '.png' }
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { mime: 'image/webp', ext: '.webp' }
  }
  return null
}

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

    const isTeam = isTeamRole((session.user as { role?: string } | undefined)?.role)

    const formData = await req.formData()
    const file = formData.get('file') as File
    const category = (formData.get('category') as string) || 'temp'

    if (isTeam ? !TEAM_CATEGORY.test(category) : !CUSTOMER_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: isTeam ? 'Dossier de destination invalide' : 'Envoi non autorisé' },
        { status: isTeam ? 400 : 403 }
      )
    }

    // Auto-detect S3: use S3 if configured, otherwise fall back to local storage
    const s3Configured = !!(process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY)
    const forceLocal = formData.get('forceLocal') === 'true'
    const useS3 = s3Configured && !forceLocal

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      )
    }

    // Cliente : photo de profil JPEG, PNG ou WebP uniquement, type vérifié sur
    // les octets ; l'extension et le Content-Type stockés en découlent.
    let sniffed: { mime: string; ext: string } | null = null
    if (!isTeam) {
      if (file.size > CUSTOMER_MAX_SIZE) {
        return NextResponse.json(
          { error: 'Fichier trop volumineux. Maximum 5 Mo' },
          { status: 403 }
        )
      }
      sniffed = sniffImage(Buffer.from(await file.arrayBuffer()))
      if (!sniffed) {
        return NextResponse.json(
          { error: 'Seules les images JPEG, PNG ou WebP sont acceptées' },
          { status: 403 }
        )
      }
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
    const fileExt = sniffed ? sniffed.ext : ext || `.${file.type.split('/')[1]}`
    const contentType = sniffed ? sniffed.mime : file.type
    const filename = `${timestamp}-${randomString}${fileExt}`

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    let publicUrl: string

    if (useS3) {
      // Upload to S3
      const s3Key = `${category}/${filename}`
      publicUrl = await uploadToS3(s3Key, buffer, contentType)
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
      type: contentType,
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

    if (!session || !session.user || !isTeamRole((session.user as any).role)) {
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
