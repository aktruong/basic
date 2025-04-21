import Link from 'next/link';
import { CartButton } from './CartButton';

export function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-indigo-600">
            Cà Hồi Cô Ba Đà Lạt
          </Link>
          <CartButton />
        </div>
      </div>
    </header>
  );
} 