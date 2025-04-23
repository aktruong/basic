export interface ProductVariant {
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
}

export interface CartLine {
  id: string;
  quantity: number;
  productVariant: ProductVariant;
}

export interface ActiveOrder {
  id: string;
  total: number;
  totalWithTax: number;
  subTotalWithTax: number;
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
    };
  }[];
}

export interface Cart {
  id: string;
  lines: CartLine[];
  totalWithTax: number;
  currencyCode: string;
  activeOrder: ActiveOrder | null;
} 