import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useCartContext } from '@/contexts/CartContext';
import toast from 'react-hot-toast';
import { QuantityAdjuster } from './QuantityAdjuster';
import debounce from 'lodash/debounce';
import { VendureAsset } from './VendureAsset';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  product: {
    id: string;
    slug: string;
    description: string;
  };
  featuredAsset: {
    preview: string;
  };
  priceWithTax: number;
  variants: Array<{
    id: string;
    priceWithTax: number;
    currencyCode: string;
  }>;
}

interface Collection {
  id: string;
  name: string;
  description: string;
  productVariants: {
    items: Array<{
      id: string;
      name: string;
      priceWithTax: number;
      currencyCode: string;
      product: {
        id: string;
        name: string;
        slug: string;
        description: string;
        featuredAsset: {
          id: string;
          preview: string;
          source: string;
        };
      };
    }>;
  };
}

interface CollectionProps {
  collection: Collection;
}

export const Collection: React.FC<CollectionProps> = React.memo(({ collection }) => {
  const router = useRouter();
  const cartContext = useCartContext();
  const { addToCart, updateQuantity, items } = cartContext || {};
  const [showQuantityControls, setShowQuantityControls] = React.useState<{ [key: string]: boolean }>({});
  const [showMenuQuantityControls, setShowMenuQuantityControls] = React.useState<{ [key: string]: boolean }>({});

  console.log('Collection data:', JSON.stringify(collection, null, 2));

  // Thêm ref để lưu trữ timeout
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Cập nhật showQuantityControls khi items thay đổi
  React.useEffect(() => {
    if (!items) return;
    
    const newState = { ...showQuantityControls };
    const newMenuState = { ...showMenuQuantityControls };
    items.forEach(item => {
      if (!newState[item.productVariant.id]) {
        newState[item.productVariant.id] = false;
      }
      if (!newMenuState[item.productVariant.id]) {
        newMenuState[item.productVariant.id] = true;
      }
    });
    setShowQuantityControls(newState);
    setShowMenuQuantityControls(newMenuState);
  }, [items]);

  // Thêm sự kiện cuộn trang
  React.useEffect(() => {
    const handleScroll = debounce(() => {
      // Lấy danh sách các sản phẩm đang hiển thị bộ điều chỉnh số lượng
      const productsWithControls = Object.entries(showQuantityControls)
        .filter(([_, value]) => value)
        .map(([key]) => key);

      // Nếu có sản phẩm đang hiển thị bộ điều chỉnh
      if (productsWithControls.length > 0) {
        // Tạo object mới với tất cả các sản phẩm đều false
        const newState = { ...showQuantityControls };
        productsWithControls.forEach(productId => {
          // Chỉ ẩn bộ điều chỉnh nếu sản phẩm đã có trong giỏ hàng
          const cartItem = items.find(item => item.productVariant.id === productId);
          if (cartItem) {
            newState[productId] = false;
          }
        });
        
        setShowQuantityControls(newState);
      }
    }, 100);

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      handleScroll.cancel();
    };
  }, [showQuantityControls, items]);

  // Thêm useEffect để theo dõi thay đổi của items
  React.useEffect(() => {
    if (!items) return;
    
    const newMenuState = { ...showMenuQuantityControls };
    items.forEach(item => {
      newMenuState[item.productVariant.id] = true;
    });
    setShowMenuQuantityControls(newMenuState);
  }, [items]);

  const formatDescription = (html: string) => {
    // Tạo một div tạm thời để chuyển đổi HTML entities
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Lấy nội dung văn bản thuần túy
    let plainText = tempDiv.textContent || tempDiv.innerText;
    
    // Loại bỏ các thẻ HTML còn sót lại
    plainText = plainText.replace(/<[^>]*>/g, ' ');
    
    // Loại bỏ khoảng trắng thừa
    plainText = plainText.replace(/\s+/g, ' ').trim();
    
    return plainText;
  };

  const handleCardClick = (slug: string) => {
    router.push(`/product/${slug}`);
  };

  const handleAddClick = (e: React.MouseEvent, productId: string, productName: string) => {
    e.stopPropagation();
    if (typeof addToCart === 'function') {
      addToCart(productId, 1);
      setShowQuantityControls(prev => ({ ...prev, [productId]: true }));
      setShowMenuQuantityControls(prev => ({ ...prev, [productId]: true }));
      toast.success(`Đã thêm ${productName} vào giỏ hàng`, {
        duration: 2000,
        position: 'bottom-right',
        style: {
          background: '#2563EB',
          color: '#fff',
          borderRadius: '0.5rem',
          padding: '0.5rem 1rem',
        },
      });
    } else {
      console.error('addToCart is not a function');
    }
  };

  const handleQuantityChange = async (orderLineId: string, newQuantity: number, productId: string) => {
    await updateQuantity(orderLineId, newQuantity);
    setShowMenuQuantityControls(prev => ({ ...prev, [productId]: true }));
  };

  const handleQuantityClick = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    setShowQuantityControls(prev => ({ ...prev, [productId]: true }));
    setShowMenuQuantityControls(prev => ({ ...prev, [productId]: true }));
  };

  const handleClickOutside = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    setShowQuantityControls(prev => ({ ...prev, [productId]: false }));
    setShowMenuQuantityControls(prev => ({ ...prev, [productId]: true }));
  };

  const handleCustomizeClick = (e: React.MouseEvent, slug: string) => {
    e.stopPropagation();
    router.push(`/product/${slug}`);
  };

  return (
    <div className="mb-12 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">{collection.name}</h2>
      {/* Mobile layout */}
      <div className="sm:hidden space-y-4">
        {collection.productVariants?.items?.map((variant) => {
          const cartItem = items?.find(item => item.productVariant.id === variant.id);
          console.log('Variant data:', JSON.stringify(variant, null, 2));
          return (
            <div key={variant.id} className="relative">
              <motion.div 
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="group relative bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer pointer-events-none"
                onClick={() => handleCardClick(variant.product?.slug || '')}
              >
                <div className="pointer-events-auto">
                  <div className="flex">
                    <div className="w-1/3">
                      <div className="aspect-square relative">
                        <VendureAsset
                          preview={variant.product?.featuredAsset?.preview}
                          source={variant.product?.featuredAsset?.source}
                          preset="medium"
                          alt={variant.product?.name || ''}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="w-2/3 p-3">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{variant.product?.name}</h3>
                      <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                        {formatDescription(variant.product?.description || '')}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-bold text-blue-600">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: variant.currencyCode || 'VND',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }).format(variant.priceWithTax / 100)}
                        </p>
                        {cartItem ? (
                          showQuantityControls[variant.id] ? (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              transition={{ duration: 0.2 }}
                              className="flex items-center space-x-2 bg-white rounded-full shadow-md"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClickOutside(e, variant.id);
                              }}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuantityChange(cartItem.id, cartItem.quantity - 1, variant.id);
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                              >
                                -
                              </button>
                              <span className="text-sm font-medium">{cartItem.quantity}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuantityChange(cartItem.id, cartItem.quantity + 1, variant.id);
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                              >
                                +
                              </button>
                            </motion.div>
                          ) : (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              transition={{ duration: 0.2 }}
                              onClick={(e) => handleQuantityClick(e, variant.id)}
                              className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-full cursor-pointer"
                            >
                              {cartItem.quantity}
                            </motion.div>
                          )
                        ) : (
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => handleAddClick(e, variant.id, variant.product?.name || '')}
                            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200 active:scale-95"
                          >
                            Thêm
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
      {/* Desktop layout */}
      <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {collection.productVariants?.items?.map((variant) => {
          const cartItem = items?.find(item => item.productVariant.id === variant.id);
          console.log('Variant data:', JSON.stringify(variant, null, 2));
          return (
            <div key={variant.id} className="relative">
              <motion.div 
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="group relative bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer pointer-events-none"
                onClick={() => handleCardClick(variant.product?.slug || '')}
              >
                <div className="pointer-events-auto">
                  <div className="aspect-square relative">
                    <VendureAsset
                      preview={variant.product?.featuredAsset?.preview}
                      source={variant.product?.featuredAsset?.source}
                      preset="medium"
                      alt={variant.product?.name || ''}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{variant.product?.name}</h3>
                    <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                      {formatDescription(variant.product?.description || '')}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold text-blue-600">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: variant.currencyCode || 'VND',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(variant.priceWithTax / 100)}
                      </p>
                      {cartItem ? (
                        showQuantityControls[variant.id] ? (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center space-x-2 bg-white rounded-full shadow-md"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClickOutside(e, variant.id);
                            }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuantityChange(cartItem.id, cartItem.quantity - 1, variant.id);
                              }}
                              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                            >
                              -
                            </button>
                            <span className="text-sm font-medium">{cartItem.quantity}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuantityChange(cartItem.id, cartItem.quantity + 1, variant.id);
                              }}
                              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                            >
                              +
                            </button>
                          </motion.div>
                        ) : (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.2 }}
                            onClick={(e) => handleQuantityClick(e, variant.id)}
                            className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-full cursor-pointer"
                          >
                            {cartItem.quantity}
                          </motion.div>
                        )
                      ) : (
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => handleAddClick(e, variant.id, variant.product?.name || '')}
                          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200 active:scale-95"
                        >
                          Thêm
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}); 