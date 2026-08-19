import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ZCORNER — Food Court Digital',
  description: 'Pesan makanan dari berbagai tenant, bayar di tempat. Food court digital multi-tenant.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#00aa5b" />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
