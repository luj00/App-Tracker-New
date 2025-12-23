import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    open: '/src/pages/home.html'
  }
});