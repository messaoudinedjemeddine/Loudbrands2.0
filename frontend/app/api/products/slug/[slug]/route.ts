import { NextRequest, NextResponse } from 'next/server'

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
      cache: 'no-store'
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}
