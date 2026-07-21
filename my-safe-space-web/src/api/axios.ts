import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000', // URL ของ Hono Backend
});

// แนบ Token ไปใน Header อัตโนมัติถ้ามี
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;