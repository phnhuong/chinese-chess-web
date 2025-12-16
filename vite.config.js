import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa' // Import mới

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Kỳ Vương Online',
        short_name: 'Kỳ Vương',
        description: 'Game Cờ Tướng Online Realtime',
        theme_color: '#1e293b', // Màu nền slate-800
        background_color: '#1e293b',
        display: 'standalone', // Chế độ chạy như App (ẩn thanh địa chỉ)
        icons: [
          {
            src: 'vite.svg', // Dùng tạm icon này
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'vite.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
})