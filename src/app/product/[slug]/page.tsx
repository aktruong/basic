import { ProductData } from './ProductData';

export default function Page({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: Record<string, string | string[]>;
}) {
  return <ProductData slug={params.slug} />;
} 