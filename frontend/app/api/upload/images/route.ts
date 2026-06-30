import { NextRequest, NextResponse } from 'next/server'
import { uploadToCloudinary } from '@/lib/cloudinary'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('images') as File[]
    const folder = formData.get('folder') as string || 'loudbrands/categories'

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    // Validate each file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const maxSize = 10 * 1024 * 1024 // 10MB

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ error: `Invalid file type for ${file.name}. Only JPEG, PNG, WebP, and GIF are allowed.` }, { status: 400 })
      }
      if (file.size > maxSize) {
        return NextResponse.json({ error: `File ${file.name} is too large. Maximum size is 10MB.` }, { status: 400 })
      }
    }

    // Upload all files to Cloudinary
    const uploadPromises = files.map(file => uploadToCloudinary(file, folder))
    const urls = await Promise.all(uploadPromises)

    return NextResponse.json({ 
      success: true, 
      urls: urls,
      message: `${urls.length} image(s) uploaded successfully` 
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ 
      error: 'Failed to upload images',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 