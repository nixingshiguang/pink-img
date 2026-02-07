import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const BASE_PATH = "/imgtool1/";
  return {
    base: BASE_PATH，
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg'],
        manifest: {
          name: 'PinkImg - 图片编辑工具',
          short_name: 'PinkImg',
          description: 'All-in-one Image Editor',
          theme_color: '#ec4899',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: BASE_PATH,
          scope: BASE_PATH,
          icons: [
            {
              src: `${BASE_PATH}/icon.svg`，
              sizes: '192x192'，
              type: 'image/svg+xml'
            },
            {
              src: `${BASE_PATH}/icon.svg`，
              sizes: '512x512'，
              type: 'image/svg+xml'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.')，
      }
    }
  };
});
