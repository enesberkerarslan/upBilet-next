import { NextRequest, NextResponse } from "next/server";
import { getUserApiBaseServer } from "@/lib/env";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const code = body?.code as string | undefined;
    if (!code) {
      return NextResponse.json({ success: false, error: "Code gerekli" }, { status: 400 });
    }

    const base = getUserApiBaseServer().replace(/\/$/, "");
    const url = `${base}/social/google/callback?code=${encodeURIComponent(code)}`;
    const res = await fetch(url, { method: "GET", cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch (e) {
    console.error("google-callback", e);
    return NextResponse.json({ success: false, error: "Sunucu hatası" }, { status: 500 });
  }
}
