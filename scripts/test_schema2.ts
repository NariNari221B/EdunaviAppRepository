import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const res1 = await supabase.from('users').select('name, role').limit(1);
  console.log("Users:", res1.error ? res1.error : res1.data);
  const res2 = await supabase.from('tips').select('id, content, created_at, likes').limit(1);
  console.log("Tips:", res2.error ? res2.error : res2.data);
}
test();
