import { formatPrice } from '@/lib/utils';

interface CartItem {
  id: string;
  quantity: number;
  productVariant: {
    id: string;
    name: string;
    priceWithTax: number;
    featuredAsset?: {
      preview: string;
    };
  };
}

interface CartProps {
  items: CartItem[];
  total: number;
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
}

export const Cart: React.FC<CartProps> = ({ items, total, onRemove, onUpdateQuantity }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Giỏ hàng</h2>
      {items.length === 0 ? (
        <p className="text-gray-500">Giỏ hàng trống</p>
      ) : (
        <>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <img
                    src={item.productVariant.featuredAsset?.preview}
                    alt={item.productVariant.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div>
                    <p className="font-medium">{item.productVariant.name}</p>
                    <p className="text-gray-500">
                      {formatPrice(item.productVariant.priceWithTax, 'VND')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center border rounded">
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span className="px-2 py-1">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => onRemove(item.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t pt-4">
            <div className="flex justify-between font-semibold">
              <span>Tổng cộng:</span>
              <span>{formatPrice(total || 0, 'VND')}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}; 