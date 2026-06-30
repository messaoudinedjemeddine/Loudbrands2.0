import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_BACKEND = 'https://loudbrands-backend-eu-abfa65dd1df6.herokuapp.com';

const getBackendBase = (requestOrigin: string) => {
  const env = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';
  const envHost = env.replace(/\/api\/?$/, '').replace(/^https?:\/\//, '').split('/')[0] || '';
  const originHost = requestOrigin.replace(/^https?:\/\//, '').split('/')[0] || '';
  const useDefault = !env || envHost === originHost;
  const base = useDefault ? DEFAULT_BACKEND : (env.replace(/\/api\/?$/, '') || DEFAULT_BACKEND);
  return base.replace(/\/api\/?$/, '');
};

export async function GET(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const params = await context.params;
  return proxyRequest(request, 'GET', params);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const params = await context.params;
  return proxyRequest(request, 'POST', params);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const params = await context.params;
  return proxyRequest(request, 'PATCH', params);
}

async function proxyRequest(
  request: NextRequest,
  method: string,
  { path }: { path?: string[] }
) {
  try {
    const backendBase = getBackendBase(request.nextUrl.origin);
    const pathSegments = path && path.length > 0 ? path.join('/') : '';
    const pathWithLeading = pathSegments ? `/${pathSegments}` : '';
    const url = `${backendBase}/api/inventory${pathWithLeading}${request.nextUrl.search}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(request.headers.get('Authorization') && { Authorization: request.headers.get('Authorization')! }),
    };

    const options: RequestInit = { method, headers };
    if (method !== 'GET' && request.body) {
      options.body = await request.text();
    }

    const res = await fetch(url, options);
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Inventory proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to reach inventory API. Ensure BACKEND_URL or NEXT_PUBLIC_API_URL points to your backend.' },
      { status: 502 }
    );
  }
}
