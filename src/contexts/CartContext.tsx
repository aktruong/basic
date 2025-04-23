'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { CartItem } from '@/lib/vendure';
import { getActiveOrder } from '@/lib/vendure';
import { useCart } from '@/hooks/useCart';
import React from 'react';
import { Cart, CartLine } from '@/types';
import { fetchGraphQL } from '@/hooks/useCart';
import { ActiveOrder } from '@/types';

interface CartContextType {
  items: CartLine[];
  total: number;
  totalQuantity: number;
  loading: boolean;
  error: string | null;
  activeOrder: ActiveOrder | null;
  addToCart: (productVariantId: string, quantity: number) => Promise<void>;
  removeFromCart: (orderLineId: string) => Promise<void>;
  updateQuantity: (orderLineId: string, quantity: number) => Promise<void>;
  loadCart: () => Promise<void>;
  cart: Cart | null;
  setCart: React.Dispatch<React.SetStateAction<Cart | null>>;
  showMenuQuantityControls: { [key: string]: boolean };
  setShowMenuQuantityControls: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = React.useState<Cart | null>(null);
  const [showMenuQuantityControls, setShowMenuQuantityControls] = React.useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Cập nhật showMenuQuantityControls khi cart thay đổi
  React.useEffect(() => {
    if (cart?.lines) {
      const newState = { ...showMenuQuantityControls };
      cart.lines.forEach((line: CartLine) => {
        newState[line.productVariant.id] = true;
      });
      setShowMenuQuantityControls(newState);
    }
  }, [cart]);

  const loadCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchGraphQL(`
        query GetActiveOrder {
          activeOrder {
            id
            total
            totalWithTax
            subTotalWithTax
            totalQuantity
            currencyCode
            lines {
              id
              quantity
              productVariant {
                id
                name
                sku
                priceWithTax
                currencyCode
                featuredAsset {
                  preview
                }
              }
            }
          }
        }
      `);

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      const activeOrder = result.data?.activeOrder;
      if (activeOrder) {
        const newCart = {
          id: activeOrder.id,
          lines: activeOrder.lines.map((line: any) => ({
            id: line.id,
            quantity: line.quantity,
            productVariant: line.productVariant
          })),
          totalWithTax: activeOrder.totalWithTax,
          currencyCode: activeOrder.currencyCode,
          activeOrder: activeOrder
        };
        setCart(newCart);
      } else {
        setCart(null);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  // Load cart khi component mount
  React.useEffect(() => {
    loadCart();
  }, []);

  const addToCart = async (productVariantId: string, quantity: number) => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchGraphQL(`
        mutation AddToCart($productVariantId: ID!, $quantity: Int!) {
          addItemToOrder(productVariantId: $productVariantId, quantity: $quantity) {
            ... on Order {
              id
              lines {
                id
                quantity
                productVariant {
                  id
                  name
                  priceWithTax
                  featuredAsset {
                    preview
                  }
                }
              }
              total
            }
            ... on ErrorResult {
              errorCode
              message
            }
          }
        }
      `, {
        productVariantId,
        quantity,
      });

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      const order = result.data.addItemToOrder;
      if (order.errorCode) {
        throw new Error(order.message);
      }

      setCart(order);
    } catch (error) {
      console.error('Error adding to cart:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (orderLineId: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchGraphQL(`
        mutation RemoveFromCart($orderLineId: ID!) {
          removeOrderLine(orderLineId: $orderLineId) {
            ... on Order {
              id
              lines {
                id
                quantity
                productVariant {
                  id
                  name
                  priceWithTax
                  featuredAsset {
                    preview
                  }
                }
              }
              total
            }
            ... on ErrorResult {
              errorCode
              message
            }
          }
        }
      `, {
        orderLineId,
      });

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      const order = result.data.removeOrderLine;
      if (order.errorCode) {
        throw new Error(order.message);
      }

      setCart(order);
    } catch (error) {
      console.error('Error removing from cart:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (orderLineId: string, quantity: number) => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchGraphQL(`
        mutation UpdateQuantity($orderLineId: ID!, $quantity: Int!) {
          adjustOrderLine(orderLineId: $orderLineId, quantity: $quantity) {
            ... on Order {
              id
              lines {
                id
                quantity
                productVariant {
                  id
                  name
                  priceWithTax
                  featuredAsset {
                    preview
                  }
                }
              }
              total
            }
            ... on ErrorResult {
              errorCode
              message
            }
          }
        }
      `, {
        orderLineId,
        quantity,
      });

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      const order = result.data.adjustOrderLine;
      if (order.errorCode) {
        throw new Error(order.message);
      }

      setCart(order);
    } catch (error) {
      console.error('Error updating quantity:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider value={{
    items: cart?.lines || [],
    total: cart?.totalWithTax || 0,
    totalQuantity: cart?.lines?.reduce((acc, line) => acc + line.quantity, 0) || 0,
    loading,
    error,
      activeOrder: cart as ActiveOrder | null,
    addToCart,
    removeFromCart,
    updateQuantity,
    loadCart,
    cart,
    setCart,
    showMenuQuantityControls,
      setShowMenuQuantityControls
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCartContext = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return context;
};