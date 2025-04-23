import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/Header';
import { CartProvider } from '@/contexts/CartContext';
import { CartDrawerProvider } from '@/contexts/CartDrawerContext';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CÁ HỒI CÔ BA ĐÀ LẠT',
  description: 'CÁ HỒI CÔ BA ĐÀ LẠT - Hải sản tươi sống',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        <CartProvider>
          <CartDrawerProvider>
            <Header />
            <main className="min-h-screen bg-white pt-16">
              {children}
            </main>
            <Toaster />
          </CartDrawerProvider>
        </CartProvider>
      </body>
    </html>
  );
}
