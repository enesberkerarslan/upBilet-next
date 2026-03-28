import api from '@/lib/api';

export const mediaService = {
  getAll: async (params?: Record<string, unknown>) => {
    const { data } = await api.get('/media', { params });
    return data;
  },

  upload: async (formData: FormData) => {
    // FormData için fetch: boundary otomatik; axios varsayılanı application/json ile çakışmaz.
    const res = await fetch('/api/proxy/media/upload', {
      method: 'POST',
      body: formData,
      credentials: 'same-origin',
    });
    if (res.status === 401) {
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    const json = (await res.json()) as {
      data?: unknown;
      message?: string;
      error?: string;
    };
    if (!res.ok) {
      const msg =
        (typeof json.message === 'string' && json.message) ||
        (typeof json.error === 'string' && json.error) ||
        'Yükleme başarısız';
      throw new Error(msg);
    }
    return json;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/media/${id}`);
    return data;
  },
};
