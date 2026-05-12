import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [k, v] = line.split('=');
  if (k && v) acc[k.trim()] = v.trim();
  return acc;
}, {});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function testInsert() {
  const { data: classrooms } = await supabase.from('Classroom').select('*').limit(1);
  if (!classrooms || classrooms.length === 0) {
    console.log("No classrooms found");
    return;
  }
  const classroom = classrooms[0];

  console.log("Attempting insert into EcoAction...");
  const { data, error } = await supabase.from('EcoAction').insert([{
    classroom_id: classroom.id,
    classroom_name: classroom.name,
    action_type: 'apagar_luzes',
    points: 5,
    status: "aprovada",
    registered_by: "turma",
    ai_valid: true
  }]).select().single();

  if (error) {
    console.error("Insert Error Object:", JSON.stringify(error, null, 2));
  } else {
    console.log("Insert Success:", data);
  }
}

testInsert();
