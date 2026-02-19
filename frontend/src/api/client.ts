export interface Translation {
  id: string;
  phrase_id: string;
  language: string;
  native_text: string;
  romanized_text?: string;
  detail?: string;
  created_at: string;
}

export interface Phrase {
  id: string;
  input_text: string;
  created_at: string;
  translations: Translation[];
}

export interface Config {
  languages: string[];
}

export interface DetailResponse {
  translation_id: string;
  detail: string;
}

const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  translate: (text: string, languages?: string[]) =>
    request<Phrase>('/translate', {
      method: 'POST',
      body: JSON.stringify({ text, languages }),
    }),

  getDetail: (translationId: string) =>
    request<DetailResponse>(`/detail/${translationId}`),

  getHistory: () => request<Phrase[]>('/history'),

  getHistoryItem: (id: string) => request<Phrase>(`/history/${id}`),

  getConfig: () => request<Config>('/config'),

  updateConfig: (languages: string[]) =>
    request<Config>('/config', {
      method: 'PUT',
      body: JSON.stringify({ languages }),
    }),

  tts: async (text: string, language: string): Promise<Blob> => {
    const res = await fetch(`${BASE}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language }),
    });
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || `HTTP ${res.status}`);
    }
    return res.blob();
  },
};
