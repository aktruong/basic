'use client';

import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useCartDrawer } from '@/contexts/CartDrawerContext';
import CartDrawer from './CartDrawer';

export function CartButton() {
  const { totalQuantity } = useCart();
  const { onOpen } = useCartDrawer();

  return (
    <>
      <button
        onClick={onOpen}
        className="relative p-2 text-gray-700 hover:text-gray-900"
      >
        <ShoppingCart className="h-6 w-6" />
        {totalQuantity > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-xs text-white">
            {totalQuantity}
          </span>
        )}
      </button>
      <CartDrawer />
    </>
  );
} 