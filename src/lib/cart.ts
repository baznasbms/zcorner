'use client';
export type CartItem = { menu_item_id: number; nama_menu: string; harga: number; qty: number; foto_menu?: string };
export type Cart = { tenant_id: number; tenant_name: string; items: CartItem[] };
const KEY = 'zcorner_cart';
export function getCart(): Cart | null {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
}
export function setCart(c: Cart | null) {
  if (!c) localStorage.removeItem(KEY);
  else localStorage.setItem(KEY, JSON.stringify(c));
  window.dispatchEvent(new Event('cart'));
}
export function addItem(tenant_id: number, tenant_name: string, item: Omit<CartItem, 'qty'>, qty = 1) {
  const c = getCart();
  if (c && c.tenant_id !== tenant_id) {
    if (!confirm('Keranjang dari tenant lain akan diganti. Lanjut?')) return;
  }
  const base: Cart = c && c.tenant_id === tenant_id ? c : { tenant_id, tenant_name, items: [] };
  const i = base.items.find((x) => x.menu_item_id === item.menu_item_id);
  if (i) i.qty += qty; else base.items.push({ ...item, qty });
  setCart(base);
}
export function cartTotal(c: Cart | null) {
  return c?.items.reduce((s, i) => s + i.harga * i.qty, 0) || 0;
}
