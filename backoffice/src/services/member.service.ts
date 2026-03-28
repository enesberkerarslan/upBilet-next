import api from '@/lib/api';

export const memberService = {
  getAll: async (params?: Record<string, unknown>) => {
    const { data } = await api.get('/members/get-all-members', { params });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/members/get-member-by-id/${id}`);
    return data;
  },

  update: async (id: string, payload: Record<string, unknown>) => {
    const { data } = await api.put(`/members/update-member/${id}`, payload);
    return data;
  },

  toggleStatus: async (id: string, status: 'active' | 'inactive' | 'suspended') => {
    const { data } = await api.patch(`/members/update-member-status/${id}`, { status });
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/members/delete-member/${id}`);
    return data;
  },

  getPaymentPeriods: async (memberId: string) => {
    const { data } = await api.get(`/members/payment-periods/${memberId}`);
    return data;
  },

  addPaymentPeriod: async (memberId: string, payload: Record<string, unknown>) => {
    const { data } = await api.post(`/members/payment-periods/${memberId}`, payload);
    return data;
  },

  /** Seçilen bekleyen döneme satışı ekler (satıcı bu üye olmalı) */
  addSaleToPaymentPeriod: async (memberId: string, periodId: string, saleId: string) => {
    const { data } = await api.post(`/members/payment-periods/${memberId}/${periodId}/add-sale`, {
      saleId,
    });
    return data;
  },

  markPeriodAsPaid: async (memberId: string, periodId: string, payload?: Record<string, unknown>) => {
    const { data } = await api.patch(`/members/payment-periods/${memberId}/${periodId}/pay`, payload);
    return data;
  },

  deletePaymentPeriod: async (memberId: string, periodId: string) => {
    const { data } = await api.delete(`/members/payment-periods/${memberId}/${periodId}`);
    return data;
  },
};
