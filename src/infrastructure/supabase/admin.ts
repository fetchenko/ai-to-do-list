import { createClient } from '@supabase/supabase-js';

import { clientEnv } from '@/shared/env/client-env';
import { supabaseServerEnv } from '@/shared/env/server-env';

export const supabaseAdmin = createClient(
  clientEnv.NEXT_PUBLIC_SUPABASE_URL,
  supabaseServerEnv.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
