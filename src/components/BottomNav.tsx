'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getCart } from '@/lib/cart';

const NAV = [
  { href: '/',          icon: '🏠', label: 'Home' },
  { href: '/cart',      icon: '🛒', label: 'Keranjang' },
  { href: '/orders/latest', icon: '📋', label: 'Pesanan' },
  { href: '/admin/login', icon: '🏪', label: 'Tenant' },
];

export function BottomNav() {
  const path = usePathname();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const update = () => {
      const c = getCart();
      setCartCount(c?.items.reduce((s, i) => s + i.qty, 0) ?? 0);
    };
    update();
    window.addEventListener('cart', update);
    return () => window.removeEventListener('cart', update);
  }, []);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-around border-t border-slate-100 bg-white/95 backdrop-blur-lg py-2 shadow-[0_-4px_20px_rgba(0,0,0,.06)]">
      {NAV.map((n) => {
        const isExternal = n.href.startsWith('http');
        const active = !isExternal && (path === n.href || (n.href !== '/' && path.startsWith(n.href)));
        
        const className = `relative flex flex-col items-center gap-0.5 px-6 py-1 rounded-2xl transition-all duration-200 ${
          active ? 'text-go-600' : 'text-slate-400 hover:text-slate-600'
        }`;

        const content = (
          <>
            <span className={`text-2xl transition-transform duration-200 ${active ? 'scale-110' : ''}`}>
              {n.icon}
            </span>
            <span className={`text-[10px] font-semibold ${active ? 'text-go-600' : ''}`}>{n.label}</span>
            {n.href === '/cart' && cartCount > 0 && (
              <span className="absolute -top-0.5 right-4 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
            {active && (
              <span className="absolute -bottom-2 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-go-500" />
            )}
          </>
        );

        if (isExternal) {
          return (
            <a key={n.href} href={n.href} className={className}>
              {content}
            </a>
          );
        }

        return (
          <Link key={n.href} href={n.href} className={className}>
            {content}
          </Link>
        );
      })}
    </nav>
  );
}
