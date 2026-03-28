import api from '@/lib/api';

export const tagService = {
  getAll: async (params?: Record<string, unknown>) => {
    const { data } = await api.get('/tags/get-all-tags', { params });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/tags/get-tag-by-id/${id}`);
    return data;
  },

  create: async (payload: Record<string, unknown>) => {
    const { data } = await api.post('/tags/create-tag', payload);
    return data;
  },

  update: async (id: string, payload: Record<string, unknown>) => {
    const { data } = await api.put(`/tags/update-tag/${id}`, payload);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/tags/delete-tag/${id}`);
    return data;
  },
};
