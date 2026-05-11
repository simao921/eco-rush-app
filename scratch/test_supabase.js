
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpload() {
  try {
    const fileName = `test-${Date.now()}.txt`;
    const { data, error } = await supabase.storage
      .from('videos')
      .upload(fileName, 'test content');

    if (error) {
      console.error("Upload Error:", JSON.stringify(error, null, 2));
    } else {
      console.log("Upload Success:", data);
      const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(fileName);
      console.log("Public URL:", publicUrl);
    }
  } catch (err) {
    console.error("Internal Error:", err);
  }
}

testUpload();
