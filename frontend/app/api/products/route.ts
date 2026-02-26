import { NextRequest, NextResponse } from 'next/server'

// Cache products for 15 seconds so primary picture updates show quickly (ISR)
export const revalidate = 15

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const brand = searchParams.get('brand')
    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://loudbrands-backend-eu-abfa65dd1df6.herokuapp.com'

    // Forward all query parameters to the backend
    const backendUrlWithParams = `${backendUrl}/api/products?${searchParams.toString()}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 25000) // 25s timeout

    try {
      const response = await fetch(backendUrlWithParams, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        next: { revalidate: 15 }
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        return NextResponse.json(
          { error: `Backend error: ${response.status} ${errorText || response.statusText}` },
          { status: response.status }
        )
      }

      const data = await response.json()
      const result = NextResponse.json(data)
      
      // Prevent browser from caching so first load always gets full product list (avoids "stuck at 7" from stale cache)
      result.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
      
      return result
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timeout - backend took too long to respond' },
          { status: 504 }
        )
      }
      throw fetchError
    }
  } catch (error: any) {
    console.error('Error fetching products:', error)
    const errorMessage = error?.message || 'Failed to fetch products from backend'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
} 