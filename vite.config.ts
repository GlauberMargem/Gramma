import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Em dev, o front chama `/api` e o Vite encaminha para o backend FastAPI,
    // evitando CORS. Em produção, defina `VITE_API_URL` com a origem do backend.
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
