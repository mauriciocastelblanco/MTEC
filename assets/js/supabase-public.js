// Read-only Supabase client for the public site.
// Uses the publishable key — RLS limits anon to estado='publicado'.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://fpewrusowllrycpshxaq.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_y7qWg9fNlXgh8MMJCF_cOA_ms4JT671';

export const supabasePublic = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

export const CATEGORIA_LABEL = {
  'servicios-especializados': 'Servicios Especializados',
  'representacion': 'Representación',
  'comercializacion': 'Comercialización',
};
