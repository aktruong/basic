'use client';

import { useCartContext } from '@/contexts/CartContext';
import { useState } from 'react';
import { formatPrice } from '@/lib/utils';
import { SimpleQuantityAdjuster } from '@/components/SimpleQuantityAdjuster';
import { useRouter } from 'next/navigation';

interface ProductContentProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    featuredAsset?: {
      id: string;
      name: string;
      source: string;
      preview: string;
      width: number;
      height: number;
    };
    variants: Array<{
      id: string;
      name: string;
      priceWithTax: number;
      currencyCode: string;
      featuredAsset?: {
        id: string;
        name: string;
        source: string;
        preview: string;
        width: number;
        height: number;
      };
    }>;
  };
}

export function ProductContent({ product }: ProductContentProps) {
  const router = useRouter();
  const { addToCart } = useCartContext();
  const [quantity, setQuantity] = useState(1);

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity);
  };

  const handleAddToCart = async (variantId: string) => {
    const variant = product.variants.find(v => v.id === variantId);
    if (!variant) {
      console.error('Không tìm thấy biến thể sản phẩm');
      return;
    }

    const selectedAsset = variant.featuredAsset || product.featuredAsset;
    if (!selectedAsset) {
      console.error('Không tìm thấy hình ảnh sản phẩm');
      return;
    }

    const cartItem = {
      id: variantId,
      quantity: quantity,
      productVariant: {
        id: variantId,
        name: variant.name,
        priceWithTax: variant.priceWithTax,
        currencyCode: variant.currencyCode,
        featuredAsset: selectedAsset
      }
    };

    console.log('Adding to cart:', cartItem);
    await addToCart(variantId, quantity);
    router.push('/');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <img
            src={product.featuredAsset?.preview || '/placeholder.png'}
            alt={product.name}
            className="w-full h-auto rounded-lg"
          />
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          <div className="mt-4">
            <h2 className="text-lg font-semibold">Mô tả sản phẩm</h2>
            <div 
              className="mt-2 text-gray-600"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Variants</h2>
            <div className="space-y-2">
              {product.variants.map((variant) => (
                <div key={variant.id} className="flex items-center justify-between p-4 border rounded">
                  <div>
                    <p className="font-medium">{variant.name}</p>
                    <p className="text-gray-600">
                      {formatPrice(variant.priceWithTax, variant.currencyCode)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <SimpleQuantityAdjuster
                      quantity={quantity}
                      onQuantityChange={handleQuantityChange}
                    />
                    <button
                      onClick={() => handleAddToCart(variant.id)}
                      className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                    >
                      Thêm vào giỏ hàng
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 