// Tự động nhận diện môi trường:
// - Khi chạy Localhost: luôn trỏ về http://localhost:3000
// - Khi deploy lên Vercel: điền URL Backend thực tế của bạn vào PROD_BACKEND_URL (hoặc dùng /api)
const PROD_BACKEND_URL = 'https://starbuck-backend.vercel.app';

const isLocal =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const BASE_URL = isLocal
  ? 'http://localhost:3000'
  : PROD_BACKEND_URL && !PROD_BACKEND_URL.includes('your-backend-api')
    ? PROD_BACKEND_URL
    : '/api';

export const environment = {
  production: true,
  apiUrl: BASE_URL,
  sseUrl: BASE_URL === '/api' ? '/api/realtime/events' : `${BASE_URL}/realtime/events`,
};
