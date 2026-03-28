import api from '@/lib/api';
import type {
  SupportTopicListItem,
  SupportTopicDetailPayload,
} from '@/types';

type ListResponse = {
  success: boolean;
  data?: {
    items: SupportTopicListItem[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  };
  message?: string;
};

type DetailResponse = {
  success: boolean;
  data?: SupportTopicDetailPayload;
  message?: string;
};

async function parseJson(res: Response) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { message: text };
  }
}

const emptyPagination = { page: 1, limit: 30, total: 0, totalPages: 1 };

export const supportService = {
  async listTopics(params?: { status?: string; page?: number; limit?: number }) {
    const { data } = await api.get<ListResponse>('/support/topics', { params });
    if (!data?.success || !data.data) {
      return { items: [] as SupportTopicListItem[], pagination: { ...emptyPagination } };
    }
    return data.data;
  },

  async getTopic(id: string): Promise<SupportTopicDetailPayload | null> {
    const { data } = await api.get<DetailResponse>(`/support/topics/${id}`);
    if (!data?.success || !data.data) return null;
    return data.data;
  },

  async setTopicStatus(id: string, status: 'open' | 'closed') {
    const { data } = await api.patch<{ success: boolean; message?: string }>(
      `/support/topics/${id}`,
      { status }
    );
    return data;
  },

  /**
   * Üyeye yeni destek konusu (ilk mesaj sizden).
   * multipart: memberId, subject, body, isteğe bağlı referenceSaleId, files[]
   */
  async createTopicForMember(payload: {
    memberId: string;
    subject: string;
    body: string;
    referenceSaleId?: string;
    files: File[];
  }) {
    const form = new FormData();
    form.append('memberId', payload.memberId);
    form.append('subject', payload.subject);
    form.append('body', payload.body);
    if (payload.referenceSaleId?.trim()) {
      form.append('referenceSaleId', payload.referenceSaleId.trim());
    }
    payload.files.forEach((f) => form.append('files', f));
    const res = await fetch('/api/proxy/support/topics', {
      method: 'POST',
      body: form,
      credentials: 'same-origin',
    });
    if (res.status === 401) {
      window.location.href = '/login';
      throw new Error('Oturum gerekli');
    }
    const json = (await parseJson(res)) as {
      success?: boolean;
      data?: { topic?: { _id: string }; message?: unknown };
      message?: string;
      error?: string;
    };
    if (!res.ok || !json.success) {
      throw new Error(
        (typeof json.message === 'string' && json.message) ||
          (typeof json.error === 'string' && json.error) ||
          'Konu oluşturulamadı'
      );
    }
    return json.data;
  },

  /** JPG, PNG, WEBP veya PDF; en fazla 5 dosya */
  async postMessage(topicId: string, body: string, files: File[]) {
    const form = new FormData();
    form.append('body', body);
    files.forEach((f) => form.append('files', f));
    const res = await fetch(`/api/proxy/support/topics/${topicId}/messages`, {
      method: 'POST',
      body: form,
      credentials: 'same-origin',
    });
    if (res.status === 401) {
      window.location.href = '/login';
      throw new Error('Oturum gerekli');
    }
    const json = (await parseJson(res)) as DetailResponse & { error?: string };
    if (!res.ok) {
      throw new Error(
        (typeof json.message === 'string' && json.message) ||
          (typeof json.error === 'string' && json.error) ||
          'Mesaj gönderilemedi'
      );
    }
    return json;
  },
};
