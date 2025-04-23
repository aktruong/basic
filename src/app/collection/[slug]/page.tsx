'use client';

import React from 'react';
import { Collection } from '@/components/Collection';
import { GET_COLLECTION_PRODUCTS, vendureFetch, CollectionProductsResponse } from '@/lib/vendure';

export default async function Page({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: Record<string, string | string[]>;
}) {
  try {
    const data = await vendureFetch<CollectionProductsResponse>(GET_COLLECTION_PRODUCTS, { slug: params.slug });
    console.log('API response:', JSON.stringify(data, null, 2));

    if (!data?.collection) {
      return <div>Không tìm thấy danh mục</div>;
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <Collection collection={data.collection} />
      </div>
    );
  } catch (error) {
    console.error('Lỗi khi tải danh mục:', error);
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">
                {error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải danh mục'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 text-sm text-red-600 hover:text-red-800"
              >
                Thử lại
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
} 