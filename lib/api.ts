import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Fallback sur la production : un build EAS n'embarque pas .env.local (gitignoré),
// une valeur locale ici rendrait l'app publiée totalement inopérante.
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://afrydex.up.railway.app/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

// L'AuthProvider s'enregistre ici pour être prévenu quand le refresh échoue :
// sans cela les tokens sont purgés mais l'utilisateur reste sur un écran vide.
let onSessionExpired: (() => void) | null = null;
export function setSessionExpiredHandler(handler: (() => void) | null) {
  onSessionExpired = handler;
}

// Attach JWT on every request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Upload d'un média de travail (photo avant/après, justificatif) en multipart.
// L'instance force application/json par défaut : on surcharge le header par requête.
export async function uploadTravailMedia(params: {
  travail: number;
  type_media: string;
  uri: string;
  description?: string;
}) {
  const form = new FormData();
  form.append('travail', String(params.travail));
  form.append('type_media', params.type_media);
  if (params.description) form.append('description', params.description);

  const name = params.uri.split('/').pop() || `photo_${Date.now()}.jpg`;
  const ext = (name.split('.').pop() || 'jpg').toLowerCase();
  const mime = ext === 'png' ? 'image/png' : ext === 'heic' ? 'image/heic' : 'image/jpeg';
  form.append('fichier', { uri: params.uri, name, type: mime } as any);

  const { data } = await api.post('/travaux-medias/', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

// Un seul refresh à la fois : plusieurs 401 concurrents partagent la même promesse
// au lieu de déclencher autant d'appels /auth/refresh/ (qui s'invalideraient entre eux).
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refresh = await SecureStore.getItemAsync('refresh_token');
  if (!refresh) throw new Error('No refresh token');
  const { data } = await axios.post(`${API_URL}/auth/refresh/`, { refresh }, { timeout: 20000 });
  await SecureStore.setItemAsync('access_token', data.access);
  // Rotation : l'API renvoie un nouveau refresh et invalide l'ancien
  if (data.refresh) await SecureStore.setItemAsync('refresh_token', data.refresh);
  return data.access;
}

// Refresh token on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      try {
        refreshPromise = refreshPromise ?? refreshAccessToken().finally(() => { refreshPromise = null; });
        const access = await refreshPromise;
        original.headers.Authorization = `Bearer ${access}`;
        return api(original);
      } catch {
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
        await SecureStore.deleteItemAsync('must_change_password');
        onSessionExpired?.();
      }
    }
    return Promise.reject(error);
  }
);
