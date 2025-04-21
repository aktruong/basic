import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/Header';
import { CartProvider } from '@/contexts/CartContext';
import { CartDrawerProvider } from '@/contexts/CartDrawerContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Cà Hồi Cô Ba Đà Lạt',
  description: 'Cà Hồi Cô Ba Đà Lạt - Hải sản tươi sống',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <CartProvider>
          <CartDrawerProvider>
            <Header />
            <main className="min-h-screen bg-gray-50">
              {children}
            </main>
          </CartDrawerProvider>
        </CartProvider>
      </body>
    </html>
  );
}
