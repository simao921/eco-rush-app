import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [k, v] = line.split('=');
  if (k && v) acc[k.trim()] = v.trim();
  return acc;
}, {});

async function checkColumns() {
  const res = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/?apikey=${env.VITE_SUPABASE_ANON_KEY}`);
  const openapi = await res.json();
  const ecoActionDef = openapi.definitions?.EcoAction || openapi.components?.schemas?.EcoAction;
  console.log("EcoAction columns:", JSON.stringify(ecoActionDef, null, 2));
}

checkColumns();
