import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

export const SUPABASE_URL = 'https://fpewrusowllrycpshxaq.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_y7qWg9fNlXgh8MMJCF_cOA_ms4JT671';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'mtec-admin-auth'
  }
});
