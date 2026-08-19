/**
 * ZCORNER — Google Apps Script API Helper
 * Semua komunikasi ke Apps Script melalui file ini
 */

const GAS_URL = process.env.APPSCRIPT_URL || '';

export type GasResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  tenant?: string;
  nama?: string;
  role?: string;
  orderId?: string; // New for createOrder
  status?: string;  // New for createOrder
};

/**
 * Panggil function di Google Apps Script via HTTP POST
 */
export async function callGAS<T = unknown>(
  action: string,
  params: Record<string, unknown> = {}
): Promise<GasResponse<T>> {
  if (!GAS_URL) {
    console.error('APPSCRIPT_URL belum dikonfigurasi di .env');
    return { success: false, error: 'Apps Script URL belum dikonfigurasi' };
  }

  try {
    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...params }),
      signal: AbortSignal.timeout(30000),
    });

    // Baca sebagai text dulu untuk deteksi HTML
    const text = await res.text();

    // Deteksi jika response adalah HTML (error/redirect dari Google)
    if (text.trim().startsWith('<') || text.includes('<!DOCTYPE') || text.includes('<html')) {
      console.error(`GAS [${action}]: respons HTML bukan JSON — kemungkinan error di Apps Script atau redirect login`);
      return {
        success: false,
        error: `Apps Script mengembalikan HTML untuk action "${action}". Cek fungsi ${action} di script.`,
      };
    }

    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}: ${text.slice(0, 200)}` };
    }

    const data = JSON.parse(text);
    return data as GasResponse<T>;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`GAS call failed [${action}]:`, message);
    return { success: false, error: message };
  }
}

// ─── Typed helpers ───────────────────────────────────────────────

export type GasTenant = {
  id: number;
  nama_tenant: string;
  deskripsi: string;
  foto_banner: string;
  jam_buka: string;
  status: string;
  rating: number;
  kategori: string;
};

export type GasMenuItem = {
  id: string | number;
  nama_menu: string;    // dari Apps Script: "nama" atau "prodNama"
  nama?: string;
  kategori: string;
  harga: number;
  foto_menu?: string;
  stok?: number;
  status_aktif?: boolean;
};

export type GasOrder = {
  id?: string | number;
  orderId?: string;
  tenant: string;
  nomor_meja: string;
  status: string;
  total_harga: number;
  metode_bayar?: string;
  created_at: string;
  items: GasOrderItem[];
};

export type GasOrderItem = {
  qty: number;
  nama_menu: string;
  harga: number;
  subtotal: number;
};

export type GasRekapHarian = {
  tenant: string;
  tanggal: string;
  modal: number;
  infak: number;
  zakat: number;
};

export type GasSetoran = {
  tanggal: string;
  tenant: string;
  omset_harian: number;
  modal_harian: number;
  infak_harian: number;
  setoran_bersih: number;
  bulan: string;
  kode_bulan: string;
};

export type GasRekapBulanan = {
  no: number;
  bulan: string;
  omset: number;
  modal: number;
  infak: number;
  perolehan: number;
};

export type GasWebOrder = {
  rowIdx: number; // For update purposes in GAS
  orderId: string;
  created_at: string;
  customer_name: string;
  tenant: string;
  nomor_meja: string;
  items: { nama: string; qty: number; total: number }[];
  total: number;
  status: string;
};

/**
 * Normalize menu item dari format Apps Script ke format ZCORNER
 */
export function normalizeMenuItem(raw: Record<string, unknown>, index: number): GasMenuItem {
  return {
    id: (raw.id as string | number) ?? (raw.rowIndex as number) ?? index + 1,
    nama_menu: (raw.nama_menu as string) || (raw.nama as string) || (raw.prodNama as string) || 'Menu',
    kategori: (raw.kategori as string) || 'Umum',
    harga: Number(raw.harga || raw.prodHarga || 0),
    foto_menu: (raw.foto_menu as string) || (raw.foto as string) || '',
    stok: Number(raw.stok ?? 99),
    status_aktif: raw.status_aktif !== false && raw.aktif !== false,
  };
}

/**
 * Normalize order dari format Apps Script ke format ZCORNER
 */
export function normalizeOrder(raw: Record<string, unknown>): GasOrder {
  const items = Array.isArray(raw.items)
    ? (raw.items as Record<string, unknown>[]).map((it) => ({
        qty: Number(it.qty ?? 1),
        nama_menu: (it.nama_menu as string) || (it.nama as string) || '',
        harga: Number(it.harga ?? 0),
        subtotal: Number(it.subtotal ?? it.total ?? 0),
      }))
    : [];

  return {
    id: (raw.id as string | number) || (raw.orderId as string) || String(Date.now()),
    orderId: String(raw.orderId || raw.id || ''),
    tenant: (raw.tenant as string) || '',
    nomor_meja: (raw.nomor_meja as string) || (raw.meja as string) || '',
    status: 'diterima',  // selalu "diterima" sesuai permintaan
    total_harga: Number(raw.total_harga || raw.total || 0),
    metode_bayar: 'COD',
    created_at: (raw.created_at as string) || (raw.tanggal as string) || new Date().toISOString(),
    items,
  };
}
