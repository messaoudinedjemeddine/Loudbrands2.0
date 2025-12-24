import { NextResponse } from 'next/server';

export async function GET() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://loudbrands-backend-eu-abfa65dd1df6.herokuapp.com/api';
  
  try {
    const response = await fetch(`${apiUrl.replace('/api', '')}/health`);
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      apiUrl,
      backendResponse: data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      apiUrl,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
