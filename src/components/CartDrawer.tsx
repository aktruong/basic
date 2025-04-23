'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useCartContext } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/utils';
import { CartLine } from '@/types';
import { X, Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { useEffect, useState, useCallback, memo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { VendureAsset } from './VendureAsset';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartItem = memo(({ line }: { line: CartLine }) => {
  const { removeFromCart, updateQuantity } = useCartContext();
  const [localQuantity, setLocalQuantity] = useState(line.quantity);
  const [isUpdating, setIsUpdating] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalQuantity(line.quantity);
  }, [line.quantity]);

  const handleQuantityChange = useCallback(
    async (newQuantity: number) => {
      if (newQuantity < 1 || isUpdating) return;
      
      setLocalQuantity(newQuantity);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(async () => {
        try {
          setIsUpdating(true);
          await updateQuantity(line.id, newQuantity);
        } finally {
          setIsUpdating(false);
        }
      }, 300);
    },
    [line.id, updateQuantity, isUpdating]
  );

  const handleRemove = useCallback(() => {
    removeFromCart(line.id);
  }, [line.id, removeFromCart]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex items-start gap-4 py-3">
      <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
        {line.productVariant.featuredAsset?.preview ? (
          <VendureAsset
            preview={line.productVariant.featuredAsset.preview}
            preset="thumb"
            alt={line.productVariant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            Không có ảnh
          </div>
        )}
      </div>
      <div className="flex-1">
        <h3 className="font-medium text-gray-900">{line.productVariant.name}</h3>
        <p className="text-sm font-medium text-blue-600">
          {formatPrice(line.productVariant.priceWithTax, line.productVariant.currencyCode)}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => handleQuantityChange(localQuantity - 1)}
            disabled={isUpdating}
            className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-8 text-center">{localQuantity}</span>
          <button
            onClick={() => handleQuantityChange(localQuantity + 1)}
            disabled={isUpdating}
            className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
      <button
        onClick={handleRemove}
        disabled={isUpdating}
        className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );
});

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, total, activeOrder } = useCartContext();
  const drawerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleCheckout = () => {
    onClose();
    router.push('/checkout');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={drawerRef}
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
          className="fixed top-0 right-0 w-full max-w-md h-screen bg-white shadow-xl z-50 flex flex-col"
        >
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Giỏ hàng</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            {items && items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <ShoppingCart className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-gray-500">Giỏ hàng trống</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {items?.map((line: CartLine) => (
                    <CartItem key={line.id} line={line} />
                  ))}
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-base font-medium text-gray-900">
                    <p>Tạm tính</p>
                    <p>{formatPrice(total || 0, 'VND')}</p>
                  </div>
                  <p className="mt-0.5 text-sm text-gray-500">Phí vận chuyển sẽ được tính khi thanh toán</p>
                </div>
              </>
            )}
          </div>
          {items && items.length > 0 && (
            <div className="sticky bottom-0 p-6 bg-white">
              <button
                onClick={handleCheckout}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Đặt hàng
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
} 