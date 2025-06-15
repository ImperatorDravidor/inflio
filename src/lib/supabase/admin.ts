import { createClient } from '@supabase/supabase-js'

// This is a SERVER-ONLY client. It uses the service role key and should never be exposed to the client.
export const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
); 
