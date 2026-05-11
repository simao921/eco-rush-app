import { supabase } from '@/lib/supabaseClient';
import { analyzeWithAI } from '@/lib/analyzeClient';
export { supabase };

const mapFields = (item) => {
  if (!item) return item;
  return item;
};

const mapList = (list) => (list || []).map(mapFields);

export const base44 = {
  entities: {
    Classroom: {
      list: async () => {
        const { data, error } = await supabase.from('Classroom').select('*').order('total_points', { ascending: false });
        if (error) throw error;
        return mapList(data);
      },
      filter: async (filters) => {
        let query = supabase.from('Classroom').select('*');
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
        const { data, error } = await query;
        if (error) throw error;
        return mapList(data);
      },
      get: async (id) => {
        const { data, error } = await supabase.from('Classroom').select('*').eq('id', id).single();
        if (error) throw error;
        return mapFields(data);
      },
      create: async (data) => {
        const { data: created, error } = await supabase.from('Classroom').insert(data).select().single();
        if (error) throw error;
        return mapFields(created);
      },
      update: async (id, data) => {
        const { data: updated, error } = await supabase.from('Classroom').update(data).eq('id', id).select().single();
        if (error) throw error;
        return mapFields(updated);
      },
      delete: async (id) => {
        const { error } = await supabase.from('Classroom').delete().eq('id', id);
        if (error) throw error;
      }
    },
    EcoAction: {
      list: async (order = '-created_date', limit = 100) => {
        const desc = order.startsWith('-');
        const field = desc ? order.substring(1) : order;
        const { data, error } = await supabase.from('EcoAction')
          .select('*')
          .order(field, { ascending: !desc })
          .limit(limit);
        if (error) throw error;
        return mapList(data);
      },
      filter: async (filters) => {
        let query = supabase.from('EcoAction').select('*');
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
        const { data, error } = await query.order('created_date', { ascending: false });
        if (error) throw error;
        return mapList(data);
      },
      create: async (data) => {
        const { data: created, error } = await supabase.from('EcoAction').insert(data).select().single();
        if (error) throw error;
        return mapFields(created);
      },
      update: async (id, data) => {
        const { data: updated, error } = await supabase.from('EcoAction').update(data).eq('id', id).select().single();
        if (error) throw error;
        return mapFields(updated);
      },
      delete: async (id) => {
        const { error } = await supabase.from('EcoAction').delete().eq('id', id);
        if (error) throw error;
      }
    },
    FeedPost: {
      list: async (order = '-created_date', limit = 100) => {
        const desc = order.startsWith('-');
        const field = desc ? order.substring(1) : order;
        const { data } = await supabase.from('FeedPost')
          .select('*')
          .order(field, { ascending: !desc })
          .limit(limit);
        return mapList(data);
      },
      create: async (data) => {
        const { data: created } = await supabase.from('FeedPost').insert(data).select().single();
        return mapFields(created);
      },
      update: async (id, data) => {
        const { data: updated } = await supabase.from('FeedPost').update(data).eq('id', id).select().single();
        return mapFields(updated);
      }
    },
    NewsPost: {
      list: async (order = '-created_date', limit = 100) => {
        const desc = order.startsWith('-');
        const field = desc ? order.substring(1) : order;
        const { data } = await supabase.from('NewsPost')
          .select('*')
          .order('pinned', { ascending: false })
          .order(field, { ascending: !desc })
          .limit(limit);
        return mapList(data);
      },
      get: async (id) => {
        const { data } = await supabase.from('NewsPost').select('*').eq('id', id).single();
        return mapFields(data);
      }
    }
  },
  auth: {
    me: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data: profile } = await supabase.from('User').select('*').eq('id', user.id).single();
      return { ...user, ...profile };
    },
    logout: async () => {
      await supabase.auth.signOut();
    }
  },
  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('videos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('videos')
          .getPublicUrl(filePath);

        return { file_url: publicUrl };
      },
      InvokeLLM: async (args) => {
        return analyzeWithAI({
          file_urls: args.file_urls,
          prompt: args.prompt,
          model: args.model,
        });
      }
    }
  }
};
