import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'ddtetstxq',
  api_key: process.env.CLOUDINARY_API_KEY || '248835256494799',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'pQpG5r6QfXzbIeUdPmZbYhQcp0I',
})

export { cloudinary }

// Helper function to upload image to Cloudinary
export const uploadToCloudinary = async (file: File, folder: string = 'loudbrands'): Promise<string> => {
  try {
    console.log('Starting Cloudinary upload for:', file.name)
    console.log('File size:', file.size, 'File type:', file.type)
    console.log('Target folder:', folder)
    
    // Convert File to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataURI = `data:${file.type};base64,${base64}`
    
    console.log('Data URI created, length:', dataURI.length)

    // Upload to Cloudinary using the SDK with explicit config
    console.log('Uploading to Cloudinary using SDK...')
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: folder,
      resource_type: 'auto',
      quality: 'auto',
      fetch_format: 'auto',
      use_filename: true,
      unique_filename: true
    })
    
    console.log('Cloudinary upload successful:', result.secure_url)
    return result.secure_url
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    throw new Error('Failed to upload image')
  }
}

// Helper function to delete image from Cloudinary
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error)
    throw new Error('Failed to delete image')
  }
}

// Helper function to get public ID from URL
export const getPublicIdFromUrl = (url: string): string => {
  const parts = url.split('/')
  const filename = parts[parts.length - 1]
  const publicId = filename.split('.')[0]
  return `loudbrands/${publicId}`
}
