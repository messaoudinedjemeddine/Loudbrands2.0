import { NextRequest, NextResponse } from 'next/server'

// Cache categories for 5 minutes (they change less frequently)
export const revalidate = 300

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const brand = searchParams.get('brand')
    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://loudbrands-backend-eu-abfa65dd1df6.herokuapp.com'

    // Forward all query parameters to the backend
    const backendUrlWithParams = `${backendUrl}/api/categories?${searchParams.toString()}`

    const response = await fetch(backendUrlWithParams, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Use cache with revalidation instead of no-store
      next: { revalidate: 300 }
    })

    if (!response.ok) {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.error(`Backend responded with status: ${response.status}`)
      }
      // Return empty array instead of throwing error
      return NextResponse.json({ categories: [] })
    }

    const data = await response.json()
    // Return the backend response as-is to preserve the { categories: [...] } format
    const result = NextResponse.json(data)

    // No-store so category images load on first visit (avoids grey images from stale cache)
    result.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')

    return result
  } catch (error) {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching categories:', error)
    }
    // Return empty array instead of error response
    return NextResponse.json({ categories: [] })
  }
} 