import api from '@/lib/api';
import type { HomePage } from '@/types';

type HomepageApiEnvelope = { success: boolean; homepage: HomePage | null };

export const homepageService = {
  /** Backend: `{ success, homepage }` — tek belgeyi döndürür. */
  get: async (): Promise<HomePage | null> => {
    const { data } = await api.get<HomepageApiEnvelope>('/homepage');
    return data.homepage ?? null;
  },

  upsert: async (payload: Record<string, unknown>) => {
    const { data } = await api.post<HomepageApiEnvelope>('/homepage', payload);
    return data;
  },
};
