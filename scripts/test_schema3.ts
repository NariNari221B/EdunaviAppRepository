import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const res = await supabase.from('tasks').select('id, title, month, description, tags, steps, author_id, created_at, updated_at').limit(1);
  console.log("Tasks:", res.error ? res.error : res.data);
}
test();
