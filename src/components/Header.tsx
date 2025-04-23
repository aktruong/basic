import Link from 'next/link';
import { CartButton } from './CartButton';

export function Header() {
  return (
    <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <img 
                src="/logo.webp" 
                alt="Cá hồi cô ba Đà Lạt" 
                className="h-12 w-auto"
              />
              <span className="text-2xl font-normal text-blue-600">
                CÁ HỒI CÔ BA ĐÀ LẠT
              </span>
            </Link>
          </div>
          <div className="flex-shrink-0">
            <CartButton />
          </div>
        </div>
      </div>
    </header>
  );
} 