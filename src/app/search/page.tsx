// src/app/search/page.tsx
import dynamic from 'next/dynamic';

// Use dynamic import to avoid hydration issues with client components
const SearchPage = dynamic(() => import('@/components/SearchPage'), {
  ssr: false,
});

export const metadata = {
  title: 'Search Users - Socially',
  description: 'Search for users on Socially',
};

export default function Page() {
  return <SearchPage />;
}