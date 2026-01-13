import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Serve from domain root (using a dedicated subdomain like archive.shironeko.site)
  base: '/', 
  build: {
    outDir: 'dist',
  },
  // Expose env vars to client code
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
  },
});