import { NextResponse } from 'next/server';
import { loginViaGAS, encodeSession } from '@/lib/auth';

export async function POST(req: Request) {
  const { username, password, email } = await req.json();
  // Dukung login dengan email ATAU username
  const user = username || email?.split('@')[0] || email;

  if (!user || !password) {
    return new NextResponse('Username dan password wajib diisi', { status: 400 });
  }

  const result = await loginViaGAS(user, password);

  if (!result.success) {
    return new NextResponse(result.error || 'Username atau password salah', { status: 401 });
  }

  const sessionData = {
    tenant: result.tenant || user,
    nama: result.nama || user,
    role: (result.role === 'super_admin' ? 'super_admin' : 'admin_tenant') as 'admin_tenant' | 'super_admin',
  };

  const res = NextResponse.json({ role: sessionData.role, nama: sessionData.nama, tenant: sessionData.tenant });
  res.cookies.set('zcorner_session', encodeSession(sessionData), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 hari
  });
  return res;
}
