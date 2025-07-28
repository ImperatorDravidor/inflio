import { createBrowserClient } from '@supabase/ssr';
import { useAuth } from '@clerk/nextjs';

export function createSupabaseClientWithClerkAuth() {
  const { getToken } = useAuth();
  
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: async (url, options = {}) => {
          // Get Clerk session token
          const clerkToken = await getToken({ template: 'supabase' });
          
          // Create headers
          const headers = new Headers(options.headers);
          
          // If we have a Clerk token, use it as Supabase auth
          if (clerkToken) {
            headers.set('Authorization', `Bearer ${clerkToken}`);
          }
          
          return fetch(url, {
            ...options,
            headers,
          });
        },
      },
    }
  );
}