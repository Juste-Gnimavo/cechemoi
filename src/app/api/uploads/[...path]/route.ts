import { NextRequest, NextResponse } from 'next/server'
import { readFile, stat } from 'fs/promises'
import path from 'path'

// MIME types mapping
const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.avif': 'image/avif',
}

// Cache duration (1 year for immutable content)
const CACHE_MAX_AGE = 31536000

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params
    const filePath = pathSegments.join('/')

    // Security: prevent directory traversal
    if (filePath.includes('..') || filePath.includes('//')) {
      return new NextResponse('Invalid path', { status: 400 })
    }

    // Only allow specific directories
    const allowedDirs = ['products', 'categories', 'blog', 'campaigns', 'temp']
    const firstSegment = pathSegments[0]
    if (!allowedDirs.includes(firstSegment)) {
      return new NextResponse('Not found', { status: 404 })
    }

    // Construct full path
    const fullPath = path.join(process.cwd(), 'public', 'uploads', filePath)

    // Check if file exists
    try {
      await stat(fullPath)
    } catch {
      return new NextResponse('Not found', { status: 404 })
    }

    // Get file extension and MIME type
    const ext = path.extname(fullPath).toLowerCase()
    const mimeType = MIME_TYPES[ext]

    if (!mimeType) {
      return new NextResponse('Unsupported file type', { status: 415 })
    }

    // Read and return file
    const fileBuffer = await readFile(fullPath)

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, immutable`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error serving upload:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
