import api from '@/lib/api';

export const homepageService = {
  get: async () => {
    const { data } = await api.get('/homepage');
    return data;
  },

  upsert: async (payload: Record<string, unknown>) => {
    const { data } = await api.post('/homepage', payload);
    return data;
  },
};
