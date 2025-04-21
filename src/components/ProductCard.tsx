import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/lib/vendure';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const lowestPrice = product.variants?.[0]?.price || 0;
  const currencyCode = product.variants?.[0]?.currencyCode || 'VND';

  return (
    <Link href={`/product/${product.slug}`}>
      <div className="group relative">
        <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-md bg-gray-200 lg:aspect-none group-hover:opacity-75 lg:h-80">
          {product.featuredAsset?.preview ? (
            <Image
              src={product.featuredAsset.preview}
              alt={product.name}
              width={500}
              height={500}
              className="h-full w-full object-cover object-center lg:h-full lg:w-full"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100">
              <span className="text-gray-400">Không có ảnh</span>
            </div>
          )}
        </div>
        <div className="mt-4 flex justify-between">
          <div>
            <h3 className="text-sm text-gray-700">
              <span aria-hidden="true" className="absolute inset-0" />
              {product.name}
            </h3>
          </div>
          <p className="text-sm font-medium text-gray-900">
            {new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: currencyCode
            }).format(lowestPrice / 100)}
          </p>
        </div>
      </div>
    </Link>
  );
} 