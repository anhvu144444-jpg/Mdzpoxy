import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load env variables
if (fs.existsSync('.env')) {
  dotenv.config();
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log('Testing Supabase...');
  try {
    const { data, error } = await supabase.from('user_profiles').select('*').limit(1);
    if (error) {
      console.error('Error selecting from user_profiles:', error);
    } else {
      console.log('Success selecting!', data);
      if (data && data.length > 0) {
        console.log('Available columns:', Object.keys(data[0]));
      } else {
        console.log('No rows returned, trying insert of test user...');
        const testUser = 'test_user_' + Math.floor(Math.random() * 10000);
        const { data: insertData, error: insertError } = await supabase
          .from('user_profiles')
          .insert([{ username: testUser }])
          .select();
        
        console.log('Insert results:', { insertData, insertError });
        if (insertData && insertData.length > 0) {
          console.log('Available columns from insertion:', Object.keys(insertData[0]));
          // Delete test user
          await supabase.from('user_profiles').delete().eq('username', testUser);
        }
      }
    }
  } catch (err) {
    console.error('Unexpected check error:', err);
  }
}

check();
