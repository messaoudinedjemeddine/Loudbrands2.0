import { NextRequest, NextResponse } from 'next/server'

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
      cache: 'no-store' // Disable caching to always get fresh data
    })

    if (!response.ok) {
      console.error(`Backend responded with status: ${response.status}`)
      // Return empty array instead of throwing error
      return NextResponse.json([])
    }

    const data = await response.json()
    // Return the backend response as-is to preserve the { categories: [...] } format
    const result = NextResponse.json(data)

    // Add cache control headers to prevent caching
    result.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    result.headers.set('Pragma', 'no-cache')
    result.headers.set('Expires', '0')

    return result
  } catch (error) {
    console.error('Error fetching categories:', error)
    // Return empty array instead of error response
    return NextResponse.json([])
  }
} 