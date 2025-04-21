'use client';

import { useState, useEffect } from 'react';
import { GET_ACTIVE_ORDER, ActiveOrderResponse, vendureFetch } from '@/lib/vendure';

interface CartItem {
  id: string;
  quantity: number;
  productVariant: {
    id: string;
    name: string;
    priceWithTax: number;
    currencyCode: string;
    description?: string;
    featuredAsset?: {
      id: string;
      name: string;
      source: string;
      preview: string;
      width: number;
      height: number;
    };
    product?: {
      id: string;
      name: string;
      slug: string;
      featuredAsset?: {
        id: string;
        name: string;
        source: string;
        preview: string;
        width: number;
        height: number;
      };
    };
  };
}

interface CartState {
  items: CartItem[];
  total: number;
  totalQuantity: number;
  loading: boolean;
  error: string | null;
  isOpen: boolean;
}

export function useCart() {
  const [state, setState] = useState<CartState>({
    items: [],
    total: 0,
    totalQuantity: 0,
    loading: false,
    error: null,
    isOpen: false,
  });

  const setIsOpen = (isOpen: boolean) => {
    setState(prev => ({ ...prev, isOpen }));
  };

  const fetchActiveOrder = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await vendureFetch<ActiveOrderResponse>(GET_ACTIVE_ORDER);
      console.log('Active order response:', response);
      
      if (response.data.activeOrder) {
        setState({
          items: response.data.activeOrder.lines,
          total: response.data.activeOrder.total,
          totalQuantity: response.data.activeOrder.totalQuantity,
          loading: false,
          error: null,
          isOpen: state.isOpen,
        });
      } else {
        setState({
          items: [],
          total: 0,
          totalQuantity: 0,
          loading: false,
          error: null,
          isOpen: state.isOpen,
        });
      }
    } catch (error) {
      console.error('Error fetching active order:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      }));
    }
  };

  useEffect(() => {
    fetchActiveOrder();
  }, []);

  const addToCart = async (variantId: string, quantity: number) => {
    try {
      const response = await vendureFetch<ActiveOrderResponse>(`
        mutation AddToCart($variantId: ID!, $quantity: Int!) {
          addItemToOrder(productVariantId: $variantId, quantity: $quantity) {
            ... on Order {
              id
              code
              state
              total
              totalQuantity
              lines {
                id
                quantity
                productVariant {
                  id
                  name
                  priceWithTax
                  currencyCode
                  featuredAsset {
                    id
                    name
                    source
                    preview
                    width
                    height
                  }
                }
              }
            }
          }
        }
      `, { variantId, quantity });

      console.log('Add to cart response:', response);
      await fetchActiveOrder();
    } catch (error) {
      console.error('Error adding to cart:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An error occurred',
      }));
    }
  };

  const removeFromCart = async (lineId: string) => {
    try {
      const response = await vendureFetch<ActiveOrderResponse>(`
        mutation RemoveFromCart($lineId: ID!) {
          removeOrderLine(orderLineId: $lineId) {
            ... on Order {
              id
              code
              state
              total
              totalQuantity
              lines {
                id
                quantity
                productVariant {
                  id
                  name
                  priceWithTax
                  currencyCode
                  featuredAsset {
                    id
                    name
                    source
                    preview
                    width
                    height
                  }
                }
              }
            }
          }
        }
      `, { lineId });

      console.log('Remove from cart response:', response);
      await fetchActiveOrder();
    } catch (error) {
      console.error('Error removing from cart:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An error occurred',
      }));
    }
  };

  const updateQuantity = async (lineId: string, quantity: number) => {
    try {
      const response = await vendureFetch<ActiveOrderResponse>(`
        mutation UpdateQuantity($lineId: ID!, $quantity: Int!) {
          adjustOrderLine(orderLineId: $lineId, quantity: $quantity) {
            ... on Order {
              id
              code
              state
              total
              totalQuantity
              lines {
                id
                quantity
                productVariant {
                  id
                  name
                  priceWithTax
                  currencyCode
                  featuredAsset {
                    id
                    name
                    source
                    preview
                    width
                    height
                  }
                }
              }
            }
          }
        }
      `, { lineId, quantity });

      console.log('Update quantity response:', response);
      await fetchActiveOrder();
    } catch (error) {
      console.error('Error updating quantity:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An error occurred',
      }));
    }
  };

  return {
    ...state,
    setIsOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
  };
} 