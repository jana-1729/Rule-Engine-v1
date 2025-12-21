// Legacy exports - kept for backward compatibility
// Use the new implementations in ./supabase/server.ts and ./supabase/client.ts instead

import { createBrowserClient } from '@supabase/ssr';

// Client-side instance (for browser/client components)
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// For server components, import from './supabase/server'
// For client components, import from './supabase/client'
