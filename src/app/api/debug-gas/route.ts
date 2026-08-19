import { NextResponse } from 'next/server';

const GAS_URL = process.env.APPSCRIPT_URL || '';

/**
 * GET /api/debug-gas
 * Test koneksi langsung ke GAS dengan simulasi createWebOrder
 */
export async function GET() {
  if (!GAS_URL) {
    return NextResponse.json({ error: 'APPSCRIPT_URL tidak ada di .env', env: process.env.APPSCRIPT_URL }, { status: 500 });
  }

  const testPayload = {
    action: 'createWebOrder',
    tenant: 'teh pucuk',
    customer_name: 'TEST DEBUG',
    nomor_meja: 'DEBUG-99',
    items: [{ nama: 'Test Item', nama_menu: 'Test Item', qty: 1, harga: 1000, subtotal: 1000, total: 1000 }],
    total_harga: 1000,
    total: 1000,
    metode_bayar: 'COD',
    timestamp: new Date().toISOString(),
  };

  console.log('🧪 [debug-gas] Mengirim payload:', JSON.stringify(testPayload, null, 2));
  console.log('🧪 [debug-gas] URL:', GAS_URL);

  try {
    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload),
      signal: AbortSignal.timeout(30000),
    });

    const text = await res.text();
    console.log('🧪 [debug-gas] Raw response status:', res.status);
    console.log('🧪 [debug-gas] Raw response text:', text.slice(0, 500));

    let parsed = null;
    try { parsed = JSON.parse(text); } catch { /* raw text */ }

    return NextResponse.json({
      ok: true,
      gasUrl: GAS_URL.slice(0, 80) + '...',
      httpStatus: res.status,
      rawResponse: text.slice(0, 1000),
      parsedResponse: parsed,
      isHtml: text.trim().startsWith('<'),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('🧪 [debug-gas] Error:', msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
