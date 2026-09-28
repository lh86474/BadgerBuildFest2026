import type { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';
import { SearchClientView } from '../../components/search-client-view';
import { SearchPreview } from '../../components/landing-page';

export const metadata: Metadata = {
  title: 'Search Symptoms & Evidence | PHASE',
  description: 'Explore evidence-informed PMOS clinical literature, ovulatory mechanisms, and symptom patterns powered by Databricks Lakehouse Vector Search.',
};

export default async function SearchPage() {
  const { userId } = await auth();

  if (!userId) {
    return <SearchPreview />;
  }

  return <SearchClientView />;
}
