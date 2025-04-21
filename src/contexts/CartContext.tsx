'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { CartItem } from '@/lib/vendure';
import { getActiveOrder } from '@/lib/vendure';

interface CartContextType {
  cart: CartItem[];
  total: number;
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  totalQuantity: number;
  updateQuantity: (itemId: string, newQuantity: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    // Khôi phục giỏ hàng từ localStorage khi component mount
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      setCart(parsedCart.items || []);
      setTotal(parsedCart.total || 0);
    } else {
      // Nếu không có dữ liệu trong localStorage, lấy từ API
      fetchActiveOrder();
    }
  }, []);

  const fetchActiveOrder = async () => {
    try {
      const response = await getActiveOrder();
      if (response?.data?.activeOrder) {
        const order = response.data.activeOrder;
        const validLines = (order.lines || []).filter(line => 
          line?.productVariant?.priceWithTax !== undefined
        );
        setCart(validLines);
        setTotal(order.totalWithTax || 0);
        // Lưu vào localStorage
        localStorage.setItem('cart', JSON.stringify({
          items: validLines,
          total: order.totalWithTax || 0
        }));
      }
    } catch (error) {
      console.error('Lỗi khi lấy giỏ hàng:', error);
    }
  };

  const addToCart = (item: CartItem) => {
    console.log('Thêm sản phẩm vào giỏ hàng:', JSON.stringify(item, null, 2));
    
    // Kiểm tra kiểu dữ liệu đầu vào
    if (typeof item === 'string' || typeof item === 'number') {
      console.error('Dữ liệu sản phẩm không hợp lệ: phải là một đối tượng CartItem');
      console.error('Dữ liệu nhận được:', item);
      return;
    }

    // Kiểm tra dữ liệu sản phẩm
    if (!item || typeof item !== 'object') {
      console.error('Dữ liệu sản phẩm không hợp lệ');
      console.error('Dữ liệu nhận được:', item);
      return;
    }

    // Kiểm tra và tạo thông tin biến thể sản phẩm nếu thiếu
    if (!item.productVariant) {
      console.error('Thiếu thông tin biến thể sản phẩm');
      console.error('Dữ liệu sản phẩm hiện tại:', item);
      return;
    }

    // Kiểm tra ID biến thể sản phẩm
    if (!item.productVariant.id) {
      console.error('Thiếu ID biến thể sản phẩm');
      console.error('Thông tin biến thể sản phẩm:', item.productVariant);
      return;
    }

    // Tạo ID sản phẩm nếu không có
    if (!item.id) {
      item.id = `line-${item.productVariant.id}-${Date.now()}`;
    }

    // Kiểm tra số lượng
    if (!item.quantity || item.quantity <= 0) {
      console.error('Số lượng sản phẩm không hợp lệ:', item.quantity);
      return;
    }

    // Kiểm tra tên biến thể sản phẩm
    if (!item.productVariant.name) {
      console.error('Thiếu tên biến thể sản phẩm');
      return;
    }

    // Kiểm tra giá sản phẩm
    if (typeof item.productVariant.priceWithTax !== 'number' || item.productVariant.priceWithTax <= 0) {
      console.error('Giá sản phẩm không hợp lệ:', item.productVariant.priceWithTax);
      return;
    }

    // Kiểm tra mã tiền tệ
    if (!item.productVariant.currencyCode) {
      console.error('Thiếu mã tiền tệ');
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(i => i.id === item.id);
      let newCart;
      
      if (existingItem) {
        newCart = prevCart.map(i => 
          i.id === item.id 
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      } else {
        newCart = [...prevCart, item];
      }

      // Cập nhật localStorage
      const newTotal = calculateTotal(newCart);
      localStorage.setItem('cart', JSON.stringify({
        items: newCart,
        total: newTotal
      }));

      return newCart;
    });
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setCart(prevCart =>
      prevCart.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart(prevCart => {
      const newCart = prevCart.filter(item => item.id !== itemId);
      
      // Cập nhật localStorage
      const newTotal = calculateTotal(newCart);
      localStorage.setItem('cart', JSON.stringify({
        items: newCart,
        total: newTotal
      }));

      return newCart;
    });
  };

  const clearCart = () => {
    setCart([]);
    setTotal(0);
    localStorage.removeItem('cart');
  };

  const calculateTotal = (items: CartItem[]) => {
    return items.reduce((sum, item) => {
      if (!item?.productVariant?.priceWithTax) return sum;
      return sum + (item.productVariant.priceWithTax * item.quantity);
    }, 0);
  };

  const totalQuantity = cart.reduce((sum, item) => {
    if (!item?.quantity) return sum;
    return sum + item.quantity;
  }, 0);

  useEffect(() => {
    const newTotal = calculateTotal(cart);
    setTotal(newTotal);
  }, [cart]);

  const value = {
    cart,
    total,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalQuantity
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
} 