import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const token = req.cookies.get('admin_token')?.value;
  const url = `${API_URL}/${path.join('/')}${req.nextUrl.search}`;

  const incomingContentType = req.headers.get('content-type');

  const headers: HeadersInit = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let body: BodyInit | undefined;
  if (!['GET', 'HEAD'].includes(req.method)) {
    // Multipart / ham dosya: boundary ile birlikte Content-Type korunmalı; gövde binary.
    if (incomingContentType?.includes('multipart/form-data')) {
      if (incomingContentType) {
        headers['Content-Type'] = incomingContentType;
      }
      body = await req.arrayBuffer();
    } else {
      if (incomingContentType) {
        headers['Content-Type'] = incomingContentType;
      } else {
        headers['Content-Type'] = 'application/json';
      }
      body = await req.text();
    }
  }

  const res = await fetch(url, {
    method: req.method,
    headers,
    body,
  });

  const text = await res.text();

  // 204/205 gövdesiz olmalı — NextResponse.json(..., { status: 204 }) geçersiz, 500 atar
  if (res.status === 204 || res.status === 205) {
    return new NextResponse(null, { status: res.status });
  }

  let data: unknown = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  return NextResponse.json(data, { status: res.status });
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
