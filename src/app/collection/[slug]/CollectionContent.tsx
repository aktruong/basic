'use client';

import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';
import { CollectionProductsResponse } from '@/lib/vendure';

interface CollectionContentProps {
  collection: CollectionProductsResponse['data']['collection'];
}

export function CollectionContent({ collection }: CollectionContentProps) {
  const { addToCart } = useCart();
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  const handleAddToCart = async (variantId: string) => {
    await addToCart(variantId, 1);
  };

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">{collection.name}</h2>

        <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
          {collection.products.items.map((product) => (
            <div key={product.id} className="group relative">
              <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-md bg-gray-200 lg:aspect-none group-hover:opacity-75 lg:h-80">
                <Image
                  src={product.featuredAsset?.preview || '/placeholder.png'}
                  alt={product.name}
                  width={500}
                  height={500}
                  className="h-full w-full object-cover object-center lg:h-full lg:w-full"
                />
              </div>
              <div className="mt-4 flex justify-between">
                <div>
                  <h3 className="text-sm text-gray-700">
                    <a href={`/product/${product.slug}`}>
                      <span aria-hidden="true" className="absolute inset-0" />
                      {product.name}
                    </a>
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {product.variants[0]?.priceWithTax} {product.variants[0]?.currencyCode}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleAddToCart(product.variants[0].id)}
                className="mt-2 w-full rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Thêm vào giỏ hàng
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 