import { NextResponse } from 'next/server';
import { callGAS } from '@/lib/appscript';

export async function GET() {
  // Test ping ke Apps Script
  const gasUrl = process.env.APPSCRIPT_URL;
  if (!gasUrl) {
    return NextResponse.json({ success: false, error: 'APPSCRIPT_URL belum diset di .env' });
  }

  // Coba panggil action 'ping' via GET dulu
  try {
    const pingUrl = `${gasUrl}?action=ping`;
    const r = await fetch(pingUrl, { signal: AbortSignal.timeout(10000) });
    if (r.ok) {
      const text = await r.text();
      try {
        const json = JSON.parse(text);
        if (json.success || json.message) {
          return NextResponse.json({
            success: true,
            message: json.message || 'Apps Script merespons!',
            method: 'GET ping',
          });
        }
      } catch {
        // HTML response = belum ada doPost, tapi URL valid
        if (text.includes('Z-CORNER') || text.includes('html')) {
          return NextResponse.json({
            success: false,
            error: 'URL Apps Script valid, tapi doPost belum ditambahkan. Ikuti langkah setup.',
            hint: 'Tambahkan file zcorner_api.gs ke Apps Script Anda',
          });
        }
      }
    }
  } catch {
    // ignore
  }

  // Coba POST dengan action ping
  const result = await callGAS('ping', {});
  if (result.success) {
    return NextResponse.json({ success: true, message: 'Koneksi Apps Script berhasil via POST!' });
  }

  return NextResponse.json({
    success: false,
    error: result.error || 'Tidak dapat terhubung ke Apps Script',
    gasUrl: gasUrl.substring(0, 80) + '...',
  });
}
