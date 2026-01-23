import { NextRequest, NextResponse } from 'next/server'

// Cache product details for 5 minutes (products change less frequently)
export const revalidate = 300

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const brand = searchParams.get('brand')
    const resolvedParams = await params
    const slug = resolvedParams.slug

    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://loudbrands-backend-eu-abfa65dd1df6.herokuapp.com'
    const url = brand 
      ? `${backendUrl}/api/products/slug/${slug}?brand=${brand}`
      : `${backendUrl}/api/products/slug/${slug}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Use cache with revalidation instead of no-store
      next: { revalidate: 300 }
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const data = await response.json()
    const result = NextResponse.json(data)
    
    // Add cache headers
    result.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    
    return result
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching product:', error)
    }
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}
