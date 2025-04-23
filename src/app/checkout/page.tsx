'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCartContext } from '@/contexts/CartContext';
import React from 'react';
import { formatPrice } from '@/lib/utils';

interface FormData {
  firstName: string;
  lastName: string;
  emailAddress: string;
  phoneNumber: string;
  streetLine1: string;
  city: string;
  countryCode: string;
  note: string;
}

interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  priceWithTax: number;
}

interface PaymentMethod {
  id: string;
  code: string;
  name: string;
  description: string;
}

interface CartItem {
  id: string;
  quantity: number;
  productVariant: {
    id: string;
    name: string;
    priceWithTax: number;
    currencyCode: string;
  };
}

interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface ShippingAddress {
  fullName: string;
  streetLine1: string;
  city: string;
  countryCode: string;
  phoneNumber: string;
}

interface ActiveOrder {
  id: string;
  code: string;
  state: string;
  totalWithTax: number;
  shippingWithTax: number;
  lines: Array<{
    id: string;
    quantity: number;
    productVariant: {
      id: string;
      name: string;
      priceWithTax: number;
    };
  }>;
}

interface OrderState {
  loading: boolean;
  error: string | null;
  shippingMethods: ShippingMethod[];
  paymentMethods: PaymentMethod[];
  selectedShippingMethod: string | null;
  selectedPaymentMethod: string | null;
  shippingFee: number;
}

const ACTIVE_ORDER_FRAGMENT = /*GraphQL*/`
  fragment ActiveOrder on Order {
    __typename
    id
    code
    state
    currencyCode
    totalQuantity
    subTotalWithTax
    shippingWithTax
    totalWithTax
    lines {
      id
      unitPriceWithTax
      quantity
      linePriceWithTax
      productVariant {
        id
        name
        sku
      }
    }
    shippingLines {
      shippingMethod {
        id
        name
        description
      }
      priceWithTax
    }
  }
`;

const GET_ACTIVE_ORDER = /*GraphQL*/`
  query GetActiveOrder {
    activeOrder {
      ...ActiveOrder
    }
  }
  ${ACTIVE_ORDER_FRAGMENT}
`;

const ADD_ITEM_TO_ORDER = /*GraphQL*/`
  mutation AddItemToOrder($productVariantId: ID!, $quantity: Int!) {
    addItemToOrder(productVariantId: $productVariantId, quantity: $quantity) {
      ...ActiveOrder
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
  ${ACTIVE_ORDER_FRAGMENT}
`;

const REMOVE_ORDER_LINE = /*GraphQL*/`
  mutation RemoveOrderLine($orderLineId: ID!) {
    removeOrderLine(orderLineId: $orderLineId) {
      ...ActiveOrder
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
  ${ACTIVE_ORDER_FRAGMENT}
`;

const ADJUST_ORDER_LINE = /*GraphQL*/`
  mutation AdjustOrderLine($orderLineId: ID!, $quantity: Int!) {
    adjustOrderLine(orderLineId: $orderLineId, quantity: $quantity) {
      ...ActiveOrder
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
  ${ACTIVE_ORDER_FRAGMENT}
`;

const SET_SHIPPING_METHOD = `
  mutation SetShippingMethod($shippingMethodId: [ID!]!) {
    setOrderShippingMethod(shippingMethodId: $shippingMethodId) {
      ... on Order {
        id
        state
        shipping
        shippingWithTax
        total
        totalWithTax
        shippingLines {
          shippingMethod {
            id
            name
            description
          }
          priceWithTax
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

const transitionOrderToState = async (state: string) => {
  try {
    const response = await fetch(process.env.NEXT_PUBLIC_SHOP_API_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'vendure-token': process.env.NEXT_PUBLIC_VENDURE_TOKEN!,
      },
      credentials: 'include',
      body: JSON.stringify({
        query: `
          mutation TransitionOrderToState($state: String!) {
            transitionOrderToState(state: $state) {
              ... on Order {
                id
                state
              }
              ... on ErrorResult {
                errorCode
                message
              }
            }
          }
        `,
        variables: {
          state,
        },
      }),
    });

    const result = await response.json();
    if (result.errors || result.data.transitionOrderToState.errorCode) {
      throw new Error(result.errors?.[0].message || result.data.transitionOrderToState.message);
    }

    return result.data.transitionOrderToState;
  } catch (err) {
    console.error('Lỗi khi chuyển trạng thái đơn hàng:', err);
    return null;
  }
};

const setCustomerInfo = async (customerInfo: CustomerInfo) => {
  try {
    console.log('Setting customer info:', customerInfo);
    
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
        query: `
          mutation SetCustomerForOrder($input: CreateCustomerInput!) {
            setCustomerForOrder(input: $input) {
              ... on Order {
                id
                customer {
                  id
                  firstName
                  lastName
                  emailAddress
                  phoneNumber
                }
              }
              ... on ErrorResult {
                errorCode
                message
              }
            }
          }
        `,
        variables: {
          input: {
            firstName: customerInfo.firstName,
            lastName: customerInfo.lastName,
            emailAddress: customerInfo.email,
            phoneNumber: customerInfo.phone,
          }
        }
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

    if (result.data.setCustomerForOrder.errorCode) {
      throw new Error(result.data.setCustomerForOrder.message);
    }

    return result.data.setCustomerForOrder;
  } catch (error) {
    console.error('Error setting customer info:', error);
    throw error;
  }
};

const setOrderShippingAddress = async (input: {
  fullName: string;
  streetLine1: string;
  city: string;
  countryCode: string;
  phoneNumber: string;
}) => {
  try {
    const response = await fetch(process.env.NEXT_PUBLIC_SHOP_API_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'vendure-token': process.env.NEXT_PUBLIC_VENDURE_TOKEN!,
      },
      credentials: 'include',
      body: JSON.stringify({
        query: `
          mutation SetOrderShippingAddress($input: CreateAddressInput!) {
            setOrderShippingAddress(input: $input) {
              ... on Order {
                id
                state
              }
              ... on ErrorResult {
                errorCode
                message
              }
            }
          }
        `,
        variables: {
          input,
        },
      }),
    });

    const result = await response.json();
    if (result.errors || result.data.setOrderShippingAddress.errorCode) {
      throw new Error(result.errors?.[0].message || result.data.setOrderShippingAddress.message);
    }

    return result.data.setOrderShippingAddress;
  } catch (err) {
    console.error('Lỗi khi cập nhật địa chỉ giao hàng:', err);
    return null;
  }
};

const fetchGraphQL = async (query: string, variables?: any) => {
  try {
    // Tạo cache key từ query và variables
    const cacheKey = JSON.stringify({ query, variables });
    
    // Kiểm tra cache
    if (typeof window !== 'undefined') {
      const cachedData = sessionStorage.getItem(cacheKey);
      if (cachedData) {
        console.log('Using cached data for:', cacheKey);
        return JSON.parse(cachedData);
      }
    }

    const response = await fetch(process.env.NEXT_PUBLIC_SHOP_API_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'vendure-token': process.env.NEXT_PUBLIC_VENDURE_TOKEN!,
      },
      credentials: 'include',
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // Cache kết quả
    if (typeof window !== 'undefined' && !result.errors) {
      sessionStorage.setItem(cacheKey, JSON.stringify(result));
    }

    return result;
  } catch (error) {
    console.error('Error fetching GraphQL:', error);
    throw error;
  }
};

// Tách ShippingMethodList thành component riêng
const ShippingMethodList = React.memo(({ 
  methods, 
  selectedMethod, 
  onSelect 
}: { 
  methods: ShippingMethod[], 
  selectedMethod: string, 
  onSelect: (id: string) => void 
}) => {
  return (
    <div className="space-y-4">
      {methods.map((method) => (
        <div
          key={method.id}
          className={`p-4 border rounded-lg cursor-pointer ${
            selectedMethod === method.id
              ? 'border-blue-500 bg-blue-50'
              : 'hover:bg-gray-50'
          }`}
          onClick={() => onSelect(method.id)}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{method.name}</h3>
              <p className="text-sm text-gray-500">{method.description}</p>
            </div>
            <div className="text-right">
              <p className="font-medium">{formatPrice(method.priceWithTax)}</p>
          </div>
          </div>
        </div>
      ))}
    </div>
  );
});

// Tách PaymentMethodList thành component riêng
const PaymentMethodList = React.memo(({ 
  methods, 
  selectedMethod, 
  onSelect 
}: { 
  methods: PaymentMethod[], 
  selectedMethod: string, 
  onSelect: (id: string) => void 
}) => {
  return (
    <div className="space-y-4">
      {methods.map((method) => (
        <div
          key={method.id}
          className={`p-4 border rounded-lg cursor-pointer ${
            selectedMethod === method.id
              ? 'border-blue-500 bg-blue-50'
              : 'hover:bg-gray-50'
          }`}
          onClick={() => onSelect(method.id)}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{method.name}</h3>
            <p className="text-sm text-gray-500">{method.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

// Thêm ErrorBoundary component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p>Có lỗi xảy ra. Vui lòng thử lại sau.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, totalQuantity, activeOrder, loadCart, loading: cartLoading, error: cartError } = useCartContext();
  
  // Khai báo formState trước
  const [formState, formDispatch] = React.useReducer(
    (state: FormData, action: { type: string; payload: any }) => {
      switch (action.type) {
        case 'UPDATE_FIELD':
          return { ...state, [action.payload.field]: action.payload.value };
        default:
          return state;
      }
    },
    {
    firstName: '',
    lastName: '',
    emailAddress: '',
    phoneNumber: '',
    streetLine1: '',
    city: '',
    countryCode: 'VN',
    note: '',
    }
  );

  // Quản lý state với useReducer
  const [state, dispatch] = React.useReducer(
    (state: OrderState, action: any) => {
      switch (action.type) {
        case 'SET_LOADING':
          return { ...state, loading: action.payload };
        case 'SET_ERROR':
          return { ...state, error: action.payload };
        case 'SET_SHIPPING_METHODS':
          return { ...state, shippingMethods: action.payload };
        case 'SET_PAYMENT_METHODS':
          return { ...state, paymentMethods: action.payload };
        case 'SET_SELECTED_SHIPPING':
          return { ...state, selectedShippingMethod: action.payload };
        case 'SET_SELECTED_PAYMENT':
          return { ...state, selectedPaymentMethod: action.payload };
        case 'SET_SHIPPING_FEE':
          return { ...state, shippingFee: action.payload };
        default:
          return state;
      }
    },
    {
      loading: false,
      error: null,
      shippingMethods: [],
      paymentMethods: [],
      selectedShippingMethod: null,
      selectedPaymentMethod: null,
      shippingFee: 0,
    }
  );

  // Pure function để fetch data
  const fetchMethods = React.useCallback(async () => {
      const result = await fetchGraphQL(`
        query {
          eligibleShippingMethods {
            id
            name
            description
            price
            priceWithTax
          }
          eligiblePaymentMethods {
            id
            code
            name
            description
          }
        }
      `);

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

    return {
      shippingMethods: result.data?.eligibleShippingMethods || [],
      paymentMethods: result.data?.eligiblePaymentMethods || []
    };
  }, []);

  // Tính toán các giá trị
  const totalAmount = React.useMemo(() => {
    if (!activeOrder?.totalWithTax) {
      console.log('activeOrder:', activeOrder);
      return 0;
    }
    return activeOrder.totalWithTax + (state.shippingFee || 0);
  }, [activeOrder?.totalWithTax, state.shippingFee]);

  const subTotal = React.useMemo(() => {
    if (!activeOrder?.totalWithTax) {
      console.log('activeOrder:', activeOrder);
      return 0;
    }
    return activeOrder.totalWithTax;
  }, [activeOrder?.totalWithTax]);

  const shippingFee = React.useMemo(() => {
    return state.shippingFee || 0;
  }, [state.shippingFee]);

  const isFormValid = React.useMemo(() => {
    if (!activeOrder) return false;
    
    return (
      formState.firstName.trim() !== '' &&
      formState.lastName.trim() !== '' &&
      formState.phoneNumber.trim() !== '' &&
      formState.streetLine1.trim() !== '' &&
      formState.city.trim() !== '' &&
      formState.countryCode.trim() !== '' &&
      state.selectedShippingMethod !== null &&
      state.selectedPaymentMethod !== null
    );
  }, [activeOrder, formState, state.selectedShippingMethod, state.selectedPaymentMethod]);

  // Khởi tạo checkout
  React.useEffect(() => {
    let mounted = true;
    let isInitialized = false;

    const initializeCheckout = async () => {
      if (!mounted || isInitialized || !activeOrder) return;

      try {
        isInitialized = true;
        dispatch({ type: 'SET_LOADING', payload: true });
        
        const { shippingMethods, paymentMethods } = await fetchMethods();
        
        if (!mounted) return;

        dispatch({ type: 'SET_SHIPPING_METHODS', payload: shippingMethods });
        dispatch({ type: 'SET_PAYMENT_METHODS', payload: paymentMethods });
        
        if (shippingMethods.length > 0) {
          dispatch({ type: 'SET_SELECTED_SHIPPING', payload: shippingMethods[0].id });
          dispatch({ type: 'SET_SHIPPING_FEE', payload: shippingMethods[0].priceWithTax });
        }
        
        if (paymentMethods.length > 0) {
          dispatch({ type: 'SET_SELECTED_PAYMENT', payload: paymentMethods[0].id });
        }
    } catch (err) {
        if (mounted) {
          console.error('Lỗi khi tải phương thức vận chuyển và thanh toán:', err);
          dispatch({ type: 'SET_ERROR', payload: 'Không thể tải phương thức vận chuyển và thanh toán' });
        }
      } finally {
        if (mounted) {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      }
    };

    initializeCheckout();

    return () => {
      mounted = false;
    };
  }, [loadCart, fetchMethods, activeOrder]);

  // Xử lý sự kiện
  const handleInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    formDispatch({ type: 'UPDATE_FIELD', payload: { field: name, value } });
    
    // Tự động tạo email từ số điện thoại
    if (name === 'phoneNumber') {
      const cleanPhone = value.replace(/\D/g, '');
      formDispatch({ type: 'UPDATE_FIELD', payload: { field: 'emailAddress', value: `${cleanPhone}@cahoicoba.com` } });
    }
  }, []);

  const handleShippingMethodSelect = React.useCallback((methodId: string) => {
    const method = state.shippingMethods.find((m: any) => m.id === methodId);
    if (method) {
      dispatch({ type: 'SET_SELECTED_SHIPPING', payload: methodId });
      dispatch({ type: 'SET_SHIPPING_FEE', payload: method.priceWithTax });
    }
  }, [state.shippingMethods]);

  const handlePaymentMethodSelect = React.useCallback((methodId: string) => {
    const method = state.paymentMethods.find((m: any) => m.id === methodId);
    if (method) {
      dispatch({ type: 'SET_SELECTED_PAYMENT', payload: method.code });
    }
  }, [state.paymentMethods]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Kiểm tra thông tin bắt buộc
      if (!formState.firstName || !formState.lastName || !formState.phoneNumber) {
        throw new Error('Vui lòng nhập đầy đủ thông tin khách hàng');
      }

      if (!formState.streetLine1 || !formState.city || !formState.countryCode) {
        throw new Error('Vui lòng nhập đầy đủ địa chỉ giao hàng');
      }

      if (!state.selectedShippingMethod) {
        throw new Error('Vui lòng chọn phương thức vận chuyển');
      }

      if (!state.selectedPaymentMethod) {
        throw new Error('Vui lòng chọn phương thức thanh toán');
      }

      // Kiểm tra active order
      if (!activeOrder) {
        throw new Error('Không tìm thấy đơn hàng');
      }

      // Thiết lập thông tin khách hàng
      const customerResult = await setCustomerInfo({
        firstName: formState.firstName,
        lastName: formState.lastName,
        email: formState.emailAddress,
        phone: formState.phoneNumber,
      });

      if (!customerResult || customerResult.errorCode) {
        throw new Error('Không thể thiết lập thông tin khách hàng');
      }

      // Thiết lập địa chỉ giao hàng
      const addressResult = await setOrderShippingAddress({
        fullName: `${formState.firstName} ${formState.lastName}`,
        streetLine1: formState.streetLine1,
        city: formState.city,
        countryCode: formState.countryCode,
        phoneNumber: formState.phoneNumber,
      });

      if (!addressResult || addressResult.errorCode) {
        throw new Error('Không thể thiết lập địa chỉ giao hàng');
      }

      // Thiết lập phương thức vận chuyển
      const shippingMethodResponse = await fetch(process.env.NEXT_PUBLIC_SHOP_API_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'vendure-token': process.env.NEXT_PUBLIC_VENDURE_TOKEN!,
        },
        credentials: 'include',
        body: JSON.stringify({
          query: `
            mutation SetOrderShippingMethod($id: [ID!]!) {
              setOrderShippingMethod(shippingMethodId: $id) {
                ... on Order {
                  id
                  state
                }
                ... on ErrorResult {
                  errorCode
                  message
                }
              }
            }
          `,
          variables: {
            id: [state.selectedShippingMethod],
          },
        }),
      });

      const shippingMethodResult = await shippingMethodResponse.json();
      if (shippingMethodResult.errors || shippingMethodResult.data.setOrderShippingMethod.errorCode) {
        throw new Error(shippingMethodResult.errors?.[0].message || shippingMethodResult.data.setOrderShippingMethod.message);
      }

      // Chuyển trạng thái đơn hàng sang ArrangingPayment
      const transitionResponse = await fetch(process.env.NEXT_PUBLIC_SHOP_API_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'vendure-token': process.env.NEXT_PUBLIC_VENDURE_TOKEN!,
        },
        credentials: 'include',
        body: JSON.stringify({
          query: `
            mutation TransitionOrderToState($state: String!) {
              transitionOrderToState(state: $state) {
                ... on Order {
                  id
                  state
                }
                ... on ErrorResult {
                  errorCode
                  message
                }
              }
            }
          `,
          variables: {
            state: 'ArrangingPayment',
          },
        }),
      });

      const transitionResult = await transitionResponse.json();
      if (transitionResult.errors || transitionResult.data.transitionOrderToState.errorCode) {
        throw new Error(transitionResult.errors?.[0].message || transitionResult.data.transitionOrderToState.message);
      }

      // Thêm thanh toán
      const paymentResponse = await fetch(process.env.NEXT_PUBLIC_SHOP_API_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'vendure-token': process.env.NEXT_PUBLIC_VENDURE_TOKEN!,
        },
        credentials: 'include',
        body: JSON.stringify({
          query: `
            mutation AddPaymentToOrder($input: PaymentInput!) {
              addPaymentToOrder(input: $input) {
                ... on Order {
                  id
                  state
                }
                ... on ErrorResult {
                  errorCode
                  message
                }
              }
            }
          `,
          variables: {
            input: {
              method: state.selectedPaymentMethod,
              metadata: {
                note: formState.note,
              },
            },
          },
        }),
      });

      const paymentResult = await paymentResponse.json();
      if (paymentResult.errors || paymentResult.data.addPaymentToOrder.errorCode) {
        throw new Error(paymentResult.errors?.[0].message || paymentResult.data.addPaymentToOrder.message);
      }

      // Chuyển hướng đến trang cảm ơn
      router.push('/thank-you');
    } catch (err) {
      console.error('Lỗi khi xử lý thanh toán:', err);
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Có lỗi xảy ra khi xử lý thanh toán' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Hàm loại bỏ thẻ HTML
  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Hiển thị loading
  if (cartLoading || state.loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Hiển thị lỗi
  if (cartError || state.error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{cartError || state.error}</p>
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

  if (!items || items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded mb-4">
          <p>Giỏ hàng trống. Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán.</p>
        </div>
        <div className="mt-4">
          <button
            onClick={() => router.push('/')}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Thanh toán</h1>

        {state.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {state.error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Thông tin khách hàng</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    Họ
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formState.firstName}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Tên
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formState.lastName}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formState.phoneNumber}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <input
                  type="hidden"
                  name="emailAddress"
                  value={formState.emailAddress}
                />
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4">Địa chỉ giao hàng</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="streetLine1" className="block text-sm font-medium text-gray-700">
                    Địa chỉ
                  </label>
                  <input
                    type="text"
                    id="streetLine1"
                    name="streetLine1"
                    value={formState.streetLine1}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                    Thành phố
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formState.city}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="note" className="block text-sm font-medium text-gray-700">
                    Ghi chú
                  </label>
                  <input
                    type="text"
                    id="note"
                    name="note"
                    value={formState.note}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Phương thức vận chuyển</h2>
            {state.loading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ) : state.shippingMethods.length > 0 ? (
              <ShippingMethodList
                methods={state.shippingMethods}
                selectedMethod={state.selectedShippingMethod}
                onSelect={handleShippingMethodSelect}
              />
            ) : (
              <p className="text-gray-500">Không có phương thức vận chuyển nào khả dụng</p>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Phương thức thanh toán</h2>
            {state.loading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ) : state.paymentMethods.length > 0 ? (
              <div className="space-y-4">
                {state.paymentMethods.map((method: any) => (
                  <div
                    key={method.id}
                    className={`p-4 border rounded-lg cursor-pointer ${
                      state.selectedPaymentMethod === method.code
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handlePaymentMethodSelect(method.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{method.name}</h3>
                        <p className="text-sm text-gray-500">{stripHtml(method.description)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Không có phương thức thanh toán nào khả dụng</p>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Tổng đơn hàng</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Tạm tính:</span>
                <span>{formatPrice(subTotal, 'VND')}</span>
              </div>
              <div className="flex justify-between">
                <span>Phí vận chuyển:</span>
                <span>{formatPrice(state.shippingFee || 0, 'VND')}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-semibold">
                  <span>Tổng cộng:</span>
                  <span>{formatPrice(totalAmount, 'VND')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={state.loading || !isFormValid}
              className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {state.loading ? 'Đang xử lý...' : 'Thanh toán'}
            </button>
          </div>
        </form>
      </div>
    </ErrorBoundary>
  );
}

// Thêm hàm debounce
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
} 