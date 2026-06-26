const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vykbdqoylynmzfeyhtfe.supabase.co';
const supabaseKey = 'sb_publishable_LUeicNsH3FDJrC698I36sw_n9AuNRV6';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Testing tables...");
  const { data: d1, error: e1 } = await supabase.from('avaliacoes').select('*').limit(1);
  console.log("avaliacoes:", { data: d1, error: e1?.message });

  const { data: d2, error: e2 } = await supabase.from('comentarios').select('*').limit(1);
  console.log("comentarios:", { data: d2, error: e2?.message });

  const { data: d3, error: e3 } = await supabase.from('avaliacoes_produtos').select('*').limit(1);
  console.log("avaliacoes_produtos:", { data: d3, error: e3?.message });
}

test();
