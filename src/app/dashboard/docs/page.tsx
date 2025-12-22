import { redirect } from 'next/navigation';

export default function DocsPage() {
  // Redirect to API docs by default
  redirect('/dashboard/docs/api');
}

