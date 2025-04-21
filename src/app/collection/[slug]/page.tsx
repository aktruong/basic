import { GET_COLLECTION_PRODUCTS, CollectionProductsResponse, vendureFetch } from '@/lib/vendure';
import { CollectionContent } from './CollectionContent';
import { use } from 'react';

interface CollectionPageProps {
  params: {
    slug: string;
  };
}

export default function CollectionPage({ params }: CollectionPageProps) {
  const slug = use(Promise.resolve(params.slug));
  const data = use(vendureFetch<CollectionProductsResponse>(GET_COLLECTION_PRODUCTS, {
    slug,
  }));

  return <CollectionContent collection={data.collection} />;
} 