import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

/**
 * POST /api/revalidate
 * Invalidates Next.js cache for products so primary picture and list updates show immediately.
 * Call this after admin updates a product (e.g. changes primary image).
 * Optional: set REVALIDATE_SECRET in env and send x-revalidate-secret header to protect the route.
 */
export async function POST(request: NextRequest) {
  try {
    const secret = process.env.REVALIDATE_SECRET
    if (secret && request.headers.get('x-revalidate-secret') !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const path = body.path === 'products' ? 'products' : null
    const slug = typeof body.slug === 'string' ? body.slug.trim() : null

    if (path === 'products') {
      revalidatePath('/api/products')
      if (slug) {
        revalidatePath(`/api/products/slug/${slug}`)
      }
    }

    return NextResponse.json({ revalidated: true, path: path ?? null, slug: slug ?? null })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Revalidate error:', error)
    }
    return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 })
  }
}
