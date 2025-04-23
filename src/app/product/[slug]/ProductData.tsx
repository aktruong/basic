import { GET_PRODUCT, ProductResponse, vendureFetch } from '@/lib/vendure';
import { ProductContent } from './ProductContent';

interface ProductDataProps {
  slug: string;
}

export async function ProductData({ slug }: ProductDataProps) {
  try {
    const response = await vendureFetch<ProductResponse>(GET_PRODUCT, { slug });
    return <ProductContent product={response.data.product} />;
  } catch (error) {
    console.error('Error fetching product:', error);
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">
                {error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải sản phẩm'}
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