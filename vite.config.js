import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Cache file tĩnh (Icon, Nhạc, Thumbnail) để load nhanh hơn
      includeAssets: [
          'favicon.ico', 
          'apple-touch-icon.png', 
          'thumbnail.png', 
          'icon-192.png', 
          'icon-512.png',
          'sounds/*.mp3'
      ],
      
      manifest: {
        name: 'Kỳ Vương Online',
        short_name: 'Kỳ Vương',
        description: 'Game Cờ Tướng Online Realtime - Leo Rank Đỉnh Cao',
        theme_color: '#1e293b',      // Màu thanh trạng thái Android (trùng màu nền)
        background_color: '#1e293b', // Màu nền khi khởi động App
        display: 'standalone',       // Chế độ Full màn hình (ẩn thanh URL)
        orientation: 'portrait',     // Khóa màn hình dọc
        start_url: '/',              // Mở trang chủ khi bấm vào icon
        
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' // Cho phép Android bo tròn icon cho đẹp
          }
        ]
      }
    })
  ],
})