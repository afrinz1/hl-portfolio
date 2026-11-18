import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          // recharts is only used by the /trust analytics page. Giving it (and
          // the d3 helpers it pulls in) its own chunk keeps that ~500 kB
          // dependency out of the route chunk, so it can be cached and
          // downloaded separately from the page code.
          manualChunks(id: string) {
            if (
              id.includes('node_modules/recharts') ||
              id.includes('node_modules/victory-vendor') ||
              id.includes('node_modules/d3-')
            ) {
              return 'charts';
            }
            return undefined;
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': {
          target:
            process.env.VITE_API_PROXY_TARGET ??
            env.VITE_API_PROXY_TARGET ??
            'http://127.0.0.1:8000',
          changeOrigin: true,
        },
      },
    },
  };
});
