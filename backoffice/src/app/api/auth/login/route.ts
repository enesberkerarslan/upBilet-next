import { NextRequest, NextResponse } from 'next/server';
import { getBackendApiBase } from '@/lib/backend-api-base';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const res = await fetch(`${getBackendApiBase()}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const json = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { message: json.message || 'Giriş başarısız.' },
      { status: res.status }
    );
  }

  const response = NextResponse.json({ success: true, user: json.data.user });

  response.cookies.set('admin_token', json.data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 yıl
  });

  return response;
}
