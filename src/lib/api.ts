// src/lib/api.ts
import { useAuthStore } from '../store/authStore';

// URL dasar, jika pakai Vite proxy biasanya bisa dikosongkan. 
// Namun untuk jaga-jaga (atau jika beda port di luar AI Studio), kita set.
const BASE_URL = ''; 

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

export const api = async <T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> => {
  const token = useAuthStore.getState().token;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  let data;
  try {
    data = await response.json();
  } catch (error) {
    data = null;
  }

  if (!response.ok) {
    const message = data?.error || data?.message || 'Terjadi kesalahan pada server';
    throw new Error(message);
  }

  return data;
};

api.get = <T = any>(endpoint: string, options?: FetchOptions) => 
  api<T>(endpoint, { ...options, method: 'GET' });

api.post = <T = any>(endpoint: string, body?: any, options?: FetchOptions) => 
  api<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) });

api.patch = <T = any>(endpoint: string, body?: any, options?: FetchOptions) => 
  api<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) });

api.delete = <T = any>(endpoint: string, options?: FetchOptions) => 
  api<T>(endpoint, { ...options, method: 'DELETE' });

export default api;
