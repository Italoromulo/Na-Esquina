import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vykbdqoylynmzfeyhtfe.supabase.co';

const supabaseKey =
  'sb_publishable_LUeicNsH3FDJrC698I36sw_n9AuNRV6';

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);