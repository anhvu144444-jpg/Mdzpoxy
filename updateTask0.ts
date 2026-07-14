import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

const config = { id: 'review_0', name: 'REVIEW - TASK POINTS 0', reward: 10000, api_url: 'https://linktot.net/api_rv_pt.php?token=d121d1761f207cb9bfde19c8be5111cb8d623d83e1e05053ec914728c9ea869c&url=', max_views: 9999, auto: false, status: 'hoạt động' };

async function main() {
   const { error } = await supabase.from('task_configs').upsert(config, { onConflict: 'id' });
   if (error) console.error(error);
   console.log("Task 'review_0' updated in DB!");
}

main();
