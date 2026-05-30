import { supabase } from './src/lib/supabase.ts';
async function run() {
  const { data } = await supabase.from('user_profiles').select('*').limit(1);
  console.log(data);
}
run();
