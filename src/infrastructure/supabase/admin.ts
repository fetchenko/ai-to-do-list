import { createClient } from '@supabase/supabase-js';

import { clientEnv } from '@/shared/env/client-env';
import { serverEnv } from '@/shared/env/server-env';

export const supabaseAdmin = createClient(
  clientEnv.NEXT_PUBLIC_SUPABASE_URL,
  serverEnv.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
