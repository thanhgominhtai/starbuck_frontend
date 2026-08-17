export const environment = {
  production: true,
  // Khi chạy trên VPS, Nginx sẽ reverse proxy từ /api sang backend NestJS port 3000
  // Nếu bạn muốn trỏ trực tiếp tên miền có thể để: 'https://yourdomain.com/api' hoặc để '/api'
  apiUrl: '/api',
  sseUrl: '/api/realtime/events',
};
