import { NextResponse } from 'next/server';
import { loginViaGAS } from '@/lib/auth';

export async function POST(req: Request) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return new NextResponse('Username dan password wajib diisi', { status: 400 });
  }

  const result = await loginViaGAS(username, password);

  if (!result.success) {
    return new NextResponse(result.error || 'Username atau password salah', { status: 401 });
  }

  return NextResponse.json({ success: true, redirectUrl: '/admin' });
}
