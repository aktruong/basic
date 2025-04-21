'use client';

import { useCart } from '@/contexts/CartContext';
import { useEffect, useState, use } from 'react';
import { GET_PRODUCT, ProductResponse, vendureFetch } from '@/lib/vendure';
import { formatPrice } from '@/lib/utils';

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const { addToCart } = useCart();
  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await vendureFetch<ProductResponse>(GET_PRODUCT, { slug: resolvedParams.slug });
        console.log('Product response:', response);
        setProduct(response);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [resolvedParams.slug]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!product?.data?.product) return <div>Product not found</div>;

  const currentProduct = product.data.product;

  const handleAddToCart = async (variantId: string) => {
    const variant = currentProduct.variants.find(v => v.id === variantId);
    if (!variant) {
      console.error('Không tìm thấy biến thể sản phẩm');
      return;
    }

    const selectedAsset = variant.featuredAsset || currentProduct.featuredAsset;
    if (!selectedAsset) {
      console.error('Không tìm thấy hình ảnh sản phẩm');
      return;
    }

    const cartItem = {
      id: `line-${variantId}-${Date.now()}`,
      quantity: 1,
      productVariant: {
        id: variantId,
        name: variant.name,
        priceWithTax: variant.priceWithTax,
        currencyCode: variant.currencyCode,
        featuredAsset: {
          id: selectedAsset.id,
          name: selectedAsset.name,
          source: selectedAsset.source,
          preview: selectedAsset.preview,
          width: selectedAsset.width,
          height: selectedAsset.height
        }
      }
    };

    console.log('Adding to cart:', cartItem);
    addToCart(cartItem);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <img
            src={currentProduct.featuredAsset?.preview || '/placeholder.png'}
            alt={currentProduct.name}
            className="w-full h-auto rounded-lg"
          />
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-4">{currentProduct.name}</h1>
          <div className="mt-4">
            <h2 className="text-lg font-semibold">Mô tả sản phẩm</h2>
            <div 
              className="mt-2 text-gray-600"
              dangerouslySetInnerHTML={{ __html: currentProduct.description }}
            />
          </div>
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Variants</h2>
            <div className="space-y-2">
              {currentProduct.variants.map((variant) => (
                <div key={variant.id} className="flex items-center justify-between p-4 border rounded">
                  <div>
                    <p className="font-medium">{variant.name}</p>
                    <p className="text-gray-600">
                      {formatPrice(variant.priceWithTax, variant.currencyCode)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAddToCart(variant.id)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                  >
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 