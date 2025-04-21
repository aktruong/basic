const API_URL = 'http://14.225.255.182:3000/shop-api';

// Cache for requests
const requestCache = new Map<string, Promise<any>>();

export async function vendureFetch<T>(query: string, variables = {}): Promise<T> {
  try {
    // Create cache key from query and variables
    const cacheKey = JSON.stringify({ query, variables });

    // Check if request is already in progress
    if (requestCache.has(cacheKey)) {
      return requestCache.get(cacheKey) as Promise<T>;
    }

    // Create new request
    const request = fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'vendure-token': process.env.NEXT_PUBLIC_VENDURE_TOKEN || 'cahoicobadalat',
      },
      credentials: 'include',
      body: JSON.stringify({
        query,
        variables,
      }),
    }).then(async (response) => {
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const json = await response.json();
      
      if (json.errors) {
        console.error('GraphQL Errors:', json.errors);
        throw new Error(json.errors[0].message);
      }

      return json;
    });

    // Cache the request
    requestCache.set(cacheKey, request);

    // Remove from cache when done
    request.finally(() => {
      requestCache.delete(cacheKey);
    });

    return request as Promise<T>;
  } catch (error) {
    console.error('Error in vendureFetch:', error);
    throw error;
  }
}

export const GET_PRODUCTS = `
  query GetProducts {
    products(options: { take: 100 }) {
      items {
        id
        name
        slug
        description
        featuredAsset {
          preview
        }
        variants {
          id
          name
          price
          currencyCode
        }
      }
    }
  }
`;

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  featuredAsset?: {
    preview: string;
  };
  variants: {
    id: string;
    name: string;
    price: number;
    currencyCode: string;
  }[];
}

export interface ProductsResponse {
  data: {
    products: {
      items: Product[];
    };
  };
}

export const GET_COLLECTIONS = `
  query GetCollections {
    collections {
      items {
        id
        name
        slug
        featuredAsset {
          preview
        }
      }
    }
  }
`;

export interface Collection {
  id: string;
  name: string;
  slug: string;
  featuredAsset?: {
    preview: string;
  };
}

export interface CollectionsResponse {
  collections: {
    items: Collection[];
  };
}

export const GET_COLLECTION_PRODUCTS = `
  query GetCollectionWithVariants($slug: String!) {
    collection(slug: $slug) {
      id
      name
      slug
      productVariants {
        items {
          id
          sku
          name
          priceWithTax
          currencyCode
          featuredAsset {
            preview
          }
        }
      }
    }
  }
`;

export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  priceWithTax: number;
  currencyCode: string;
  enabled: boolean;
  featuredAsset?: {
    preview: string;
  };
}

export interface CollectionProductsResponse {
  data: {
    collection: {
      id: string;
      name: string;
      slug: string;
      products: {
        items: Array<{
          id: string;
          name: string;
          slug: string;
          description: string;
          featuredAsset?: {
            preview: string;
          };
          variants: Array<{
            id: string;
            name: string;
            priceWithTax: number;
            currencyCode: string;
          }>;
        }>;
      };
    };
  };
}

export const ADD_TO_CART = `
  mutation AddItemToCart($productVariantId: ID!, $quantity: Int!) {
    addItemToOrder(productVariantId: $productVariantId, quantity: $quantity) {
      ... on Order {
        id
        totalQuantity
        total
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export interface AddToCartResponse {
  addItemToOrder: {
    id?: string;
    totalQuantity?: number;
    total?: number;
    errorCode?: string;
    message?: string;
  };
}

export interface CartItem {
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

export interface ActiveOrder {
  id: string;
  code: string;
  state: string;
  total: number;
  totalWithTax: number;
  totalQuantity: number;
  lines: CartItem[];
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    emailAddress: string;
    phoneNumber: string;
  };
  shippingAddress?: {
    fullName: string;
    streetLine1: string;
    streetLine2?: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
    phoneNumber: string;
  };
  shippingLines?: {
    shippingMethod: {
      id: string;
      name: string;
    };
    priceWithTax: number;
  }[];
}

export interface ActiveOrderResponse {
  data: {
    activeOrder: ActiveOrder;
  };
}

export const GET_PRODUCT = `
  query GetProduct($slug: String!) {
    product(slug: $slug) {
      id
      name
      slug
      description
      featuredAsset {
        preview
      }
      variants {
        id
        sku
        name
        priceWithTax
        currencyCode
        featuredAsset {
          preview
        }
      }
    }
  }
`;

export interface ProductResponse {
  data: {
    product: {
      id: string;
      name: string;
      slug: string;
      description: string;
      featuredAsset?: {
        id: string;
        name: string;
        source: string;
        preview: string;
        width: number;
        height: number;
      };
      variants: Array<{
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
      }>;
    };
  };
}

export const ADJUST_ORDER_LINE = `
  mutation AdjustOrderLine($orderLineId: ID!, $quantity: Int!) {
    adjustOrderLine(orderLineId: $orderLineId, quantity: $quantity) {
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
            sku
            name
            priceWithTax
            currencyCode
            featuredAsset {
              preview
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

export const SET_CUSTOMER_FOR_ORDER = `
  mutation SetCustomerForOrder($input: CreateCustomerInput!) {
    setCustomerForOrder(input: $input) {
      ... on Order {
        id
        code
        state
        total
        totalQuantity
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
`;

export interface CreateCustomerInput {
  firstName: string;
  lastName: string;
  emailAddress: string;
  phoneNumber: string;
}

export async function setCustomerForOrder(input: CreateCustomerInput) {
  return vendureFetch<{ data: { setCustomerForOrder: { id: string } } }>(SET_CUSTOMER_FOR_ORDER, { input });
}

export const SET_ORDER_SHIPPING_ADDRESS = `
  mutation SetOrderShippingAddress($input: CreateAddressInput!) {
    setOrderShippingAddress(input: $input) {
      ... on Order {
        id
        code
        state
        total
        totalQuantity
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const GET_ELIGIBLE_SHIPPING_METHODS = `
  query GetEligibleShippingMethods {
    eligibleShippingMethods {
      id
      name
      description
      price
      priceWithTax
      code
    }
  }
`;

export const GET_ELIGIBLE_PAYMENT_METHODS = `
  query GetEligiblePaymentMethods {
    eligiblePaymentMethods {
      id
      name
      code
      isEligible
    }
  }
`;

export const SET_SHIPPING_METHOD = `
  mutation SetShippingMethod($id: [ID!]!) {
    setOrderShippingMethod(shippingMethodId: $id) {
      ... on Order {
        id
        shippingLines {
          shippingMethod {
            name
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

export const ADD_PAYMENT_TO_ORDER = `
  mutation AddPaymentToOrder($input: PaymentInput!) {
    addPaymentToOrder(input: $input) {
      ... on Order {
        id
        state
        payments {
          id
          method
          state
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const TRANSITION_ORDER_TO_STATE = `
  mutation TransitionOrderToState($state: String!) {
    transitionOrderToState(state: $state) {
      ... on Order {
        id
        code
        state
        total
        totalQuantity
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export interface CreateAddressInput {
  fullName: string;
  phoneNumber: string;
  streetLine1: string;
  streetLine2?: string;
  city: string;
  province: string;
  postalCode?: string;
  countryCode: string;
}

export async function setOrderShippingAddress(input: CreateAddressInput) {
  return vendureFetch<{ data: { setOrderShippingAddress: { id: string } } }>(SET_ORDER_SHIPPING_ADDRESS, { input });
}

export async function setShippingMethod(shippingMethodId: string) {
  return vendureFetch<{ data: { setOrderShippingMethod: { id: string } } }>(SET_SHIPPING_METHOD, { id: [shippingMethodId] });
}

export async function transitionOrderToState(state: string) {
  return vendureFetch<{ data: { transitionOrderToState: { id: string } } }>(TRANSITION_ORDER_TO_STATE, { state });
}

export interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  priceWithTax: number;
  currencyCode: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  isEligible: boolean;
}

export interface EligibleShippingMethodsResponse {
  data: {
    eligibleShippingMethods: ShippingMethod[];
  };
}

export const getEligibleShippingMethods = async (): Promise<EligibleShippingMethodsResponse> => {
  const query = `
    query GetEligibleShippingMethods {
      eligibleShippingMethods {
        id
        name
        description
        price
        priceWithTax
        code
      }
    }
  `;
  return vendureFetch<EligibleShippingMethodsResponse>(query);
};

export interface EligiblePaymentMethodsResponse {
  data: {
    eligiblePaymentMethods: PaymentMethod[];
  };
}

export async function getEligiblePaymentMethods(): Promise<EligiblePaymentMethodsResponse> {
  const query = `
    query GetEligiblePaymentMethods {
      eligiblePaymentMethods {
        id
        name
        code
        isEligible
      }
    }
  `;
  return vendureFetch<EligiblePaymentMethodsResponse>(query);
}

export async function getActiveOrder(): Promise<ActiveOrderResponse> {
  return vendureFetch<ActiveOrderResponse>(GET_ACTIVE_ORDER);
}

export const GET_ACTIVE_ORDER = `
  query GetActiveOrder {
    activeOrder {
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
          price
          priceWithTax
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
`;

export interface PaymentInput {
  method: string;
  metadata: {
    [key: string]: string;
  };
}

export async function addPaymentToOrder(input: PaymentInput) {
  return vendureFetch<{ data: { addPaymentToOrder: { id: string } } }>(ADD_PAYMENT_TO_ORDER, { input });
}