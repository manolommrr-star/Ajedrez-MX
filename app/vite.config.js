import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

/**
 * Configuración de Vite para AjedrezMX.
 * - base relativa: el build funciona en cualquier subcarpeta (GitHub Pages)
 * - alias @ → src: importaciones cortas y estables
 */
export default defineConfig({
  base: './',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    open: false
  }
});