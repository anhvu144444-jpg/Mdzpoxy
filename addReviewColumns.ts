import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function main() {
  const { error: e1 } = await supabase.rpc('exec_sql', { sql: 'ALTER TABLE task_history ADD COLUMN review_url TEXT;' });
  console.log("review_url:", e1);
  const { error: e2 } = await supabase.rpc('exec_sql', { sql: 'ALTER TABLE task_history ADD COLUMN review_type TEXT;' });
  console.log("review_type:", e2);
}
main();
