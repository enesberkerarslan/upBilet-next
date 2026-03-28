import api from '@/lib/api';

export const eventService = {
  getAll: async (params?: Record<string, unknown>) => {
    const { data } = await api.get('/events/get-all-events', { params });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/events/get-event-by-id/${id}`);
    return data;
  },

  create: async (payload: Record<string, unknown>) => {
    const { data } = await api.post('/events/create-event', payload);
    return data;
  },

  update: async (id: string, payload: Record<string, unknown>) => {
    const { data } = await api.put(`/events/update-event/${id}`, payload);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/events/delete-event/${id}`);
    return data;
  },

  toggleStatus: async (id: string, status: 'active' | 'inactive') => {
    const { data } = await api.patch(`/events/update-event-status/${id}`, { status });
    return data;
  },
};
