/**
 * ZCORNER Auth Helper — Apps Script version
 * Menggunakan cookie session — return null on failure (tidak throw)
 */
import { cookies } from 'next/headers';
import { callGAS } from './appscript';

export type Session = {
  tenant: string;
  nama: string;
  role: 'admin_tenant' | 'super_admin';
};

const SESSION_COOKIE = 'zcorner_session';

/** Baca session dari cookie — return null jika tidak ada / invalid */
export async function session(): Promise<Session | null> {
  try {
    const jar = await cookies();
    const raw = jar.get(SESSION_COOKIE)?.value;
    if (!raw) return null;
    const decoded = Buffer.from(raw, 'base64').toString('utf-8');
    return JSON.parse(decoded) as Session;
  } catch {
    return null;
  }
}

/** Encode session ke base64 untuk disimpan di cookie */
export function encodeSession(s: Session): string {
  return Buffer.from(JSON.stringify(s)).toString('base64');
}

/**
 * Guard endpoint admin tenant.
 * Return: { session, tenant } jika valid
 * Return: null jika tidak ada session / role salah
 * (caller WAJIB return 401 jika null)
 */
export async function tenantGuard(): Promise<{ session: Session; tenant: string } | null> {
  const s = await session();
  if (!s) return null;
  if (s.role !== 'admin_tenant' && s.role !== 'super_admin') return null;
  return { session: s, tenant: s.tenant };
}

/**
 * Guard endpoint super admin.
 * Return: Session jika valid, null jika tidak
 */
export async function superGuard(): Promise<Session | null> {
  const s = await session();
  if (!s) return null;
  if (s.role !== 'super_admin') return null;
  return s;
}

/** Login via Apps Script checkLogin */
export async function loginViaGAS(username: string, password: string) {
  return callGAS('checkLogin', { username, password });
}
