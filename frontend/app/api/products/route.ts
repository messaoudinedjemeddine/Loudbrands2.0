import { NextRequest, NextResponse } from 'next/server'

// Cache products for 15 seconds so primary picture updates show quickly (ISR)
export const revalidate = 15

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const brand = searchParams.get('brand')
    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://loudbrands-backend-eu-abfa65dd1df6.herokuapp.com'

    // Forward all query parameters to the backend (remove timestamp for caching)
    const backendUrlWithParams = `${backendUrl}/api/products?${searchParams.toString()}`

    const response = await fetch(backendUrlWithParams, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 15 }
    })

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`)
    }

    const data = await response.json()
    const result = NextResponse.json(data)
    
    // Add cache headers for client-side caching
    result.headers.set('Cache-Control', 'public, s-maxage=15, stale-while-revalidate=120')
    
    return result
  } catch (error) {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching products:', error)
    }
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
} 