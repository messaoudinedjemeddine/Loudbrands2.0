import { notFound, redirect } from 'next/navigation'
import ProductDetailClient from './luxury-product-detail'

interface Product {
  id: string;
  slug: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  price: number;
  oldPrice?: number;
  brand?: {
    id: string;
    name: string;
    slug: string;
  };
  category: {
    id: string;
    name: string;
    nameAr?: string;
    slug: string;
  } | string;
  categoryAr?: string;
  rating?: number;
  reviewCount?: number;
  isOnSale?: boolean;
  isLaunch?: boolean;
  isLaunchActive?: boolean;
  isOrderable?: boolean;
  launchAt?: string;
  stock: number;
  reference?: string;
  images: string[];
  sizes: Array<{ id: string; size: string; stock: number }>;
  features?: string[];
  specifications?: Record<string, string>;
}

interface ProductPageProps {
  params: Promise<{
    slug: string
  }>
}

// Required for static export
export async function generateStaticParams() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://loudbrands-backend-eu-abfa65dd1df6.herokuapp.com'}/api/products`, {
      next: { revalidate: 15 }
    })

    if (!res.ok) {
      return []
    }

    const data = await res.json()
    const products = Array.isArray(data) ? data : (data.products || [])

    return products.map((product: Product) => ({
      slug: product.slug,
    }))
  } catch (error) {
    console.error('Failed to generate static params:', error)
    return []
  }
}

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://loudbrands-backend-eu-abfa65dd1df6.herokuapp.com'}/api/products/slug/${slug}`, {
      next: { revalidate: 15 }
    })

    if (!res.ok) {
      return null
    }

    const data = await res.json()
    return data.product
  } catch (error) {
    console.error('Failed to fetch product:', error)
    return null
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = await params
  const product = await getProduct(resolvedParams.slug)

  if (!product) {
    notFound()
  }

  // Redirect to brand-specific product page
  if (product.brand?.slug) {
    redirect(`/${product.brand.slug}/products/${product.slug}?brand=${product.brand.slug}`)
  }

  // Fallback to generic product page if no brand is found
  return <ProductDetailClient product={product} />
}