'use client';

import { useState, useEffect } from 'react';

interface CartItem {
  id: string;
  quantity: number;
  productVariant: {
    id: string;
    name: string;
    priceWithTax: number;
    currencyCode: string;
    featuredAsset?: {
      id: string;
      name: string;
      source: string;
      preview: string;
      width: number;
      height: number;
    };
  };
}

interface CartState {
  items: CartItem[];
  total: number;
  totalQuantity: number;
  loading: boolean;
  error: string | null;
  activeOrder: {
    id: string;
    total: number;
    totalWithTax: number;
    totalQuantity: number;
    currencyCode: string;
    lines: {
      id: string;
      quantity: number;
      productVariant: {
        id: string;
        name: string;
        sku: string;
        priceWithTax: number;
        currencyCode: string;
        featuredAsset?: {
          id: string;
          name: string;
          source: string;
          preview: string;
          width: number;
          height: number;
        };
      };
    }[];
  } | null;
}

const ACTIVE_ORDER_QUERY = `
  query GetActiveOrder {
    activeOrder {
      id
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
          product {
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
`;

const ADD_ITEM_MUTATION = `
  mutation AddItemToOrder($productVariantId: ID!, $quantity: Int!) {
    addItemToOrder(productVariantId: $productVariantId, quantity: $quantity) {
      ... on Order {
        id
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
            product {
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
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

const REMOVE_ITEM_MUTATION = `
  mutation RemoveOrderLine($orderLineId: ID!) {
    removeOrderLine(orderLineId: $orderLineId) {
      ... on Order {
        id
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
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

const ADJUST_QUANTITY_MUTATION = `
  mutation AdjustOrderLine($orderLineId: ID!, $quantity: Int!) {
    adjustOrderLine(orderLineId: $orderLineId, quantity: $quantity) {
      ... on Order {
        id
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
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const fetchGraphQL = async (query: string, variables?: any) => {
  try {
    console.log('Fetching GraphQL with query:', query);
    console.log('Variables:', variables);
    
    if (!process.env.NEXT_PUBLIC_SHOP_API_URL) {
      throw new Error('NEXT_PUBLIC_SHOP_API_URL is not defined');
    }

    if (!process.env.NEXT_PUBLIC_VENDURE_TOKEN) {
      throw new Error('NEXT_PUBLIC_VENDURE_TOKEN is not defined');
    }

    const response = await fetch(process.env.NEXT_PUBLIC_SHOP_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'vendure-token': process.env.NEXT_PUBLIC_VENDURE_TOKEN,
      },
      credentials: 'include',
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('GraphQL Response:', result);

    if (result.errors) {
      console.error('GraphQL Errors:', result.errors);
      throw new Error(result.errors[0].message);
    }

    return result;
  } catch (error) {
    console.error('Error in fetchGraphQL:', error);
    throw error;
  }
};

export function useCart() {
  const [state, setState] = useState<CartState>({
    items: [],
    total: 0,
    totalQuantity: 0,
    loading: true,
    error: null,
    activeOrder: null,
  });

  console.log('useCart state:', state);

  const loadCart = async () => {
    try {
      console.log('Loading cart...');
      setState(prev => ({ ...prev, loading: true, error: null }));
      const result = await fetchGraphQL(ACTIVE_ORDER_QUERY);
      
      console.log('API Response:', JSON.stringify(result, null, 2));

      if (!result || !result.data) {
        console.log('No data returned from API');
        setState(prev => ({ ...prev, loading: false, items: [], total: 0, totalQuantity: 0, activeOrder: null }));
        return;
      }

      const { activeOrder } = result.data;
      
      if (!activeOrder) {
        console.log('No active order found');
        setState(prev => ({ ...prev, loading: false, items: [], total: 0, totalQuantity: 0, activeOrder: null }));
        return;
      }

      console.log('Active Order:', JSON.stringify(activeOrder, null, 2));

      const items = activeOrder.lines.map((line: any) => ({
        id: line.id,
        quantity: line.quantity,
        productVariant: {
          id: line.productVariant.id,
          name: line.productVariant.name,
          sku: line.productVariant.sku || '',
          priceWithTax: line.productVariant.priceWithTax,
          currencyCode: line.productVariant.currencyCode,
          featuredAsset: line.productVariant.featuredAsset || line.productVariant.product?.featuredAsset
        }
      }));

      console.log('Active Order Total:', activeOrder.total);
      console.log('Active Order Total With Tax:', activeOrder.totalWithTax);
      console.log('Active Order Lines:', activeOrder.lines);

      const calculatedTotal = items.reduce((sum: number, item: CartItem) => 
        sum + (item.quantity * item.productVariant.priceWithTax), 0
      );

      console.log('Calculated Total:', calculatedTotal);

      setState({
        items,
        total: calculatedTotal,
        totalQuantity: activeOrder.totalQuantity,
        loading: false,
        error: null,
        activeOrder: {
          ...activeOrder,
          totalWithTax: calculatedTotal,
          currencyCode: activeOrder.currencyCode || 'VND'
        }
      });
    } catch (error) {
      console.error('Error loading cart:', error);
      setState(prev => ({ ...prev, loading: false, error: error instanceof Error ? error.message : 'Failed to load cart' }));
    }
  };

  useEffect(() => {
    console.log('useCart useEffect running');
    loadCart();
  }, []);

  const addToCart = async (productVariantId: string, quantity: number) => {
    try {
      console.log('Adding to cart:', { productVariantId, quantity });
      setState(prev => ({ ...prev, loading: true, error: null }));
      const result = await fetchGraphQL(ADD_ITEM_MUTATION, { productVariantId, quantity });
      console.log('Add to cart result:', result);
      await loadCart();
    } catch (error) {
      console.error('Error adding to cart:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Có lỗi xảy ra khi thêm vào giỏ hàng',
      }));
    }
  };

  const removeFromCart = async (orderLineId: string) => {
    try {
      console.log('Removing from cart:', orderLineId);
      setState(prev => ({ ...prev, loading: true, error: null }));
      const result = await fetchGraphQL(REMOVE_ITEM_MUTATION, { orderLineId });
      console.log('Remove from cart result:', result);
      await loadCart();
    } catch (error) {
      console.error('Error removing from cart:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Có lỗi xảy ra khi xóa khỏi giỏ hàng',
      }));
    }
  };

  const updateQuantity = async (orderLineId: string, quantity: number) => {
    try {
      if (quantity < 1) {
        await removeFromCart(orderLineId);
        return;
      }

      const result = await fetchGraphQL(`
        mutation UpdateOrderLine($orderLineId: ID!, $quantity: Int!) {
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
        console.error('GraphQL Errors:', result.errors);
        if (result.errors[0].message.includes('does not contain an OrderLine')) {
          const itemToRemove = state.items.find(i => i.id === orderLineId);
          if (itemToRemove) {
            setState(prev => ({
              ...prev,
              items: prev.items.filter(item => item.id !== orderLineId),
              total: prev.total - (itemToRemove.quantity * itemToRemove.productVariant.priceWithTax),
              totalQuantity: prev.totalQuantity - itemToRemove.quantity,
            }));
          }
          return;
        }
        throw new Error(result.errors[0].message);
      }

      const order = result.data.adjustOrderLine;
      if (order.errorCode) {
        throw new Error(order.message);
      }

      setState(prev => ({
        ...prev,
        items: order.lines,
        total: order.totalWithTax || order.total || 0,
        totalQuantity: order.totalQuantity,
      }));
    } catch (error) {
      console.error('Error updating quantity:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Có lỗi xảy ra khi cập nhật số lượng',
      }));
    }
  };

  return {
    items: state.items,
    total: state.total,
    totalQuantity: state.totalQuantity,
    loading: state.loading,
    error: state.error,
    activeOrder: state.activeOrder,
    loadCart,
    addToCart,
    removeFromCart,
    updateQuantity,
  };
} 