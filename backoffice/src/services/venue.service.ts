import api from '@/lib/api';

export const venueService = {
  getAll: async () => {
    const { data } = await api.get('/venue-structures');
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/venue-structures/${id}`);
    return data;
  },

  create: async (payload: Record<string, unknown>) => {
    const { data } = await api.post('/venue-structures', payload);
    return data;
  },

  update: async (id: string, payload: Record<string, unknown>) => {
    const { data } = await api.put(`/venue-structures/${id}`, payload);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/venue-structures/${id}`);
    return data;
  },

  addCategory: async (structureId: string, body: { name: string }) => {
    const { data } = await api.post(`/venue-structures/${structureId}/categories`, body);
    return data;
  },

  updateCategory: async (structureId: string, categoryId: string, body: { name: string }) => {
    const { data } = await api.put(`/venue-structures/${structureId}/categories/${categoryId}`, body);
    return data;
  },

  deleteCategory: async (structureId: string, categoryId: string) => {
    const { data } = await api.delete(`/venue-structures/${structureId}/categories/${categoryId}`);
    return data;
  },

  addBlock: async (structureId: string, categoryId: string, body: { name: string }) => {
    const { data } = await api.post(
      `/venue-structures/${structureId}/categories/${categoryId}/blocks`,
      body
    );
    return data;
  },

  updateBlock: async (structureId: string, categoryId: string, blockId: string, body: { name: string }) => {
    const { data } = await api.put(
      `/venue-structures/${structureId}/categories/${categoryId}/blocks/${blockId}`,
      body
    );
    return data;
  },

  deleteBlock: async (structureId: string, categoryId: string, blockId: string) => {
    const { data } = await api.delete(
      `/venue-structures/${structureId}/categories/${categoryId}/blocks/${blockId}`
    );
    return data;
  },
};
