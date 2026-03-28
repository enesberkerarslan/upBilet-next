import axios from 'axios';

// Tüm client-side mutation istekleri Next.js proxy üzerinden geçer.
// Proxy, httpOnly cookie'deki admin_token'ı okuyup backend'e Authorization header olarak ekler.
const api = axios.create({
  baseURL: '/api/proxy',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
