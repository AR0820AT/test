import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { installNoZoom } from './composables/useNoZoom'
import { ensureFonts } from './utils/fonts'
import './styles/tokens.css'
import './styles/base.css'

createApp(App).use(createPinia()).mount('#app')

// 再用 FontFace API 注册一遍自托管字体：有些手机浏览器会丢掉 CSS 里的 @font-face
ensureFonts()

// 禁止双击放大与双指缩放，避免聊天界面被撑变形
installNoZoom()

// 生产环境注册 Service Worker，实现离线与「添加到主屏幕」
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    const swUrl = new URL('sw.js', window.location.href)
    navigator.serviceWorker.register(swUrl).catch((error) => {
      console.warn('[card-chat] Service Worker 注册失败', error)
    })
  })
}
