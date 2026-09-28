import type { Metadata } from 'next';
import { SearchClientView } from '../../components/search-client-view';

export const metadata: Metadata = {
  title: 'Search Symptoms & Evidence | PHASE',
  description: 'Explore evidence-informed PCOS clinical literature, ovulatory mechanisms, and symptom patterns powered by Databricks Lakehouse Vector Search.',
};

export default function SearchPage() {
  return <SearchClientView />;
}
