// Barrel exports for easier imports
// Use server.ts for Server Components and Route Handlers
// Use client.ts for Client Components

export { createClient as createServerClient } from './server';
export { createClient as createBrowserClient } from './client';
export { updateSession } from './middleware';
