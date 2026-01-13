import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Set base to '/archive/' so that assets are loaded from shironeko.site/archive/assets/...
  // instead of the root domain. This fixes 404 errors for JS/CSS files.
  base: '/archive/', 
  build: {
    outDir: 'dist',
  },
  server: {
    historyApiFallback: {
      rewrites: [
        { from: /^\/archive\/.*/, to: '/archive/index.html' }
      ]
    }
  },
  // Expose env vars to client code
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
  },
});