import { defineConfig } from 'vite'
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  return {
    base: mode === 'production' ? '/FRCOverviewWebsite/' : '/',
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          detail: resolve(__dirname, 'detail.html'),
        },
      },
    },
  };
});