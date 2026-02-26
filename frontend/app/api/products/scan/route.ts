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

export async function POST(request: NextRequest) {
  try {
    const backendBase = getBackendBase(request.nextUrl.origin);
    const url = `${backendBase}/api/products/scan`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(request.headers.get('Authorization') && { Authorization: request.headers.get('Authorization')! }),
    };

    const body = await request.text();
    const res = await fetch(url, { method: 'POST', headers, body });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Products scan proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to reach products API. Ensure BACKEND_URL or NEXT_PUBLIC_API_URL points to your backend.' },
      { status: 502 }
    );
  }
}
