import { NextRequest, NextResponse } from 'next/server'

// Cache product details for 15s so primary picture and details update quickly
export const revalidate = 15

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
      next: { revalidate: 15 }
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const data = await response.json()
    const result = NextResponse.json(data)
    
    // No-store so product images load on first visit (avoids grey images from stale cache)
    result.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    
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
