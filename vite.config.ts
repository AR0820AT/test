import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// base 使用相对路径：无论 GitHub Pages 分配什么子目录都能正常加载资源
export default defineConfig({
  base: './',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // host: true 让手机在同一 WiFi 下可以直接访问电脑的调试地址
    host: true,
    port: 5173,
  },
  build: {
    target: 'es2019',
    chunkSizeWarningLimit: 1200,
  },
})
