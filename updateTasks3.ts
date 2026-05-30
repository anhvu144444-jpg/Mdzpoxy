import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

const tasks = [
  { id: 'layma', name: 'LAYMA', reward: 200, api_url: 'https://api.layma.net/api/admin/shortlink/quicklink?tokenUser=de2c099a8fd17d1cc6c7068209e5fa5d&format=json&url=', max_views: 2, auto: true, status: 'hoạt động' },
  { id: 'link4m', name: 'LINK4M', reward: 200, api_url: 'https://link4m.co/api-shorten/v2?api=6a1135a08ac8591acf160a78&url=', max_views: 2, auto: true, status: 'hoạt động' },
  { id: 'linktot', name: 'LINKTOT', reward: 200, api_url: 'https://linktot.net/JSON_QL_API.php?token=d121d1761f207cb9bfde19c8be5111cb8d623d83e1e05053ec914728c9ea869c&url=', max_views: 4, auto: true, status: 'hoạt động' },
  { id: 'bbmkts', name: 'BBMKTS', reward: 200, api_url: 'https://linktot.net/api_timmap_pt.php?token=d121d1761f207cb9bfde19c8be5111cb8d623d83e1e05053ec914728c9ea869c&url=', max_views: 1, auto: true, status: 'hoạt động' },
  { id: 'utl_1step', name: 'UTL 1 STEP', reward: 200, api_url: 'https://uptolink.one/api?api=94eeedcdf3928b7bb78a89c19bad78274a69b830&type=2&url=', max_views: 1234, auto: true, status: 'hoạt động' },
  { id: 'utl_2step', name: 'UTL 2 STEP', reward: 210, api_url: 'https://uptolink.one/api?api=94eeedcdf3928b7bb78a89c19bad78274a69b830&type=4&url=', max_views: 4567, auto: true, status: 'hoạt động' },
  { id: 'utl_3step', name: 'UTL 3 STEP', reward: 220, api_url: 'https://uptolink.one/api?api=94eeedcdf3928b7bb78a89c19bad78274a69b830&type=3&url=', max_views: 78910, auto: true, status: 'hoạt động' },
  { id: 'utl_4step', name: 'UTL 4 STEP', reward: 230, api_url: 'https://uptolink.one/api?api=94eeedcdf3928b7bb78a89c19bad78274a69b830&type=5&url=', max_views: 11121314, auto: true, status: 'hoạt động' },
  { id: 'review_map', name: 'REVIEW MAP', reward: 1000, api_url: '', max_views: 2207, auto: false, status: 'hoạt động' },
  { id: 'review_trip', name: 'REVIEW TRIP', reward: 1000, api_url: '', max_views: 2207, auto: false, status: 'hoạt động' },
  { id: 'review_app', name: 'REVIEW APP', reward: 200, api_url: '', max_views: 2207, auto: false, status: 'hoạt động' },
  { id: 'ads_qc', name: 'ADS QC', reward: 0.0000000000000000001, api_url: 'https://socialconventcontext.com/r5qq3q89gz?key=b04168125e1c482ac46f605cad3f081e', max_views: 2147483647, auto: true, status: 'hoạt động' },
];

async function main() {
  for (const task of tasks) {
     const { error } = await supabase.from('task_configs').upsert(task, { onConflict: 'id' });
     if (error) console.error(error);
  }
}
main();
