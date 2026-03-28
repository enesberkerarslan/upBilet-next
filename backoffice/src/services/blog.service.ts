import api from '@/lib/api';

export const blogService = {
  getAll: async (params?: Record<string, unknown>) => {
    // Response: { blogs: Blog[], currentPage, totalPages, totalBlogs }
    const { data } = await api.get('/blogs', { params });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/blogs/${id}`);
    return data;
  },

  create: async (payload: Record<string, unknown>) => {
    const { data } = await api.post('/blogs', payload);
    return data;
  },

  update: async (id: string, payload: Record<string, unknown>) => {
    // Backend admin route: PUT /blogs/:id (PATCH tanımlı değil)
    const { data } = await api.put(`/blogs/${id}`, payload);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/blogs/${id}`);
    return data;
  },
};
