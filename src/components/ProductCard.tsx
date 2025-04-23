'use client';

import { ProductVariant } from '@/types';
import { formatPrice } from '@/lib/utils';
import { ShoppingCart } from 'lucide-react';
import { useCartContext } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface ProductCardProps {
  product: ProductVariant;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCartContext();
  const router = useRouter();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product.id, 1);
  };

  const handleCardClick = () => {
    router.push(`/product/${product.id}`);
  };

  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      <div 
        onClick={handleCardClick}
        className="cursor-pointer"
      >
        <div className="aspect-square relative">
          {product.featuredAsset ? (
            <img
              src={product.featuredAsset.preview}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <span className="text-gray-400">Không có ảnh</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-medium text-gray-900 mb-1">{product.name}</h3>
          <p className="text-sm font-medium text-blue-600">
            {formatPrice(product.priceWithTax, product.currencyCode)}
          </p>
        </div>
      </div>
      <button
        onClick={handleAddToCart}
        className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-50"
      >
        <ShoppingCart className="w-5 h-5 text-blue-600" />
      </button>
    </motion.div>
  );
} 