import api from '@/lib/api';

export const listingService = {
  getAll: async (params?: Record<string, unknown>) => {
    const { data } = await api.get('/listings/get-all-listings', { params });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/listings/get-listing-by-id/${id}`);
    return data;
  },

  getByEvent: async (eventId: string) => {
    const { data } = await api.get(`/listings/get-listings-by-event/${eventId}`);
    return data;
  },

  create: async (payload: Record<string, unknown>) => {
    const { data } = await api.post('/listings/create-listing', payload);
    return data;
  },

  update: async (id: string, payload: Record<string, unknown>) => {
    const { data } = await api.put(`/listings/update-listing/${id}`, payload);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/listings/delete-listing/${id}`);
    return data;
  },

  toggleStatus: async (id: string) => {
    const { data } = await api.patch(`/listings/status-change/${id}`);
    return data;
  },

  /** Üyenin bir etkinlikteki ilanlarını toplu aktif/pasif yap (admin) */
  toggleAllMemberEvent: async (payload: {
    memberId: string;
    eventId: string;
    status: 'active' | 'inactive';
  }) => {
    const { data } = await api.patch('/listings/toggle-all-member-event', payload);
    return data;
  },
};
