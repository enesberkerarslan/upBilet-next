import api from '@/lib/api';

export const saleService = {
  getAll: async (params?: Record<string, unknown>) => {
    const { data } = await api.get('/sales', { params });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/sales/${id}`);
    return data;
  },

  getByStatus: async (status: string) => {
    const { data } = await api.get(`/sales/filter/status`, { params: { status } });
    return data;
  },

  getByEventId: async (eventId: string) => {
    const { data } = await api.get(`/sales/filter/event`, { params: { eventId } });
    return data;
  },

  /** Body: { success, data: { asSeller, asBuyer } } */
  getByMemberId: async (memberId: string) => {
    const { data } = await api.get(`/sales/filter/member`, { params: { memberId } });
    return data;
  },

  approve: async (id: string) => {
    const { data } = await api.patch(`/sales/${id}/approve`);
    return data;
  },

  /** Tek bilet teslim onayı → hepsi delivered olunca satış completed */
  approveTicket: async (id: string, ticketIndex: number) => {
    const { data } = await api.patch(`/sales/${id}/approve-ticket`, { ticketIndex });
    return data;
  },

  /** Bilet teslim durumu (pending / delivered / failed) — satış özeti ile birlikte güncellenir */
  updateTicketHolderDelivery: async (
    id: string,
    ticketHolderIndex: number,
    deliveryStatus: string,
    deliveredAt?: string | null
  ) => {
    const { data } = await api.patch(`/sales/${id}/ticket-holder-delivery`, {
      ticketHolderIndex,
      deliveryStatus,
      ...(deliveredAt !== undefined ? { deliveredAt } : {}),
    });
    return data;
  },

  /** Tüm biletleri teslim onayla → satış completed + teslim e-postası */
  approveAllTickets: async (id: string) => {
    const { data } = await api.patch(`/sales/${id}/approve-all-tickets`, {});
    return data;
  },

  cancel: async (id: string, reason?: string) => {
    const { data } = await api.patch(`/sales/${id}/cancel`, { reason });
    return data;
  },

  refund: async (id: string, reason?: string) => {
    const { data } = await api.patch(`/sales/${id}/refund`, { reason });
    return data;
  },

  update: async (id: string, body: Record<string, unknown>) => {
    const { data } = await api.patch(`/sales/${id}`, body);
    return data;
  },

  /** Tek bilet sahibi alanları (sale.model ticketHolderSchema) */
  updateTicketHolderInfo: async (
    id: string,
    ticketHolderIndex: number,
    updateData: Record<string, unknown>
  ) => {
    const { data } = await api.patch(`/sales/${id}/ticket-holder-info`, {
      ticketHolderIndex,
      updateData,
    });
    return data;
  },

  /**
   * Admin: bilet satırına kanıt (S3). API: istek başına tek dosya, bilet başına en fazla 5.
   * `files` genelde tek elemanlı dizi.
   */
  uploadTicketHolderSellerProof: async (saleId: string, ticketIndex: number, files: File[]) => {
    const fd = new FormData();
    for (const f of files) {
      fd.append('files', f);
    }
    const res = await fetch(
      `/api/proxy/sales/${saleId}/ticket-holders/${ticketIndex}/seller-proof`,
      {
        method: 'POST',
        body: fd,
        credentials: 'same-origin',
      }
    );
    if (res.status === 401) {
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    const json = (await res.json()) as {
      success?: boolean;
      data?: unknown;
      message?: string;
    };
    if (!res.ok) {
      throw new Error(
        (typeof json.message === 'string' && json.message) || 'Yükleme başarısız'
      );
    }
    return json;
  },
};
